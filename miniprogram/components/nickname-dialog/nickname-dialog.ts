Component({
  options: {
  },
  /**
   * 组件的属性列表
   */
  properties: {
    isVisible: {
      type: Boolean,
      value: false,
    },
    currentNickname: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    nickname: '',
  },

  observers: {
    'isVisible, currentNickname': function(isVisible: boolean, currentNickname: string) {
      if (isVisible) {
        this.setData({
          nickname: currentNickname || '',
        })
        console.log('Dialog opened, nickname set to:', this.data.nickname)
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭对话框
    onClose() {
      this.triggerEvent('close', {}, {})
    },

    // 取消操作
    onCancel() {
      this.triggerEvent('close', {}, {})
    },

    // 确认操作
    onConfirm() {
      const nickname = this.data.nickname.trim()
      if (!nickname) {
        wx.showToast({
          title: '昵称不能为空',
          icon: 'none'
        })
        return
      }

      // 触发确认事件，让父组件处理保存逻辑
      this.triggerEvent('confirm', { nickname }, {})
      // 注意：不在这里关闭对话框，让父组件在保存成功后再关闭
    },

    // 昵称输入事件 - 适配 form-input 组件
    onNicknameInput(e: any) {
      // form-input 组件传递的数据结构是 { value }
      const value = e.detail.value
      console.log('Input event triggered:', e.detail, 'Value:', value)
      
      this.setData({
        nickname: value,
      })
      console.log('Nickname updated:', this.data.nickname)
    },
  },
})
