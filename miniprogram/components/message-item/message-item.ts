// message-item.ts
import { RenderMessage } from '../../lib/types/message.js' // 使用新的消息类型定义

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true,
  },
  properties: {
    // 消息数据
    message: {
      type: Object,
      value: {} as RenderMessage,
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
    // 工具确认参数格式化文本
    formattedArguments: '',
  },

  observers: {
    'message.toolConfirmData': function(toolConfirmData: any) {
      if (toolConfirmData && toolConfirmData.arguments) {
        let formattedArgs = ''
        try {
          formattedArgs = JSON.stringify(toolConfirmData.arguments, null, 2)
        } catch (error) {
          formattedArgs = String(toolConfirmData.arguments)
        }
        this.setData({
          formattedArguments: formattedArgs
        })
      } else {
        this.setData({
          formattedArguments: ''
        })
      }
    }
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
      // 尝试从事件数据中获取confirmId，如果没有则从消息数据中获取
      let confirmId = event.detail?.confirmId
      if (!confirmId && event.currentTarget?.dataset?.confirmId) {
        confirmId = event.currentTarget.dataset.confirmId
      }
      if (!confirmId && this.data.message?.toolConfirmData?.confirmId) {
        confirmId = this.data.message.toolConfirmData.confirmId
      }
      
      this.triggerEvent('toolConfirm', { confirmId })
    },

    /**
     * 处理工具取消
     */
    onToolCancel(event: any) {
      // 尝试从事件数据中获取confirmId，如果没有则从消息数据中获取
      let confirmId = event.detail?.confirmId
      if (!confirmId && event.currentTarget?.dataset?.confirmId) {
        confirmId = event.currentTarget.dataset.confirmId
      }
      if (!confirmId && this.data.message?.toolConfirmData?.confirmId) {
        confirmId = this.data.message.toolConfirmData.confirmId
      }
      
      this.triggerEvent('toolCancel', { confirmId })
    },
  },
})
