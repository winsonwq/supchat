// index.ts
import { AIService, Message, StreamCallback } from '../../lib/services/ai.js'
import { StreamContentType } from '../../lib/mcp/types.js'
import { ToolCall, TowxmlNode, WxEvent } from '../../lib/mcp/types.js'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import { UserInfoStorage } from '../../lib/storage/user-info-storage'
import { UserInfo } from '../../lib/types/user-info'
import { ChatSession } from '../../lib/types/chat-history'
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
    chatScrollTopPadding: 0, // 聊天区域顶部间距

    // 侧边栏相关数据
    sidebarOpen: false,
    chatSessions: [] as ChatSession[], // 聊天会话列表
    currentSessionId: '', // 当前会话ID
    userInfo: {
      name: '用户',
      avatar: '',
    },
  },

  lifetimes: {
    attached() {
      // 计算安全区域和导航栏高度
      this.calculateSafeAreaPadding()

      // 页面加载时初始化并加载消息历史
      this.loadMessageHistory()
      // 计算 viewport 高度
      this.calculateViewportHeight()
      // 初始化聊天会话
      this.initChatSessions()
      // 加载用户信息
      this.loadUserInfo()
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
    // 计算安全区域顶部间距
    calculateSafeAreaPadding() {
      const topPadding = getNavigationHeight()

      this.setData({
        chatScrollTopPadding: topPadding,
      })
    },

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

    // 初始化聊天会话
    initChatSessions() {
      const aiService = this.getAIService()
      const sessions = aiService.getAllChatSessions()

      // 如果没有会话，创建一个新的默认会话
      if (sessions.length === 0) {
        const newSession = aiService.createNewChat()
        this.setData({
          chatSessions: [newSession],
          currentSessionId: newSession.id,
        })
      } else {
        // 找到活跃会话
        const activeSession = sessions.find((session) => session.isActive)
        this.setData({
          chatSessions: sessions,
          currentSessionId: activeSession?.id || sessions[0].id,
        })

        // 加载活跃会话的消息
        if (activeSession) {
          this.loadMessageHistory()
        }
      }
    },

    // 加载用户信息
    loadUserInfo() {
      const userInfo = UserInfoStorage.getUserInfo()
      if (userInfo) {
        this.setData({
          userInfo: {
            name: userInfo.name,
            avatar: userInfo.avatar || '',
          },
        })
      }
    },

    // 处理用户信息更新
    onUserInfoUpdated(e: WxEvent) {
      const { userInfo } = e.detail as { userInfo: UserInfo | null }
      if (userInfo) {
        this.setData({
          userInfo: {
            name: userInfo.name,
            avatar: userInfo.avatar || '',
          },
        })
      } else {
        // 用户信息被清除
        this.setData({
          userInfo: {
            name: '用户',
            avatar: '',
          },
        })
      }
    },

    // 处理消息内容，使用 towxml 解析 Markdown
    processMessageContent(content: string): TowxmlNode | undefined {
      console.log(1111111111, content)
      if (!content) return undefined
      console.log('处理消息内容:', content)

      try {
        // 使用 towxml 解析 Markdown 内容
        const towxmlNodes = app.towxml(content.render ? content.render() : content, 'html', {
          events: {
            tap: (e: WxEvent) => {
              console.log('tap事件触发:', e)
              this.handleComponentEvent(content, e)
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

    handleComponentEvent(content: any, e: WxEvent) {
      const eventName = e.currentTarget.dataset.data.attrs['data-action']
      content[eventName].bind(content)()
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
        const onStream: StreamCallback = (streamContent) => {
          const { content, type, isComplete, toolCalls, currentToolCall } =
            streamContent

          // 处理当前工具调用显示
          if (currentToolCall) {
            // 更新助手消息，显示当前正在调用的工具
            this.updateAssistantMessage(content, toolCalls, currentToolCall)
            this.scrollToLatestMessage()
            return
          }

          // 根据类型处理不同的消息
          if (type === StreamContentType.TOOL) {
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
        content: '确定要清空当前会话的所有聊天记录吗？',
        success: (res) => {
          if (res.confirm) {
            const aiService = this.getAIService()
            aiService.clearMessages()

            // 更新当前会话的消息为空
            if (this.data.currentSessionId) {
              aiService.updateSession(this.data.currentSessionId, {
                messages: [],
              })
            }

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

    // 侧边栏相关方法
    // 切换侧边栏
    toggleSidebar() {
      this.setData({
        sidebarOpen: !this.data.sidebarOpen,
      })
    },

    // 关闭侧边栏
    closeSidebar() {
      this.setData({
        sidebarOpen: false,
      })
    },

    // 选择聊天会话
    selectChatSession(e: any) {
      const { sessionId } = e.detail
      console.log('选择会话:', sessionId)

      const aiService = this.getAIService()
      const success = aiService.loadChatSession(sessionId)

      if (success) {
        // 重新加载消息历史
        this.loadMessageHistory()

        this.setData({
          currentSessionId: sessionId,
          sidebarOpen: false,
        })

        wx.showToast({
          title: '已切换会话',
          icon: 'success',
        })
      } else {
        wx.showToast({
          title: '切换会话失败',
          icon: 'error',
        })
      }
    },

    // 创建新话题
    createNewTopic() {
      console.log('创建新话题')

      const aiService = this.getAIService()
      const newSession = aiService.createNewChat()

      // 更新会话列表
      const sessions = aiService.getAllChatSessions()

      this.setData({
        messages: [],
        chatSessions: sessions,
        currentSessionId: newSession.id,
        sidebarOpen: false,
      })

      wx.showToast({
        title: '已创建新话题',
        icon: 'success',
      })
    },

    // 处理新建聊天事件
    onNewChat() {
      const aiService = this.getAIService()
      const newSession = aiService.createNewChat()

      // 更新会话列表
      const sessions = aiService.getAllChatSessions()

      this.setData({
        messages: [],
        chatSessions: sessions,
        currentSessionId: newSession.id,
        sidebarOpen: false,
      })

      wx.showToast({
        title: '已开始新聊天',
        icon: 'success',
      })
    },

    // 删除聊天会话
    deleteChatSession(e: any) {
      console.log('主页收到删除事件:', e)
      const { sessionId } = e.detail
      console.log('要删除的会话ID:', sessionId)

      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个聊天会话吗？删除后无法恢复。',
        success: (res) => {
          if (res.confirm) {
            console.log('用户确认删除')
            const aiService = this.getAIService()
            const success = aiService.deleteChatSession(sessionId)

            if (success) {
              console.log('删除成功')
              // 更新会话列表
              const sessions = aiService.getAllChatSessions()

              // 如果删除的是当前会话，需要切换到其他会话
              if (sessionId === this.data.currentSessionId) {
                if (sessions.length > 0) {
                  const newActiveSession = sessions[0]
                  aiService.loadChatSession(newActiveSession.id)
                  this.loadMessageHistory()
                  this.setData({
                    currentSessionId: newActiveSession.id,
                  })
                } else {
                  // 如果没有其他会话，创建一个新的
                  const newSession = aiService.createNewChat()
                  this.setData({
                    messages: [],
                    currentSessionId: newSession.id,
                  })
                }
              }

              this.setData({
                chatSessions: sessions,
              })

              wx.showToast({
                title: '已删除',
                icon: 'success',
              })
            } else {
              console.log('删除失败')
              wx.showToast({
                title: '删除失败',
                icon: 'error',
              })
            }
          }
        },
      })
    },

    // 打开设置页面
    openSettings() {
      this.setData({
        sidebarOpen: false,
      })

      wx.navigateTo({
        url: '/pages/settings/settings',
      })
    },
  },
})
