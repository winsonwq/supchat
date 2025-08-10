// 表单选择组件
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
    // 选项数组
    options: {
      type: Array,
      value: []
    },
    // 选项的键名
    optionKey: {
      type: String,
      value: 'value'
    },
    // 选项的标签键名
    optionLabel: {
      type: String,
      value: 'label'
    },
    // 当前值
    value: {
      type: String,
      value: ''
    },
    // 占位符
    placeholder: {
      type: String,
      value: '请选择'
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
   * 组件的初始数据
   */
  data: {
    selectedIndex: -1,
    selectedOption: null
  },

  observers: {
    'value, options': function() {
      this.updateSelection()
    }
  },

  lifetimes: {
    attached() {
      this.updateSelection()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    updateSelection() {
      const { value, options, optionKey } = this.data
      if (!options || !options.length) {
        this.setData({
          selectedIndex: -1,
          selectedOption: null
        })
        return
      }

      const index = options.findIndex((option: any) => {
        return typeof option === 'string' ? option === value : option[optionKey] === value
      })

      this.setData({
        selectedIndex: index,
        selectedOption: index >= 0 ? options[index] : null
      })
    },

    onChange(e: any) {
      const index = e.detail.value
      const { options, optionKey } = this.data
      const selectedOption = options[index]
      const value = typeof selectedOption === 'string' ? selectedOption : selectedOption[optionKey]

      this.setData({
        selectedIndex: index,
        selectedOption
      })

      this.triggerEvent('change', { value, option: selectedOption })
    }
  }
})
