// 表单输入组件
Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 标签
    label: {
      type: String,
      value: ''
    },
    // 值
    value: {
      type: String,
      value: ''
    },
    // 占位符
    placeholder: {
      type: String,
      value: ''
    },
    // 输入类型
    type: {
      type: String,
      value: 'text'
    },
    // 是否必填
    required: {
      type: Boolean,
      value: false
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否密码输入
    password: {
      type: Boolean,
      value: false
    },
    // 最大长度
    maxlength: {
      type: Number,
      value: 140
    },
    // 帮助文本
    helper: {
      type: String,
      value: ''
    },
    // 错误信息
    error: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onInput(e: any) {
      const value = e.detail.value
      this.triggerEvent('input', { value })
    },

    onFocus(e: any) {
      this.triggerEvent('focus', e.detail)
    },

    onBlur(e: any) {
      this.triggerEvent('blur', e.detail)
    },

    onClear() {
      this.triggerEvent('input', { value: '' })
    }
  }
})
