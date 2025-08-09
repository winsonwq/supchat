// index.ts
import { AIService, Message, StreamCallback } from '../../lib/services/ai.js'
import { isToolCallMessage } from '../../lib/utils/util.js'
import { ToolCall, TowxmlNode, WxEvent } from '../../lib/mcp/types.js'
const app = getApp()

Component({
  data: {
    messages: [] as Message[],
    inputMessage: '',
    isLoading: false,
    scrollToMessage: '',
    isStreaming: false, // 新增：标记是否正在流式响应
    emptyMessage: {} as Message, // 空消息对象，用于加载状态
    viewportHeight: 0, // viewport 高度
    scrollViewHeight: 0, // 聊天区域高度
  },

  lifetimes: {
    attached() {
      // 页面加载时初始化并加载消息历史
      this.loadMessageHistory()
      // 计算 viewport 高度
      this.calculateViewportHeight()
    },

    ready() {
      // 组件布局完成后重新计算高度
      setTimeout(() => {
        this.calculateViewportHeight()
      }, 300)
    },

    detached() {
      // 页面卸载时取消当前请求
      AIService.getInstance().cancelCurrentRequest()
    },
  },

  methods: {
    // 获取 AI 服务实例
    getAIService(): AIService {
      return AIService.getInstance()
    },

    // 计算 viewport 高度
    calculateViewportHeight() {
      const systemInfo = wx.getSystemInfoSync()
      const viewportHeight = systemInfo.windowHeight

      wx.nextTick(() => {
        const query = wx.createSelectorQuery().in(this)
        query
          .select('.chat-scroll-view')
          .boundingClientRect((rect: any) => {
            if (rect) {
              this.setData({
                viewportHeight: viewportHeight,
                scrollViewHeight: rect.height,
              })
            }
          })
          .exec()
      })
    },

    // 加载消息历史
    loadMessageHistory() {
      const history = this.getAIService().getMessageHistory()
      // 处理消息内容，使用 towxml 解析 Markdown
      const processedHistory = history.map((msg: Message) => ({
        ...msg,
        towxmlNodes: this.processMessageContent(msg.content),
      }))

      this.setData({
        messages: processedHistory,
      })
      // 加载历史后滚动到最新消息
      this.scrollToLatestMessage()
    },

    // 处理消息内容，使用 towxml 解析 Markdown
    processMessageContent(content: string): TowxmlNode | undefined {
      if (!content) return undefined

      try {
        // 使用 towxml 解析 Markdown 内容
        const towxmlNodes = app.towxml(content, 'markdown', {
          events: {
            tap: (e: WxEvent) => {
              console.log('tap', e)
            },
          },
        })
        return towxmlNodes
      } catch (error) {
        console.error('towxml解析错误:', error)
        // 如果解析失败，返回纯文本的 towxml 节点
        return app.towxml(content, 'text')
      }
    },

    // 输入框变化
    onInputChange(e: WxEvent) {
      this.setData({
        inputMessage: e.detail.value || '',
      })
    },

    // 处理组件发送事件
    onSendMessage() {
      this.sendMessage()
    },

    // 发送消息（流式模式）
    async sendMessage() {
      const message = this.data.inputMessage.trim()
      if (!message || this.data.isLoading) {
        return
      }

      // 清空输入框
      this.setData({
        inputMessage: '',
        isLoading: true,
        isStreaming: true,
      })

      try {
        // 添加用户消息到界面
        const userMessage: Message = {
          role: 'user',
          content: message,
          towxmlNodes: this.processMessageContent(message),
        }

        // 添加空的助手消息占位符
        const assistantMessage: Message = {
          role: 'assistant',
          content: '',
          towxmlNodes: undefined,
        }

        const newMessages = [
          ...this.data.messages,
          userMessage,
          assistantMessage,
        ]

        this.setData({
          messages: newMessages,
        })

        // 滚动到用户消息（智能滚动到顶部）
        this.scrollToUserMessageTop()

        // 定义流式响应回调
        const onStream: StreamCallback = (
          content: string,
          isComplete: boolean,
          toolCalls?: ToolCall[],
          currentToolCall?: ToolCall,
        ) => {
          // 处理当前工具调用显示
          if (currentToolCall) {
            // 更新助手消息，显示当前正在调用的工具
            this.updateAssistantMessage(content, toolCalls, currentToolCall)
            this.scrollToLatestMessage()
            return
          }

          // 检查是否是工具调用消息（通过内容前缀判断）
          const isToolMessage = isToolCallMessage(content)

          if (isToolMessage) {
            // 添加工具调用消息作为独立消息
            const toolMessage: Message = {
              role: 'tool',
              content: content,
              towxmlNodes: this.processMessageContent(content),
            }

            const updatedMessages = [...this.data.messages, toolMessage]
            this.setData({
              messages: updatedMessages,
            })
          } else {
            // 更新助手消息内容，保持工具调用信息
            this.updateAssistantMessage(content, toolCalls, undefined)
          }

          // 实时滚动到最新消息
          this.scrollToLatestMessage()

          // 如果流式响应完成
          if (isComplete) {
            this.setData({
              isLoading: false,
              isStreaming: false,
            })

            // 重新加载消息历史以确保所有消息正确显示
            this.loadMessageHistory()
          }
        }

        // 发送流式消息
        await this.getAIService().sendMessageStream(message, onStream)
      } catch (error) {
        console.error('发送消息失败:', error)
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'error',
        })
        this.setData({
          isLoading: false,
          isStreaming: false,
        })
      }
    },

    // 更新助手消息内容
    updateAssistantMessage(
      content: string,
      toolCalls?: ToolCall[],
      currentToolCall?: ToolCall,
    ) {
      const updatedMessages = [...this.data.messages]
      const lastMessageIndex = updatedMessages.length - 1

      if (
        updatedMessages[lastMessageIndex] &&
        updatedMessages[lastMessageIndex].role === 'assistant'
      ) {
        // 确定要显示的工具调用：优先显示 currentToolCall，其次显示 toolCalls，最后保持原有的工具调用
        let displayToolCalls = undefined
        if (currentToolCall) {
          displayToolCalls = [currentToolCall]
        } else if (toolCalls) {
          displayToolCalls = toolCalls
        } else {
          // 保持原有的工具调用信息
          displayToolCalls = updatedMessages[lastMessageIndex].tool_calls
        }

        updatedMessages[lastMessageIndex] = {
          ...updatedMessages[lastMessageIndex],
          content: content,
          towxmlNodes: this.processMessageContent(content),
          tool_calls: displayToolCalls,
        }

        this.setData({
          messages: updatedMessages,
        })
      }
    },

    // 取消当前请求
    cancelRequest() {
      this.getAIService().cancelCurrentRequest()
      this.setData({
        isLoading: false,
        isStreaming: false,
      })
      wx.showToast({
        title: '已取消',
        icon: 'success',
      })
    },

    // 滚动到最新消息
    scrollToLatestMessage() {
      setTimeout(() => {
        if (this.data.messages.length > 0) {
          this.setData({
            scrollToMessage: `message-${this.data.messages.length - 1}`,
          })
        }
      }, 100)
    },

    // 滚动到用户消息的顶部（智能滚动）
    scrollToUserMessageTop() {
      setTimeout(() => {
        // 找到最新的用户消息
        const userMessageIndex = this.findLatestUserMessageIndex()
        if (userMessageIndex !== -1) {
          this.setData({
            scrollToMessage: `message-${userMessageIndex}`,
          })
        }
      }, 150) // 稍微延长时间，确保占位符高度计算完成
    },

    // 滚动到用户消息的顶部
    scrollToUserMessage() {
      setTimeout(() => {
        // 找到最新的用户消息
        const userMessageIndex = this.findLatestUserMessageIndex()
        if (userMessageIndex !== -1) {
          this.setData({
            scrollToMessage: `message-${userMessageIndex}`,
          })
        }
      }, 100)
    },

    // 查找最新用户消息的索引
    findLatestUserMessageIndex(): number {
      for (let i = this.data.messages.length - 1; i >= 0; i--) {
        if (this.data.messages[i].role === 'user') {
          return i
        }
      }
      return -1
    },

    // 清空聊天记录
    clearChat() {
      wx.showModal({
        title: '确认清空',
        content: '确定要清空所有聊天记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.getAIService().clearMessages()
            this.setData({
              messages: [],
            })
            wx.showToast({
              title: '已清空',
              icon: 'success',
            })
          }
        },
      })
    },
  },
})
