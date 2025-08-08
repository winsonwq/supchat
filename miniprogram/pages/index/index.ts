// index.ts
import { AIService, Message } from '../../lib/services/ai'
const app = getApp()

Component({
  data: {
    messages: [] as Message[],
    inputMessage: '',
    isLoading: false,
    scrollToMessage: '',
  },

  lifetimes: {
    attached() {
      // 页面加载时初始化AI服务
      ;(this as any).aiService = AIService.getInstance()
      this.loadMessageHistory()
    },
  },

  methods: {
    // 加载消息历史
    loadMessageHistory() {
      const history = (this as any).aiService.getMessageHistory()
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

    // 发送消息
    async sendMessage() {
      const message = this.data.inputMessage.trim()
      if (!message || this.data.isLoading) {
        return
      }

      // 清空输入框
      this.setData({
        inputMessage: '',
        isLoading: true,
      })

      try {
        // 发送消息到AI服务
        await (this as any).aiService.sendMessage(message)

        // 重新加载消息历史
        this.loadMessageHistory()

        // 滚动到用户消息的顶部
        this.scrollToUserMessage()
      } catch (error) {
        console.error('发送消息失败:', error)
        wx.showToast({
          title: '发送失败，请重试',
          icon: 'error',
        })
      } finally {
        this.setData({
          isLoading: false,
        })
      }
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
            ;(this as any).aiService.clearMessages()
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
