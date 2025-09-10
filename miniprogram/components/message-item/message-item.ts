// message-item.ts
import { Message } from '../../lib/types/message.js' // 使用新的消息类型定义
import { ToolConfirmData } from '../../lib/mcp/types.js'

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true,
  },
  properties: {
    // 消息数据
    message: {
      type: Object,
      value: {} as Message,
    },
    // 消息索引
    messageIndex: {
      type: Number,
      value: 0,
    },
    // 是否为最后一条消息
    isLast: {
      type: Boolean,
      value: false,
    },
    // 是否正在流式响应
    isStreaming: {
      type: Boolean,
      value: false,
    },
    // 是否为加载状态
    isLoading: {
      type: Boolean,
      value: false,
    },
    // 聊天区域高度
    scrollViewHeight: {
      type: Number,
      value: 0,
    },
    // 工具确认数据
    toolConfirmData: {
      type: Object,
      value: null as ToolConfirmData | null,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 工具参数弹窗相关数据
    showToolParamsModal: false,
    selectedToolCall: null as any,
    selectedToolIndex: -1,
    toolParamsFormatted: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 显示工具参数弹窗
     */
    showToolParamsModal(event: any) {
      const { toolIndex } = event.currentTarget.dataset
      const { message } = this.data
      
      if (message.tool_calls && message.tool_calls[toolIndex]) {
        const toolCall = message.tool_calls[toolIndex]
        let formattedParams = ''
        
        try {
          // 解析并格式化工具参数
          const params = JSON.parse(toolCall.function.arguments)
          formattedParams = JSON.stringify(params, null, 2)
        } catch (error) {
          // 如果解析失败，显示原始字符串
          formattedParams = toolCall.function.arguments
        }
        
        this.setData({
          showToolParamsModal: true,
          selectedToolCall: toolCall,
          selectedToolIndex: toolIndex,
          toolParamsFormatted: formattedParams,
        })
      }
    },

    /**
     * 关闭工具参数弹窗
     */
    closeToolParamsModal() {
      this.setData({
        showToolParamsModal: false,
        selectedToolCall: null,
        selectedToolIndex: -1,
        toolParamsFormatted: '',
      })
    },

    /**
     * 处理工具确认
     */
    onToolConfirm(event: any) {
      const { confirmId } = event.detail
      console.log('工具确认:', confirmId)
      this.triggerEvent('toolConfirm', { confirmId })
    },

    /**
     * 处理工具取消
     */
    onToolCancel(event: any) {
      const { confirmId } = event.detail
      console.log('工具取消:', confirmId)
      this.triggerEvent('toolCancel', { confirmId })
    },
  },
})
