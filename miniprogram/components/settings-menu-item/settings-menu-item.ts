// 设置菜单项组件
Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 图标
    icon: {
      type: String,
      value: ''
    },
    // 标题
    title: {
      type: String,
      value: ''
    },
    // 描述
    description: {
      type: String,
      value: ''
    },
    // 是否显示箭头
    showArrow: {
      type: Boolean,
      value: true
    },
    // 徽章文本
    badge: {
      type: String,
      value: ''
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTap() {
      if (!this.data.disabled) {
        this.triggerEvent('tap', {
          title: this.data.title
        })
      }
    }
  }
})
