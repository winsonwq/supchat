import getSafeArea from '../../lib/utils/safe-area'

Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
    // 是否显示侧边栏按钮
    showSidebar: {
      type: Boolean,
      value: false
    },
    // 是否显示导航按钮
    showNaviButton: {
      type: Boolean,
      value: true
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: ''
  },
  lifetimes: {
    attached() {
      const safeAreaData = getSafeArea()
      this.setData({
        ios: safeAreaData.ios,
        innerPaddingRight: `padding-right: ${safeAreaData.rightPadding}px`,
        leftWidth: `width: ${safeAreaData.leftWidth}px`,
        safeAreaTop: safeAreaData.isDevtools || safeAreaData.isAndroid 
          ? `height: calc(var(--height) + ${safeAreaData.safeAreaTop}px); padding-top: ${safeAreaData.safeAreaTop}px`
          : ``
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show: boolean) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${
          show ? '1' : '0'
        };transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      this.triggerEvent('back', { delta: data.delta }, {})
    },
    home() {
      wx.switchTab({
        url: '/pages/index/index'
      })
      this.triggerEvent('home', {}, {})
    },
    toggleSidebar() {
      this.triggerEvent('toggleSidebar', {}, {})
    }
  },
})
