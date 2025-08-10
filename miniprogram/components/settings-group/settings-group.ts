// 设置分组组件
Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 分组标题
    title: {
      type: String,
      value: ''
    },
    // 分组描述
    description: {
      type: String,
      value: ''
    }
  }
})
