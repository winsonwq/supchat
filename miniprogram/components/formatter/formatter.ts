import { formatTime } from '../../lib/utils/date'

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true,
  },
  properties: {
    // 格式化类型
    type: {
      type: String,
      value: 'text',
    },
    // 要格式化的值
    value: {
      type: String,
      value: '',
    },
    // 格式化模板（如 YYYY-MM-DD）
    format: {
      type: String,
      value: '',
    },
    // 自定义样式类名
    className: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    formattedValue: '',
  },

  methods: {
    formatDateTime(datestring: string, format?: string | undefined): string {
      return formatTime(datestring, format || 'YYYY-MM-DD HH:mm')
    },

    /**
     * 格式化值
     */
    formatValue() {
      const { type, value, format } = this.data
      let formattedValue = value

      switch (type) {
        case 'datetime':
          formattedValue = this.formatDateTime(value, format)
          break
        case 'text':
        default:
          formattedValue = value
          break
      }

      this.setData({
        formattedValue,
      })
    },
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.formatValue()
    },
  },

  /**
   * 数据监听器
   */
  observers: {
    'type, value, format': function () {
      this.formatValue()
    },
  },
})
