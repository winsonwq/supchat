// checkbox.ts
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checked: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    },
    label: {
      type: String,
      value: ''
    },
    shape: {
      type: String,
      value: 'square' // 'square' | 'circle'
    },
    size: {
      type: String,
      value: 'medium' // 'small' | 'medium' | 'large'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onToggle() {
      if (this.data.disabled) {
        return
      }
      
      const newChecked = !this.data.checked
      
      // 触发外部事件
      this.triggerEvent('change', {
        checked: newChecked
      })
    }
  }
})
