// message-item.ts
import { Message, ToolCall } from '../../lib/mcp/types.js'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 消息数据
    message: {
      type: Object,
      value: {} as Message
    },
    // 消息索引
    messageIndex: {
      type: Number,
      value: 0
    },
    // 是否为最后一条消息
    isLast: {
      type: Boolean,
      value: false
    },
    // 是否正在流式响应
    isStreaming: {
      type: Boolean,
      value: false
    },
    // 是否为加载状态
    isLoading: {
      type: Boolean,
      value: false
    },
    // 聊天区域高度
    scrollViewHeight: {
      type: Number,
      value: 0
    },
    // 是否为新的AI回复（用于占位符计算）
    isNewAIResponse: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    placeholderHeight: 0, // 占位符高度
  },

  lifetimes: {
    attached() {
      // 组件初始化时计算占位符高度
      this.calculatePlaceholderHeight()
    }
  },

  observers: {
    'scrollViewHeight, isNewAIResponse': function() {
      // 当高度或状态变化时重新计算
      this.calculatePlaceholderHeight()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 计算占位符高度
     */
    calculatePlaceholderHeight() {
      const { message, isNewAIResponse, scrollViewHeight } = this.data
      
      // 为新的空AI回复设置占位符高度
      if (message.role === 'assistant' && isNewAIResponse && !message.content && scrollViewHeight > 0) {
        // 直接使用整个 viewport 高度作为占位符，确保用户消息滚动到顶部
        const placeholderHeight = Math.max(scrollViewHeight - 100, 300) // 预留一点空间给消息头部
        
        this.setData({
          placeholderHeight: placeholderHeight
        })
      } else {
        this.setData({
          placeholderHeight: 0
        })
      }
    },

    /**
     * 获取消息角色显示文本
     */
    getRoleText(): string {
      const { message } = this.data
      switch (message.role) {
        case 'user':
          return '用户'
        case 'tool':
          return '工具'
        case 'assistant':
        default:
          return 'AI助手'
      }
    },

    /**
     * 获取消息卡片的样式类名
     */
    getCardClasses(): string {
      const { message } = this.data
      const baseClasses = 'message-card mb-2 mx-5'
      
      switch (message.role) {
        case 'user':
          return `${baseClasses} user-card bg-white text-gray-800 rounded-lg overflow-hidden shadow-md`
        case 'tool':
          return `${baseClasses} tool-card rounded-lg overflow-hidden shadow-md border-l-4 border-blue-500`
        case 'assistant':
        default:
          return `${baseClasses} ai-card text-gray-800`
      }
    },

    /**
     * 判断是否显示流式响应指示器
     */
    shouldShowStreamingIndicator(): boolean {
      const { message, isStreaming, isLast } = this.data
      return message.role === 'assistant' && isStreaming && isLast && !message.content
    },

    /**
     * 判断是否显示流式输入光标
     */
    shouldShowStreamingCursor(): boolean {
      const { message, isStreaming, isLast } = this.data
      return message.role === 'assistant' && isStreaming && isLast && !!message.content
    },

    /**
     * 判断是否有工具调用
     */
    hasToolCalls(): boolean {
      const { message } = this.data
      return !!(message.tool_calls && message.tool_calls.length > 0)
    },


  }
})
