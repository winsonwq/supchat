import getSafeArea from '../../lib/utils/safe-area'
import { UserInfoStorage } from '../../lib/storage/user-info-storage'
import { UserInfo } from '../../lib/types/user-info'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isOpen: {
      type: Boolean,
      value: false,
    },
    topics: {
      type: Array,
      value: [],
    },
    currentTopicId: {
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

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭侧边栏
    closeSidebar() {
      this.triggerEvent('close', {}, {})
    },

    // 选择话题
    selectTopic(e: any) {
      const topicId = e.currentTarget.dataset.id
      this.triggerEvent('selectTopic', { topicId }, {})
    },

    // 创建新话题
    createNewTopic() {
      this.triggerEvent('createNewTopic', {}, {})
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
