// index.ts
import { AIService, Message, StreamCallback } from '../../lib/services/ai'
const app = getApp()

Component({
  data: {
    messages: [] as Message[],
    inputMessage: '',
    isLoading: false,
    scrollToMessage: '',
    isStreaming: false, // 新增：标记是否正在流式响应
  },

  lifetimes: {
    attached() {
      // 页面加载时初始化并加载消息历史
      this.loadMessageHistory()
    },

    detached() {
      // 页面卸载时取消当前请求
      const aiService = AIService.getInstance()
      aiService.cancelCurrentRequest()
    },
  },

  methods: {
    // 获取 AI 服务实例
    getAIService(): AIService {
      return AIService.getInstance()
    },

    // 加载消息历史
    loadMessageHistory() {
      const aiService = this.getAIService()
      const history = aiService.getMessageHistory()
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
    processMessageContent(content: string) {
      if (!content) return null

      try {
        // 使用 towxml 解析 Markdown 内容
        const towxmlNodes = app.towxml(content, 'markdown', {
          events: {
            tap: (e: any) => {
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
    onInputChange(e: any) {
      this.setData({
        inputMessage: e.detail.value,
      })
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
          towxmlNodes: null,
        }

        const newMessages = [
          ...this.data.messages,
          userMessage,
          assistantMessage,
        ]
        this.setData({
          messages: newMessages,
        })

        // 滚动到用户消息
        this.scrollToUserMessage()

        // 定义流式响应回调
        const onStream: StreamCallback = (
          content: string,
          isComplete: boolean,
        ) => {
          // 更新助手消息内容
          const updatedMessages = [...this.data.messages]
          const lastMessageIndex = updatedMessages.length - 1

          if (
            updatedMessages[lastMessageIndex] &&
            updatedMessages[lastMessageIndex].role === 'assistant'
          ) {
            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              content: content,
              towxmlNodes: this.processMessageContent(content),
            }

            this.setData({
              messages: updatedMessages,
            })

            // 实时滚动到最新消息
            this.scrollToLatestMessage()
          }

          // 如果流式响应完成
          if (isComplete) {
            this.setData({
              isLoading: false,
              isStreaming: false,
            })
          }
        }

        // 发送流式消息
        const aiService = this.getAIService()
        await aiService.sendMessageStream(message, onStream)
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

    // 取消当前请求
    cancelRequest() {
      const aiService = this.getAIService()
      aiService.cancelCurrentRequest()
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
    findLatestUserMessageIndex() {
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
            const aiService = this.getAIService()
            aiService.clearMessages()
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
