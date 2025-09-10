// tool-confirm.ts
import { ToolConfirmData } from '../../lib/mcp/types'

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true,
  },
  properties: {
    // 工具确认数据
    confirmData: {
      type: Object,
      value: null as ToolConfirmData | null,
      observer: 'onConfirmDataChanged'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    toolName: '',
    argumentsText: '',
    confirmId: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 确认数据变化监听
     */
    onConfirmDataChanged(newData: ToolConfirmData | null) {
      if (!newData) {
        this.setData({
          toolName: '',
          argumentsText: '',
          confirmId: ''
        })
        return
      }

      let argumentsText = ''
      try {
        argumentsText = JSON.stringify(newData.arguments, null, 2)
      } catch (error) {
        argumentsText = String(newData.arguments)
      }

      this.setData({
        toolName: newData.toolName,
        argumentsText,
        confirmId: newData.confirmId
      })
    },

    /**
     * 确认执行
     */
    onConfirm(event: any) {
      const { confirmId } = event.currentTarget.dataset
      this.triggerEvent('confirm', { confirmId })
    },

    /**
     * 取消执行
     */
    onCancel(event: any) {
      const { confirmId } = event.currentTarget.dataset
      this.triggerEvent('cancel', { confirmId })
    }
  }
})
