import getSafeArea from '../../lib/utils/safe-area'
import { UserInfo } from '../../lib/types/user-info'
import { ChatSession } from '../../lib/types/chat-history'
import { appDispatch, rootStore } from '../../lib/state/states/root'
import { updateUserProfile } from '../../lib/state/actions/user'
import { subscribe } from '../../lib/state/bind'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isOpen: {
      type: Boolean,
      value: false,
    },
    chatSessions: {
      type: Array,
      value: [],
    },
    currentSessionId: {
      type: String,
      value: '',
    },
    userInfo: {
      type: Object,
      value: {
        name: '用户',
        avatar: '',
      },
    },
    cloudUserId: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    localUserInfo: null as UserInfo | null,
    isEditMode: false,
    sortedChatSessions: [] as ChatSession[],
    showNicknameDialog: false,
  },

  lifetimes: {
    attached() {
      const safeAreaData = getSafeArea()
      this.setData({
        s: {
          sidebarPaddingTop:
            safeAreaData.isDevtools || safeAreaData.isAndroid
              ? `padding-top: ${safeAreaData.safeAreaTop}px`
              : ``,
        },
      })
      
      // 订阅全局用户信息
      this.subscribeUser()
    },
    detached() {
      // @ts-expect-error 保存到实例
      this._unsubUser?.()
    }
  },

  observers: {
    'chatSessions': function(chatSessions: ChatSession[]) {
      // 按最新更新时间倒序排序
      const sorted = [...chatSessions].sort((a, b) => b.updatedAt - a.updatedAt)
      
      // 如果当前在编辑模式且会话数量减少，说明有会话被删除，自动退出编辑模式
      if (this.data.isEditMode && chatSessions.length < this.data.sortedChatSessions.length) {
        console.log('检测到会话删除，自动退出编辑模式')
        this.setData({
          isEditMode: false
        })
      }
      
      this.setData({
        sortedChatSessions: sorted
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 通过 open-type="chooseAvatar" 获取系统头像
    async onChooseAvatar(e: any) {
      try {
        const avatarUrl = e?.detail?.avatarUrl
        if (!avatarUrl) return

        // 更新头像到云端和本地
        const updated = await appDispatch(updateUserProfile({ avatar: avatarUrl }))
        console.log('头像已更新:', updated)
        
        const current = this.data.localUserInfo
        this.setData({
          localUserInfo: {
            id: current?.id || '',
            nickname: (current?.nickname && current.nickname.trim()) ? current.nickname : '用户',
            avatar: avatarUrl,
            gender: current?.gender || 0,
            createdAt: current?.createdAt || Date.now(),
            updatedAt: Date.now(),
          }
        })
        wx.showToast({ title: '头像更新成功', icon: 'success' })
      } catch (error) {
        console.error('更新头像失败:', error)
        wx.showToast({ title: '头像更新失败', icon: 'none' })
      }
    },

    // 编辑昵称
    onEditNickname() {
      this.setData({
        showNicknameDialog: true
      })
    },

    // 昵称编辑确认
    async onNicknameConfirm(e: any) {
      try {
        const { nickname } = e.detail
        if (!nickname || !nickname.trim()) {
          wx.showToast({ title: '昵称不能为空', icon: 'none' })
          return
        }

        // 更新昵称到云端和本地
        const updated = await appDispatch(updateUserProfile({ 
          nickname: nickname.trim(),
          avatar: (this.data.localUserInfo?.avatar || '').trim() || undefined
        }))
        console.log('用户资料已更新:', updated)
        
        const current = this.data.localUserInfo
        this.setData({
          localUserInfo: {
            id: current?.id || '',
            nickname: nickname.trim(),
            avatar: current?.avatar || '',
            gender: current?.gender || 0,
            createdAt: current?.createdAt || Date.now(),
            updatedAt: Date.now(),
          }
        })
        
        wx.showToast({ title: '昵称已更新', icon: 'success' })
        
        // 保存成功后关闭对话框
        this.onNicknameDialogClose()
      } catch (err) {
        console.error('更新昵称失败:', err)
        wx.showToast({ title: '更新失败', icon: 'none' })
        // 保存失败时不关闭对话框，让用户可以重试
      }
    },

    // 昵称编辑对话框关闭
    onNicknameDialogClose() {
      this.setData({
        showNicknameDialog: false
      })
    },
    // 订阅全局用户信息
    subscribeUser() {
      // @ts-expect-error 保存到实例
      this._unsubUser = subscribe(rootStore, (s) => s.user, (u: UserState) => {
        const current = this.data.localUserInfo
        const merged: UserInfo = {
          id: current?.id || '',
          nickname: (u.nickname && u.nickname.trim()) ? u.nickname : (current?.nickname || '用户'),
          avatar: (u.avatar && u.avatar.trim()) ? u.avatar : (current?.avatar || ''),
          gender: current?.gender || 0,
          createdAt: current?.createdAt || Date.now(),
          updatedAt: Date.now(),
        }
        this.setData({ localUserInfo: merged })
      })
    },
    // 关闭侧边栏
    closeSidebar() {
      this.triggerEvent('close', {}, {})
    },

    // 切换编辑模式
    toggleEditMode() {
      console.log('切换编辑模式，当前状态:', this.data.isEditMode)
      const newEditMode = !this.data.isEditMode
      this.setData({
        isEditMode: newEditMode
      })
      console.log('编辑模式已切换到:', newEditMode)
    },

    // 选择聊天会话
    selectChatSession(e: any) {
      if (this.data.isEditMode) {
        return // 编辑模式下不响应点击
      }
      const sessionId = e.currentTarget.dataset.sessionId
      this.triggerEvent('selectChatSession', { sessionId }, {})
    },

    // 创建新话题
    createNewTopic() {
      this.triggerEvent('createNewTopic', {}, {})
    },

    // 删除聊天会话
    deleteChatSession(e: any) {
      console.log('删除聊天会话被调用', e)
      console.log('事件类型:', e.type)
      console.log('事件目标:', e.currentTarget)
      console.log('事件详情:', e.detail)
      
      const sessionId = e.currentTarget.dataset.sessionId
      console.log('要删除的会话ID:', sessionId)
      
      if (!sessionId) {
        console.error('会话ID为空，无法删除')
        wx.showToast({
          title: '删除失败：会话ID为空',
          icon: 'error'
        })
        return
      }
      
      // 直接触发删除事件，让父组件处理确认和删除逻辑
      this.triggerEvent('deleteChatSession', { sessionId }, {})
      console.log('删除事件已触发')
      
      // 注意：不在这里退出编辑模式，让父组件在删除成功后通知
      // 这样可以保持编辑模式直到用户确认删除
    },

    // 阻止事件冒泡的空方法
    catchTap() {
      // 空方法，仅用于阻止事件冒泡
    },

    // 删除成功后的回调，退出编辑模式
    onDeleteSuccess() {
      console.log('删除成功，退出编辑模式')
      this.setData({
        isEditMode: false
      })
    },

    // 格式化时间
    formatTime(timestamp: number): string {
      const now = Date.now()
      const diff = now - timestamp
      
      // 小于1分钟
      if (diff < 60000) {
        return '刚刚'
      }
      
      // 小于1小时
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return `${minutes}分钟前`
      }
      
      // 小于24小时
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000)
        return `${hours}小时前`
      }
      
      // 小于7天
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000)
        return `${days}天前`
      }
      
      // 超过7天，显示具体日期
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },

    // 组件其他方法...

    // 打开设置页面
    openSettings() {
      this.triggerEvent('openSettings', {}, {})
    },
  },
})
