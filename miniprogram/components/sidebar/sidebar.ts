import getSafeArea from '../../lib/utils/safe-area'
import { UserInfoStorage } from '../../lib/storage/user-info-storage'
import { UserInfo } from '../../lib/types/user-info'
import { ChatSession } from '../../lib/types/chat-history'

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
  },

  /**
   * 组件的初始数据
   */
  data: {
    localUserInfo: null as UserInfo | null,
    isEditMode: false,
    sortedChatSessions: [] as ChatSession[],
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
      
      // 加载本地用户信息
      this.loadUserInfo()
    },
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

    // 加载用户信息
    loadUserInfo() {
      const userInfo = UserInfoStorage.getUserInfo()
      this.setData({
        localUserInfo: userInfo
      })
    },

    // 显示用户菜单或授权
    showUserMenu() {
      const localUserInfo = this.data.localUserInfo
      
      if (!localUserInfo || !localUserInfo.isAuthorized) {
        // 未授权，弹出授权选项
        this.requestAuthorization()
      } else {
        // 已授权，显示用户设置选项
        this.showUserSettings()
      }
    },

    // 请求微信授权
    requestAuthorization() {
      wx.showModal({
        title: '用户授权',
        content: '是否获取您的微信头像和昵称？这将帮助我们为您提供更好的服务。',
        confirmText: '授权',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.getUserProfile()
          } else {
            // 用户取消授权，显示手动设置选项
            this.showManualSettings()
          }
        }
      })
    },

    // 获取微信用户信息
    getUserProfile() {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('获取用户信息成功:', res.userInfo)
          const updatedUserInfo = UserInfoStorage.updateFromWxUserInfo(res.userInfo)
          this.setData({
            localUserInfo: updatedUserInfo
          })
          
          // 通知父组件用户信息已更新
          this.triggerEvent('userInfoUpdated', { userInfo: updatedUserInfo })
          
          wx.showToast({
            title: '授权成功',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err)
          wx.showToast({
            title: '授权失败',
            icon: 'none'
          })
          // 授权失败，显示手动设置选项
          this.showManualSettings()
        }
      })
    },

    // 显示用户设置选项
    showUserSettings() {
      wx.showActionSheet({
        itemList: ['修改昵称', '更换头像', '清除用户信息'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.editUserName()
              break
            case 1:
              this.editUserAvatar()
              break
            case 2:
              this.clearUserInfo()
              break
          }
        }
      })
    },

    // 显示手动设置选项
    showManualSettings() {
      wx.showActionSheet({
        itemList: ['设置昵称', '重新授权'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.editUserName()
              break
            case 1:
              this.requestAuthorization()
              break
          }
        }
      })
    },

    // 编辑用户名
    editUserName() {
      const currentName = this.data.localUserInfo?.name || '用户'
      
      wx.showModal({
        title: '修改昵称',
        placeholderText: '请输入新昵称',
        editable: true,
        content: currentName,
        success: (res) => {
          if (res.confirm && res.content) {
            const newName = res.content.trim()
            const validation = UserInfoStorage.validateUserInfo({ name: newName })
            
            if (!validation.isValid) {
              wx.showToast({
                title: validation.message || '输入有误',
                icon: 'none'
              })
              return
            }

            // 如果没有本地用户信息，创建一个
            let userInfo = this.data.localUserInfo
            if (!userInfo) {
              userInfo = UserInfoStorage.createDefaultUserInfo()
            }

            userInfo.name = newName
            UserInfoStorage.saveUserInfo(userInfo)
            
            this.setData({
              localUserInfo: userInfo
            })

            // 通知父组件用户信息已更新
            this.triggerEvent('userInfoUpdated', { userInfo })

            wx.showToast({
              title: '修改成功',
              icon: 'success'
            })
          }
        }
      })
    },

    // 编辑用户头像
    editUserAvatar() {
      wx.showActionSheet({
        itemList: ['从相册选择', '重新授权获取微信头像'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              this.chooseImageFromAlbum()
              break
            case 1:
              this.getUserProfile()
              break
          }
        }
      })
    },

    // 从相册选择图片
    chooseImageFromAlbum() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res) => {
          const tempFiles = res.tempFiles
          if (tempFiles && tempFiles.length > 0) {
            const tempFilePath = tempFiles[0].tempFilePath
            
            // 这里可以上传到服务器，现在先使用本地路径
            let userInfo = this.data.localUserInfo
            if (!userInfo) {
              userInfo = UserInfoStorage.createDefaultUserInfo()
            }

            userInfo.avatar = tempFilePath
            UserInfoStorage.saveUserInfo(userInfo)
            
            this.setData({
              localUserInfo: userInfo
            })

            // 通知父组件用户信息已更新
            this.triggerEvent('userInfoUpdated', { userInfo })

            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            })
          }
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },

    // 清除用户信息
    clearUserInfo() {
      wx.showModal({
        title: '清除用户信息',
        content: '确定要清除所有用户信息吗？此操作不可恢复。',
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            UserInfoStorage.clearUserInfo()
            this.setData({
              localUserInfo: null
            })

            // 通知父组件用户信息已清除
            this.triggerEvent('userInfoUpdated', { userInfo: null })

            wx.showToast({
              title: '清除成功',
              icon: 'success'
            })
          }
        }
      })
    },

    // 打开设置页面
    openSettings() {
      this.triggerEvent('openSettings', {}, {})
    },
  },
})
