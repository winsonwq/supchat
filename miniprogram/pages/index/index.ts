// index.ts
import { AIService, StreamCallback } from '../../lib/services/ai.js'
import {
  RenderNode,
  StreamContentType,
  StreamContent,
} from '../../lib/mcp/types.js'
import { ToolCall, TowxmlNode, WxEvent } from '../../lib/mcp/types.js'
import { RenderMessage, Message } from '../../lib/types/message' // 使用新的消息类型
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import { ProfileVO } from '../../lib/types/profile'
import { ChatSession } from '../../lib/types/chat-history'
import { BaseComponent } from '../../lib/mcp/components/base-component.js'
import { processMessageContent as processContentWithParser } from '../../lib/utils/content-parser.js'

import { ComponentManager } from '../../lib/mcp/components/component-manager.js'
import { appDispatch, rootStore } from '../../lib/state/states/root'
import { subscribe } from '../../lib/state/bind'
import { selectUserBrief } from '../../lib/state/selectors/user'
import { fetchProfile } from '../../lib/state/actions/user'
import {
  fetchChats,
  createChat,
  deleteChat,
  setCurrentChat,
  addMessage,
  switchToChat,
} from '../../lib/state/actions/chat'
import { selectChats } from '../../lib/state/selectors/chat'

// 获取 ComponentManager 实例
function getComponentManager(): ComponentManager | null {
  try {
    return ComponentManager.getInstance()
  } catch (error) {
    console.error('获取 ComponentManager 失败:', error)
    return null
  }
}

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
    } as { name: string; avatar: string },
    cloudUserId: '' as string,
  },

  lifetimes: {
    attached() {
      // 计算安全区域和导航栏高度
      this.calculateSafeAreaPadding()

      // 计算 viewport 高度
      this.calculateViewportHeight()
      // 初始化聊天会话
      this.initChatSessions()
      // 加载用户信息
      this.loadUserInfo()
      // 订阅全局用户信息
      this.subscribeUser()
      // 订阅聊天数据
      this.subscribeChats()

      // 登录并引导完善资料
      this.ensureAuthAndProfile()
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
      // 取消用户订阅
      const unsub = (this as any)._unsubUser as (() => void) | undefined
      unsub && unsub()
      // 取消聊天订阅
      const unsubChats = (this as any)._unsubChats as (() => void) | undefined
      unsubChats && unsubChats()
    },
  },

  methods: {
    // 如果符合条件，持久化一次包含 tool_calls 的助手消息
    maybePersistAssistantToolPlan(streamContent: StreamContent) {
      const { content, toolCalls, isComplete } = streamContent
      if (
        isComplete ||
        !toolCalls ||
        toolCalls.length === 0 ||
        !this.data.currentSessionId
      ) {
        return
      }

      const partialContent =
        typeof content === 'string' ? content : JSON.stringify(content)
      appDispatch(
        addMessage({
          chatId: this.data.currentSessionId,
          role: 'assistant',
          content: partialContent,
          tool_calls: toolCalls,
        }),
      ).catch((error) => {
        console.error('保存含工具计划的助手消息失败:', error)
      })
    },

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

    // 订阅全局用户信息
    subscribeUser() {
      const unsub = subscribe(
        rootStore,
        (s) => selectUserBrief((s as any).user),
        (u) => {
          this.setData({
            userInfo: {
              name: u.name,
              avatar: u.avatar || '',
            },
          })
        },
      )
      ;(this as any)._unsubUser = unsub
    },

    // 订阅聊天数据
    subscribeChats() {
      const unsub = subscribe(
        rootStore,
        (s) => selectChats(s as any),
        (chats) => {
          this.setData({
            chatSessions: chats,
          })
        },
      )
      ;(this as any)._unsubChats = unsub
    },

    // 计算 viewport 高度
    calculateViewportHeight() {
      const systemInfo = wx.getSystemInfoSync()
      const viewportHeight = systemInfo.windowHeight

      wx.nextTick(() => {
        const query = wx.createSelectorQuery().in(this)
        query
          .select('.chat-scroll-view')
          .boundingClientRect((rect: WechatMiniprogram.BoundingClientRectCallbackResult | null) => {
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
    async loadMessageHistory(sessionId: string) {
      if (!sessionId) {
        return
      }

      try {
        const chatWithMessages = await appDispatch(switchToChat(sessionId))

        if (chatWithMessages?.chatWithMessages?.messages) {
          const processedHistory =
            chatWithMessages.chatWithMessages.messages.map((msg) => {
              return {
                ...msg,
                towxmlNodes: this.processMessageContent(msg.content),
              }
            })

          this.setData({
            messages: processedHistory,
          })
          this.scrollToLatestMessage()
        }
      } catch (error) {
        console.error('加载消息历史失败:', error)
        // 如果从数据库加载失败，回退到本地历史
        const history = this.getAIService().getMessageHistory()
        const processedHistory = history.map((msg: RenderMessage) => {
          return {
            ...msg,
            towxmlNodes: this.processMessageContent(msg.content),
          }
        })

        this.setData({
          messages: processedHistory,
        })
        this.scrollToLatestMessage()
      }
    },

    // 初始化聊天会话
    async initChatSessions() {
      try {
        // 使用 Redux store 获取聊天数据
        const chats = await appDispatch(fetchChats())

        if (chats.length === 0) {
          const newSession = await appDispatch(createChat({ title: '新对话' }))
          this.setData({
            chatSessions: [newSession],
            currentSessionId: newSession.id,
          })

          // 设置AI服务的当前聊天会话ID
          this.getAIService().setCurrentChatId(newSession.id)
        } else {
          const activeSession = chats[0]
          const currentSessionId = activeSession?.id || chats[0].id
          this.setData({
            chatSessions: chats,
            currentSessionId,
          })

          // 设置AI服务的当前聊天会话ID
          this.getAIService().setCurrentChatId(currentSessionId)

          if (activeSession) {
            this.loadMessageHistory(activeSession.id)
          }
        }
      } catch (error) {
        console.error('初始化聊天会话失败:', error)
        wx.showToast({
          title: '初始化失败',
          icon: 'error',
        })
      }
    },

    // 加载用户信息（已由全局 store 订阅驱动，无需本地缓存）
    loadUserInfo() {},

    // 登录并确保用户资料存在
    async ensureAuthAndProfile() {
      try {
        const profile = await appDispatch(fetchProfile())
        const userId = profile._id

        this.setData({ cloudUserId: userId })
      } catch (e) {
        console.warn('登录/资料获取失败:', e)
      }
    },

    // 处理用户信息更新
    onUserInfoUpdated(e: WxEvent) {
      const { userInfo } = e.detail as { userInfo: ProfileVO | null }
      if (userInfo) {
        this.setData({
          userInfo: {
            name: userInfo.nickname || '用户',
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

    // 处理消息内容，使用智能内容类型判断和towxml解析
    processMessageContent(content: RenderNode): TowxmlNode | undefined {
      try {
        // 如果是组件，需要先注册
        if (content instanceof BaseComponent) {
          const componentManager = getComponentManager()
          componentManager?.registerComponent(content)
        }

        // 使用新的内容解析工具
        return processContentWithParser(content, app, (e: WxEvent) => {
          this.handleComponentEvent(e)
        })
      } catch (error) {
        console.error('towxml解析错误:', error)
        return app.towxml(String(content), 'text')
      }
    },

    handleComponentEvent(e: WxEvent) {
      try {
        const eventData = (e.currentTarget as any)?.dataset?.data?.attrs || {}
        const componentId = eventData['data-component-id']
        const eventName = eventData['data-action']

        if (!componentId || !eventName) {
          console.warn('事件对象中缺少组件ID或事件名称:', {
            componentId,
            eventName,
          })
          return
        }

        const componentManager = getComponentManager()
        const success = componentManager?.handleComponentEvent(
          componentId,
          eventName,
          e,
        )

        if (!success) {
          console.warn(`组件事件处理失败: ${componentId}.${eventName}`)
        }
      } catch (error) {
        console.error('处理组件事件时发生错误:', error)
      }
    },

    // 输入框变化
    onInputChange(e: WxEvent) {
      this.setData({
        inputMessage: e.detail.value || '',
      })
    },

    // 处理组件发送事件
    onSendMessage(e: WXEvent<{ message: string }>) {
      // 从事件中获取消息内容
      const message = e.detail?.message || this.data.inputMessage.trim()
      this.sendMessage(message)
    },

    // 处理 AI 配置变化事件
    onAiConfigChange(e: WxEvent<{ id: string }>) {
      const configId = e.detail?.id
      console.log('AI 配置已切换:', configId)
      // AI 服务会自动使用新的激活配置，无需额外处理
      wx.showToast({
        title: 'AI 配置已切换',
        icon: 'success',
        duration: 1500,
      })
    },

    // 处理 MCP 配置变化事件
    onMcpChange(e: WxEvent<{ id: string }>) {
      const configId = e.detail?.id
      console.log('MCP 配置已切换:', configId)
      // MCP 配置变化处理逻辑
    },

    // 发送消息（流式模式）
    async sendMessage(message?: string) {
      const messageContent = message || this.data.inputMessage.trim()
      if (!messageContent || this.data.isLoading) {
        return
      }

      // 清空输入框
      this.setData({
        inputMessage: '',
        isLoading: true,
        isStreaming: true,
      })

      try {
        const userMessage = this.createUserMessage(messageContent)
        const assistantMessage = this.createAssistantPlaceholder()
        this.appendMessages([userMessage, assistantMessage])

        await this.saveUserMessageToDB(messageContent)

        this.scrollToUserMessageTop()

        const onStream: StreamCallback = (streamContent) =>
          this.handleStreamUpdate(streamContent)

        this.getAIService().setCurrentChatId(this.data.currentSessionId)

        await this.getAIService().sendMessageStream(messageContent, onStream)
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

    // 构建用户消息
    createUserMessage(content: string): Message {
      return {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content,
        plainContent: content,
        towxmlNodes: this.processMessageContent(content),
        timestamp: Date.now(),
      }
    },

    // 构建助手占位消息
    createAssistantPlaceholder(): Message {
      return {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: '',
        plainContent: '',
        towxmlNodes: undefined,
        timestamp: Date.now(),
      }
    },

    // 追加消息到当前列表
    appendMessages(messages: Message[]) {
      const newMessages = [...this.data.messages, ...messages]
      this.setData({
        messages: newMessages,
      })
    },

    // 保存用户消息到数据库（若有会话ID）
    async saveUserMessageToDB(content: string) {
      if (!this.data.currentSessionId) return
      try {
        await appDispatch(
          addMessage({
            chatId: this.data.currentSessionId,
            role: 'user',
            content,
          }),
        )
      } catch (error) {
        console.error('保存用户消息失败:', error)
      }
    },

    // 处理流式内容更新
    handleStreamUpdate(streamContent: StreamContent) {
      const { content, type, isComplete, toolCalls, currentToolCall } =
        streamContent

      if (currentToolCall) {
        this.updateAssistantMessage(content, toolCalls, currentToolCall)
        this.scrollToLatestMessage()
        return
      }

      if (type === StreamContentType.TOOL) {
        const toolMessage: Message = {
          id: `msg_${Date.now()}_tool`,
          role: 'tool',
          content,
          plainContent: typeof content === 'string' ? content : '',
          towxmlNodes: this.processMessageContent(content),
          timestamp: Date.now(),
        }
        const updatedMessages = [...this.data.messages, toolMessage]
        this.setData({ messages: updatedMessages })
      } else {
        this.updateAssistantMessage(content, toolCalls, undefined)
      }

      if (streamContent.shouldPersistAssistantToolPlan) {
        this.maybePersistAssistantToolPlan(streamContent)
      }

      this.scrollToLatestMessage()

      if (isComplete) {
        this.setData({
          isLoading: false,
          isStreaming: false,
        })

        if (this.data.currentSessionId) {
          const finalContent =
            typeof content === 'string' ? content : JSON.stringify(content)
          appDispatch(
            addMessage({
              chatId: this.data.currentSessionId,
              role: 'assistant',
              content: finalContent,
              tool_calls: toolCalls,
            }),
          )
        }

        this.loadMessageHistory(this.data.currentSessionId)
      }
    },

    // 更新助手消息内容
    updateAssistantMessage(
      content: RenderNode,
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

      // 持久化当前被中断的助手消息（如果有内容）
      try {
        const msgs = this.data.messages
        if (msgs.length > 0 && this.data.currentSessionId) {
          // 从末尾向前找到最后一条助手消息
          for (let i = msgs.length - 1; i >= 0; i--) {
            const m = msgs[i]
            if (m.role === 'assistant') {
              const finalContent =
                typeof m.content === 'string'
                  ? m.content
                  : JSON.stringify(m.content)
              if (finalContent && finalContent.trim()) {
                appDispatch(
                  addMessage({
                    chatId: this.data.currentSessionId,
                    role: 'assistant',
                    content: finalContent,
                    tool_calls: m.tool_calls,
                  }),
                ).catch((error) => {
                  console.error('保存中断的助手消息失败:', error)
                })
              }
              break
            }
          }
        }
      } catch (e) {
        console.warn('处理中断消息时出错:', e)
      }

      this.setData({
        isLoading: false,
        isStreaming: false,
      })

      // 刷新一次历史，以确保UI与数据库同步
      if (this.data.currentSessionId) {
        this.loadMessageHistory(this.data.currentSessionId)
      }

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
      }, 200) // 增加延迟时间，确保消息完全渲染
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
            // 清空当前页面的消息
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
    async selectChatSession(e: WXEvent<{ sessionId: string }>) {
      const { sessionId } = e.detail

      try {
        await appDispatch(setCurrentChat(sessionId))
        this.loadMessageHistory(sessionId)

        this.setData({
          currentSessionId: sessionId,
          sidebarOpen: false,
        })

        // 设置AI服务的当前聊天会话ID
        this.getAIService().setCurrentChatId(sessionId)

        wx.showToast({
          title: '已切换会话',
          icon: 'success',
        })
      } catch (error) {
        console.error('切换会话失败:', error)
        wx.showToast({
          title: '切换会话失败',
          icon: 'error',
        })
      }
    },

    // 创建新话题
    async createNewTopic() {
      try {
        const newSession = await appDispatch(createChat({ title: '新话题' }))

        // 重新获取聊天列表
        const chats = await appDispatch(fetchChats())

        this.setData({
          messages: [],
          chatSessions: chats,
          currentSessionId: newSession.id,
          sidebarOpen: false,
        })

        // 设置AI服务的当前聊天会话ID
        this.getAIService().setCurrentChatId(newSession.id)

        wx.showToast({
          title: '已创建新话题',
          icon: 'success',
        })
      } catch (error) {
        console.error('创建新话题失败:', error)
        wx.showToast({
          title: '创建失败',
          icon: 'error',
        })
      }
    },

    // 处理新建聊天事件
    async onNewChat() {
      try {
        const newSession = await appDispatch(createChat({ title: '新聊天' }))

        // 重新获取聊天列表
        const chats = await appDispatch(fetchChats())

        this.setData({
          messages: [],
          chatSessions: chats,
          currentSessionId: newSession.id,
          sidebarOpen: false,
        })

        // 设置AI服务的当前聊天会话ID
        this.getAIService().setCurrentChatId(newSession.id)

        wx.showToast({
          title: '已开始新聊天',
          icon: 'success',
        })
      } catch (error) {
        console.error('创建新聊天失败:', error)
        wx.showToast({
          title: '创建失败',
          icon: 'error',
        })
      }
    },

    // 删除聊天会话
    async deleteChatSession(e: WXEvent<{ sessionId: string }>) {
      const { sessionId } = e.detail

      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个聊天会话吗？删除后无法恢复。',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 删除聊天会话（这会自动更新redux状态）
              await appDispatch(deleteChat(sessionId))

              // 不需要重新获取聊天列表，redux已经自动更新了
              // 从redux状态中获取最新的chats
              const currentState = rootStore.getState()
              const chats = currentState.chat.chats

              // 如果删除的是当前会话，需要切换到其他会话
              if (sessionId === this.data.currentSessionId) {
                if (chats.length > 0) {
                  const newActiveSession = chats[0]
                  await appDispatch(setCurrentChat(newActiveSession.id))
                  this.loadMessageHistory(newActiveSession.id).catch(
                    (error) => {
                      console.error('删除会话后加载消息历史失败:', error)
                    },
                  )
                  this.setData({
                    currentSessionId: newActiveSession.id,
                  })
                } else {
                  // 如果没有其他会话，创建一个新的
                  const newSession = await appDispatch(
                    createChat({ title: '新对话' }),
                  )
                  this.setData({
                    messages: [],
                    currentSessionId: newSession.id,
                  })
                }
              }

              // 更新本地状态，使用redux中的最新数据
              this.setData({
                chatSessions: chats,
              })

              wx.showToast({
                title: '已删除',
                icon: 'success',
              })

              // 注意：不通知sidebar退出编辑模式，保持编辑状态
            } catch (error) {
              console.error('删除失败:', error)
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

    // 处理消息列表滚动到最新消息事件
    onScrollToLatest() {
      this.scrollToLatestMessage()
    },

    // 处理消息点击事件
    onMessageTap(_e: WXEvent<{ messageIndex: number }>) {
      // 可以在这里添加消息点击的逻辑
    },
  },
})
