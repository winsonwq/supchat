// index.ts
import { AIService, StreamCallback } from '../../lib/services/ai.js'
import {
  RenderNode,
  StreamContentType,
  StreamContent,
  ToolConfirmData,
} from '../../lib/mcp/types.js'
import { ToolCall, TowxmlNode, WxEvent } from '../../lib/mcp/types.js'
import { RenderMessage } from '../../lib/types/message' // 使用新的消息类型
import { ToolConfirmManager } from '../../lib/services/tool-confirm-manager.js'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import { ProfileVO } from '../../lib/types/profile'
import { ChatSession } from '../../lib/types/chat-history'
import { BaseComponent } from '../../lib/mcp/components/base-component.js'
import { processMessageContent as processContentWithParser } from '../../lib/utils/content-parser.js'
import { AIConfigStorage } from '../../lib/storage/ai-config-storage.js'
import { AgentModeStorage } from '../../lib/storage/agent-mode-storage.js'
import { AgentDefinition } from '../../lib/types/agent.js'

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
  loadMoreMessages,
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
    messages: [] as RenderMessage[],
    inputMessage: '',
    isLoading: false,
    scrollToMessage: '',
    isStreaming: false, // 新增：标记是否正在流式响应
    emptyMessage: {} as RenderMessage, // 空消息对象，用于加载状态
    viewportHeight: 0, // viewport 高度
    scrollViewHeight: 0, // 聊天区域高度
    chatScrollTopPadding: 0, // 聊天区域顶部间距

    // 加载更多相关数据
    isLoadingMore: false, // 是否正在加载更多消息
    hasMoreMessages: true, // 是否还有更多消息
    messageCursor: '', // 消息分页游标

    // 侧边栏相关数据
    sidebarOpen: false,
    chatSessions: [] as ChatSession[], // 聊天会话列表
    currentSessionId: '', // 当前会话ID
    userInfo: {
      name: '用户',
      avatar: '',
    } as { name: string; avatar: string },
    cloudUserId: '' as string,
    
    // Agent 模式相关数据
    currentAgent: null as AgentDefinition | null,
    isAgentMode: false, // 是否为Agent模式
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

      // 初始化Agent模式状态
      this.initAgentModeState()
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

      // 获取当前激活的AI配置信息（不包含敏感信息）
      const activeConfig = AIConfigStorage.getActiveConfig()
      const aiconfig = activeConfig ? {
        id: activeConfig.id,
        name: activeConfig.name,
        model: activeConfig.model
      } : undefined

      const partialContent =
        typeof content === 'string' ? content : JSON.stringify(content)
      appDispatch(
        addMessage({
          chatId: this.data.currentSessionId,
          role: 'assistant',
          content: partialContent,
          tool_calls: toolCalls,
          aiconfig,
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

    // 初始化Agent模式状态
    initAgentModeState() {
      const agentModeState = AgentModeStorage.getAgentModeState()
      
      // getCurrentAgent() 会自动从 AgentConfigStorage 获取最新配置
      // 如果 agent 已被删除，会自动返回 null
      const currentAgent = agentModeState.currentAgent
      
      this.setData({
        isAgentMode: agentModeState.isAgentMode,
        currentAgent: currentAgent
      })
      
      if (agentModeState.isAgentMode && currentAgent) {
        console.log('🤖 恢复 Agent 模式:', currentAgent.name)
        this.configureAgentMcpTools(currentAgent)
      }
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

    // 加载消息历史（分页：默认取最新20条，正序展示）
    async loadMessageHistory(sessionId: string) {
      if (!sessionId) {
        return
      }

      try {
        // 首次加载使用分页接口，按 desc 获取最新20条
        const result = await appDispatch(
          loadMoreMessages({ chatId: sessionId, limit: 20 })
        )

        if (result && typeof result === 'object' && 'messages' in result) {
          // 后端按 desc 返回，这里正序展示
          const latestBatchAsc = [...result.messages].reverse()
          const processedHistory = latestBatchAsc.map((msg: RenderMessage) => ({
            ...msg,
            towxmlNodes: this.processMessageContent(msg.content),
          }))

          this.setData({
            messages: processedHistory,
            // 重置/设置分页状态
            isLoadingMore: false,
            hasMoreMessages: !!result.hasMore,
            messageCursor: result.nextCursor || '',
          })
          this.scrollToLatestMessage()
          return
        }
      } catch (error) {
        console.error('加载消息历史失败:', error)
      }

      // 兜底：使用本地历史
      const history = this.getAIService().getMessageHistory()
      const processedHistory = history.map((msg: RenderMessage) => ({
        ...msg,
        towxmlNodes: this.processMessageContent(msg.content),
      }))
      this.setData({ messages: processedHistory })
      this.scrollToLatestMessage()
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
    onAiConfigChange(e: WxEvent) {
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
    onMcpChange(e: WxEvent) {
      const configId = e.detail?.id
      console.log('MCP 配置已切换:', configId)
      // MCP 配置变化处理逻辑
    },

    // Agent 模式变化处理
    onAgentChange(e: WxEvent) {
      const { agent, isAgentMode } = e.detail as { agent: AgentDefinition | null; isAgentMode: boolean }
      
      this.setData({
        currentAgent: agent,
        isAgentMode: isAgentMode
      })
      
      if (isAgentMode && agent) {
        console.log('🤖 切换到 Agent:', agent.name)
        this.configureAgentMcpTools(agent)
      } else {
        console.log('🤖 退出 Agent 模式')
        this.restoreDefaultMcpConfig()
      }
    },

    // 配置Agent的MCP工具
    configureAgentMcpTools(agent: AgentDefinition) {
      // 这里可以实现Agent模式下自动启用特定的MCP工具
      if (agent.mcpServers.length > 0) {
        console.log(`🔧 配置 ${agent.mcpServers.length} 个 MCP 工具`)
      }
    },

    // 恢复默认MCP配置
    restoreDefaultMcpConfig() {
      // 这里可以实现退出Agent模式时恢复默认的MCP配置
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
    createUserMessage(content: string): RenderMessage {
      // 获取当前激活的AI配置信息（不包含敏感信息）
      const activeConfig = AIConfigStorage.getActiveConfig()
      const aiconfig = activeConfig ? {
        id: activeConfig.id,
        name: activeConfig.name,
        model: activeConfig.model
      } : undefined

      return {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content,
        plainContent: content,
        towxmlNodes: this.processMessageContent(content),
        aiconfig,
        createdAt: new Date().toISOString(),
      }
    },

    // 构建助手占位消息
    createAssistantPlaceholder(): RenderMessage {
      // 获取当前激活的AI配置信息（不包含敏感信息）
      const activeConfig = AIConfigStorage.getActiveConfig()
      const aiconfig = activeConfig ? {
        id: activeConfig.id,
        name: activeConfig.name,
        model: activeConfig.model
      } : undefined

      return {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: '',
        plainContent: '',
        towxmlNodes: undefined,
        aiconfig,
        createdAt: new Date().toISOString(),
      }
    },

    // 追加消息到当前列表
    appendMessages(messages: RenderMessage[]) {
      const newMessages = [...this.data.messages, ...messages]
      this.setData({
        messages: newMessages,
      })
    },

    // 保存用户消息到数据库（若有会话ID）
    async saveUserMessageToDB(content: string) {
      if (!this.data.currentSessionId) return
      try {
        // 获取当前激活的AI配置信息（不包含敏感信息）
        const activeConfig = AIConfigStorage.getActiveConfig()
        const aiconfig = activeConfig ? {
          id: activeConfig.id,
          name: activeConfig.name,
          model: activeConfig.model
        } : undefined

        await appDispatch(
          addMessage({
            chatId: this.data.currentSessionId,
            role: 'user',
            content,
            aiconfig,
          }),
        )
      } catch (error) {
        console.error('保存用户消息失败:', error)
      }
    },

    // 处理流式内容更新
    handleStreamUpdate(streamContent: StreamContent) {
      const { content, type, isComplete, toolCalls, currentToolCall, toolConfirmData } =
        streamContent

      if (currentToolCall) {
        this.updateAssistantMessage(content, toolCalls, currentToolCall)
        this.scrollToLatestMessage()
        return
      }

      if (type === StreamContentType.TOOL_CONFIRM) {
        // 处理工具确认请求
        this.handleToolConfirmRequest(toolConfirmData)
        return
      }

      if (type === StreamContentType.TOOL) {
        // 获取当前激活的AI配置信息（不包含敏感信息）
        const activeConfig = AIConfigStorage.getActiveConfig()
        const aiconfig = activeConfig ? {
          id: activeConfig.id,
          name: activeConfig.name,
          model: activeConfig.model
        } : undefined

        const toolMessage: RenderMessage = {
          id: `msg_${Date.now()}_tool`,
          role: 'tool',
          content,
          plainContent: typeof content === 'string' ? content : '',
          towxmlNodes: this.processMessageContent(content),
          aiconfig,
          createdAt: new Date().toISOString(),
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
          // 获取当前激活的AI配置信息（不包含敏感信息）
          const activeConfig = AIConfigStorage.getActiveConfig()
          const aiconfig = activeConfig ? {
            id: activeConfig.id,
            name: activeConfig.name,
            model: activeConfig.model
          } : undefined

          const finalContent =
            typeof content === 'string' ? content : JSON.stringify(content)
          appDispatch(
            addMessage({
              chatId: this.data.currentSessionId,
              role: 'assistant',
              content: finalContent,
              tool_calls: toolCalls,
              aiconfig,
            }),
          ).catch((error) => {
            console.error('保存助手消息失败:', error)
          })
        }

        // 移除 loadMessageHistory 调用，因为消息已经在 UI 中正确显示
        // 避免重复加载导致的性能问题和潜在的竞态条件
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
          // 重置加载更多状态
          isLoadingMore: false,
          hasMoreMessages: true,
          messageCursor: '',
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

    // 生成聊天标题
    async generateChatTitle(e: WXEvent<{ sessionId: string }>) {
      const { sessionId } = e.detail
      
      if (!sessionId) {
        wx.showToast({
          title: '生成失败：会话ID为空',
          icon: 'error'
        })
        return
      }

      try {
        // 显示加载提示
        wx.showLoading({
          title: '正在生成标题...',
          mask: true
        })

        // 调用云函数生成标题
        const result = await wx.cloud.callFunction({
          name: 'supchat',
          data: {
            route: `/chats/${sessionId}/generate-title`,
            method: 'POST'
          }
        })

        wx.hideLoading()

        if (result.result && typeof result.result === 'object' && 'ok' in result.result && result.result.ok && 'data' in result.result && result.result.data) {
          const newTitle = (result.result as any).data.title
          
          // 更新本地聊天会话列表
          const updatedChatSessions = this.data.chatSessions.map(chat => {
            if (chat.id === sessionId) {
              return { ...chat, title: newTitle }
            }
            return chat
          })
          
          this.setData({
            chatSessions: updatedChatSessions
          })

          wx.showToast({
            title: '标题生成成功',
            icon: 'success'
          })
        } else {
          throw new Error((result.result as any)?.error || '生成标题失败')
        }
      } catch (error) {
        wx.hideLoading()
        console.error('生成标题失败:', error)
        wx.showToast({
          title: '生成标题失败',
          icon: 'error'
        })
      }
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

    // 处理加载更多消息事件
    async onLoadMore() {
      const { currentSessionId, isLoadingMore, hasMoreMessages, messageCursor } = this.data
      
      if (!currentSessionId || isLoadingMore || !hasMoreMessages) {
        return
      }

      try {
        this.setData({ isLoadingMore: true })

        const result = await appDispatch(loadMoreMessages({
          chatId: currentSessionId,
          cursor: messageCursor,
          limit: 20,
        }))

        if (result && typeof result === 'object' && 'messages' in result) {
          const { messages, hasMore, nextCursor } = result

          // 新批次按 desc 返回，正序后插入到现有列表前端
          const batchAsc = [...messages].reverse().map((m: RenderMessage) => ({
            ...m,
            towxmlNodes: this.processMessageContent(m.content),
          }))

          const currentMessages = this.data.messages
          const merged = [...batchAsc, ...currentMessages]

          this.setData({
            messages: merged,
            hasMoreMessages: hasMore,
            messageCursor: nextCursor || '',
          })
        } else {
          console.error('加载更多消息失败:', result)
        }
      } catch (error) {
        console.error('加载更多消息异常:', error)
      } finally {
        this.setData({ isLoadingMore: false })
      }
    },

    /**
     * 处理工具确认请求
     */
    handleToolConfirmRequest(toolConfirmData: ToolConfirmData | undefined) {
      if (!toolConfirmData) return

      // 找到最后一个包含 tool_calls 的 assistant 消息
      const updatedMessages = [...this.data.messages]
      let lastAssistantIndex = -1
      for (let i = updatedMessages.length - 1; i >= 0; i--) {
        const msg = updatedMessages[i]
        if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
          lastAssistantIndex = i
          break
        }
      }

      if (lastAssistantIndex !== -1) {
        // 在现有的 assistant 消息中添加工具确认数据
        updatedMessages[lastAssistantIndex] = {
          ...updatedMessages[lastAssistantIndex],
          toolConfirmData, // 添加确认数据到现有消息
        }

        this.setData({ messages: updatedMessages })
        this.scrollToLatestMessage()
      } else {
        console.warn('未找到包含工具调用的助手消息来显示工具确认')
      }
    },

    /**
     * 处理工具确认
     */
    onToolConfirm(event: any) {
      const { confirmId } = event.detail
      console.log('用户确认工具执行:', confirmId)
      
      // 移除确认消息
      this.removeConfirmMessage(confirmId)
      
      // 通知确认管理器
      const confirmManager = ToolConfirmManager.getInstance()
      confirmManager.handleConfirm(confirmId)
    },

    /**
     * 处理工具取消
     */
    onToolCancel(event: any) {
      const { confirmId } = event.detail
      console.log('用户取消工具执行:', confirmId)
      
      // 移除确认消息
      this.removeConfirmMessage(confirmId)
      
      // 通知确认管理器
      const confirmManager = ToolConfirmManager.getInstance()
      confirmManager.handleCancel(confirmId)
    },

    /**
     * 移除确认数据
     */
    removeConfirmMessage(confirmId: string) {
      const updatedMessages = this.data.messages.map(msg => {
        if (msg.toolConfirmData && msg.toolConfirmData.confirmId === confirmId) {
          // 移除工具确认数据，保留消息本身
          const { toolConfirmData, ...msgWithoutConfirm } = msg
          return msgWithoutConfirm
        }
        return msg
      })
      this.setData({ messages: updatedMessages })
    },
  },
})
