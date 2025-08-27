// generic-dialog.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示对话框
    visible: {
      type: Boolean,
      value: false
    },
    // 对话框标题
    title: {
      type: String,
      value: ''
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      value: true
    },
    // 是否允许点击遮罩关闭
    maskClosable: {
      type: Boolean,
      value: true
    },
    // 对话框宽度
    width: {
      type: String,
      value: '600rpx'
    },
    // 对话框高度
    height: {
      type: String,
      value: 'auto'
    },
    // 是否显示遮罩
    showMask: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 动画状态：'hidden', 'showing', 'visible', 'hiding'
    animationState: 'hidden',
    // 是否应该渲染DOM
    shouldRender: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击遮罩层
     */
    onOverlayTap() {
      if (this.properties.maskClosable) {
        this.onClose()
      }
    },

    /**
     * 点击容器（阻止冒泡）
     */
    onContainerTap() {
      // 阻止事件冒泡
    },

    /**
     * 关闭对话框
     */
    onClose() {
      this.hide()
      // 触发关闭事件
      this.triggerEvent('close')
    },

    /**
     * 显示对话框
     */
    show() {
      this.setData({ 
        shouldRender: true,
        animationState: 'showing'
      })
      
      // 等待下一帧确保DOM已渲染
      setTimeout(() => {
        this.setData({ animationState: 'visible' })
      }, 16)
    },

    /**
     * 隐藏对话框
     */
    hide() {
      this.setData({ animationState: 'hiding' })
      
      // 等待动画结束后再隐藏DOM
      setTimeout(() => {
        this.setData({ 
          animationState: 'hidden',
          shouldRender: false
        })
      }, 300) // 300ms 是CSS动画的持续时间
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'visible': function(newVal: boolean) {
      if (newVal) {
        this.show()
      } else {
        this.hide()
      }
    }
  }
})
