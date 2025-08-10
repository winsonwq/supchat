import getSafeArea from '../../lib/utils/safe-area'

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
  data: {},

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

    // 显示用户菜单
    showUserMenu() {
      // 可以在这里添加用户菜单功能
      console.log('显示用户菜单')
    },

    // 打开设置页面
    openSettings() {
      this.triggerEvent('openSettings', {}, {})
    },
  },
})
