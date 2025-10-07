import { AIConfigStorage } from '../storage/ai-config-storage.js'
import { AgentModeStorage } from '../storage/agent-mode-storage.js'
import { ChatHistoryStorageFactory } from '../storage/chat-history-storage-interface.js'
import { processToolCalls, buildToolCallResponse } from '../mcp/index.js'
import { ToolManager } from './tool-manager.js'
import {
  formatToolCallErrorMessage,
  createStreamContent,
} from '../utils/util.js'
import {
  ToolCall,
  ToolCallDelta,
  AIResponse,
  HttpResponse,
  WxRequestTask,
  ToolResponseMessage,
  ToolCallResult,
  StreamContent,
  StreamContentType,
  RenderNode,
} from '../mcp/types.js'
import {
  AIMessage,
  AIMessageHistory,
  RenderMessage,
  RenderMessageHistory,
  MessageConverter,
} from '../types/message.js'
import { ToolConfirmManager } from './tool-confirm-manager.js'
import { ComponentRenderer } from '../mcp/components/component-renderer.js'
import chatService from './chat.js'

// 流式响应回调类型
export type StreamCallback = (streamContent: StreamContent) => void

// 请求配置类型
interface RequestConfig {
  url: string
  method: 'POST' | 'GET' | 'PUT' | 'DELETE'
  headers: Record<string, string>
  data: Record<string, unknown>
}

// AI服务类
export class AIService {
  private static instance: AIService
  private renderMessages: RenderMessageHistory = [] // 内部渲染消息
  private currentRequestTask: WxRequestTask | null = null
  private chatHistoryStorage = ChatHistoryStorageFactory.getInstance()
  private currentChatId: string | null = null // 当前聊天会话ID
  private isCancelled: boolean = false // 取消标记：用于软中断后续处理
  private streamingIntervalId: number | null = null // 非流式模拟的 interval ID
  private streamingSupported: boolean | null = null // 流式请求支持状态：null=未知，true=支持，false=不支持

  private constructor() {
    // 初始化工具确认管理器回调
    const confirmManager = ToolConfirmManager.getInstance()
    confirmManager.setStreamCallback((content: StreamContent) => {
      // 暂存回调，在发送消息时会被正确设置
      this.pendingToolConfirmContent = content
    })
  }

  private pendingToolConfirmContent: StreamContent | null = null

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // 添加消息到历史记录
  addMessage(
    role: 'user' | 'assistant' | 'tool',
    content?: RenderNode,
    tool_call_id?: string,
    tool_calls?: ToolCall[],
  ) {
    // 获取当前激活的AI配置信息（不包含敏感信息）
    const activeConfig = AIConfigStorage.getActiveConfig()
    const aiconfig = activeConfig ? {
      id: activeConfig.id,
      name: activeConfig.name,
      model: activeConfig.model
    } : undefined

    // 获取当前Agent信息（不包含敏感信息）
    const currentAgent = this.getCurrentAgent()
    const agent = currentAgent ? {
      name: currentAgent.name
    } : undefined

    const renderMessage: RenderMessage = {
      id: MessageConverter.generateMessageId(),
      role,
      content: content || '',
      plainContent: MessageConverter.extractPlainText(content || ''),
      tool_call_id,
      tool_calls,
      aiconfig,
      agent,
      createdAt: new Date().toISOString(),
    }

    this.renderMessages.push(renderMessage)

    // 同时保存到聊天历史存储
    const activeSession = this.chatHistoryStorage.getActiveSession()
    if (activeSession) {
      this.chatHistoryStorage.addMessage(activeSession.id, renderMessage)
    }

    // 如果是工具消息，也通过云函数存储到数据库
    if (role === 'tool') {
      const chatId = this.currentChatId || activeSession?.id
      if (chatId) {
        this.storeToolMessageToCloud(chatId, renderMessage).catch((error) => {
          console.error('存储工具消息到云函数失败:', error)
        })
      } else {
        console.warn('无法存储工具消息：没有可用的聊天会话ID')
      }
    }
  }

  // 获取所有消息（包括系统消息） - 用于 AI 通信
  getMessagesForAI(): AIMessageHistory {
    // 获取当前Agent配置
    const currentAgent = this.getCurrentAgent()
    
    // 根据Agent模式设置系统提示词
    const systemMessage: AIMessage = {
      role: 'system',
      content: currentAgent 
        ? currentAgent.systemPrompt 
        : '你是一个有用的AI助手，请用简洁友好的方式回答用户的问题。你可以使用可用的工具来帮助用户。当需要使用工具时，请直接调用相应的工具。',
    }
    

    const aiMessages = MessageConverter.renderToAIHistory(this.renderMessages)
    return [systemMessage, ...aiMessages]
  }

  // 获取当前Agent配置
  getCurrentAgent() {
    const agentModeState = AgentModeStorage.getAgentModeState()
    
    // 只有在Agent模式启用时才返回存储的Agent
    if (agentModeState.isAgentMode && agentModeState.currentAgent) {
      return agentModeState.currentAgent
    }
    
    return null
  }

  // 设置当前聊天会话ID
  setCurrentChatId(chatId: string) {
    this.currentChatId = chatId
  }

  // 获取当前聊天会话ID
  getCurrentChatId(): string | null {
    return this.currentChatId
  }

  // 将工具消息存储到云函数
  private async storeToolMessageToCloud(
    chatId: string,
    message: RenderMessage,
  ) {
    try {
      await chatService.addMessage({
        chatId,
        role: message.role,
        content: message.content,
        tool_call_id: message.tool_call_id,
        aiconfig: message.aiconfig,
      })
    } catch (error) {
      console.error('存储工具消息到云函数失败:', error)
      throw error
    }
  }

  // 获取所有消息（用于渲染）
  getMessages(): RenderMessageHistory {
    return [...this.renderMessages]
  }

  // 清空消息历史
  clearMessages() {
    this.renderMessages = []
    // 同时清空当前会话的消息
    const activeSession = this.chatHistoryStorage.getActiveSession()
    if (activeSession) {
      // 类型定义中 ChatSession 不包含 messages 字段，这里以 any 断言以兼容实现
      ;(this.chatHistoryStorage as any).updateSession(activeSession.id, {
        messages: [],
      })
    }
  }

  // 创建新的聊天会话
  createNewChat(): any {
    // 创建新的会话
    const newSession = this.chatHistoryStorage.createSession()
    // 清空当前消息
    this.renderMessages = []
    return newSession
  }

  // 加载指定的聊天会话
  loadChatSession(sessionId: string): boolean {
    const session = this.chatHistoryStorage.getSessionById(sessionId)
    if (!session) {
      return false
    }

    // 设置会话为活跃
    this.chatHistoryStorage.setActiveSession(sessionId)

    // 加载会话消息
    // 兼容存储实现：若存在 messages 字段则加载，否则保持空
    const sessionMessages = (session as any).messages || []
    this.renderMessages = [...sessionMessages]

    return true
  }

  // 获取所有聊天会话
  getAllChatSessions() {
    return this.chatHistoryStorage.getAllSessions()
  }

  // 删除聊天会话
  deleteChatSession(sessionId: string): boolean {
    // 接口未声明 deleteSession，这里以 any 兼容调用
    return (this.chatHistoryStorage as any).deleteSession(sessionId)
  }

  // 获取当前活跃会话
  getCurrentSession() {
    return this.chatHistoryStorage.getActiveSession()
  }

  // 更新会话
  updateSession(sessionId: string, updates: any): boolean {
    return this.chatHistoryStorage.updateSession(sessionId, updates)
  }

  // 获取当前激活的AI配置
  private getActiveAIConfig() {
    const activeConfig = AIConfigStorage.getActiveConfig()
    if (!activeConfig) {
      throw new Error('没有激活的AI配置，请先在设置中配置AI服务')
    }
    return activeConfig
  }

  // 检查AI配置是否有效
  private isActiveConfigValid(): boolean {
    try {
      const activeConfig = AIConfigStorage.getActiveConfig()
      if (!activeConfig) {
        return false
      }

      const validation = AIConfigStorage.validateConfig(activeConfig)
      return validation.isValid
    } catch (error) {
      return false
    }
  }

  // 构建请求配置
  private buildRequestConfig(
    data: Record<string, unknown>,
    isStream: boolean = false,
  ): RequestConfig {
    const aiConfig = this.getActiveAIConfig()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.apiKey}`,
    }

    if (isStream) {
      headers.Accept = 'text/event-stream'
    }

    // 使用工具管理器获取工具，支持agent模式
    const toolManager = ToolManager.getInstance()
    const currentAgent = this.getCurrentAgent()
    const allAvailableTools = currentAgent 
      ? toolManager.getAllToolsForAgent(currentAgent)
      : toolManager.getAllTools()

    return {
      url: `${aiConfig.apiHost}/chat/completions`,
      method: 'POST',
      headers,
      data: {
        model: aiConfig.model,
        messages: this.getMessagesForAI(), // 使用 AI 格式的消息
        tools: allAvailableTools,
        tool_choice: 'auto',
        stream: isStream,
        ...data,
      },
    }
  }

  // 发送HTTP请求
  private async sendHttpRequest(config: RequestConfig): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.url,
        method: config.method,
        header: config.headers,
        data: config.data,
        success: resolve,
        fail: reject,
      })
    })
  }

  // 取消之前的请求
  private cancelPreviousRequest() {
    if (this.currentRequestTask) {
      this.currentRequestTask.abort()
      this.currentRequestTask = null
    }
  }

  // 发送消息到AI服务（流式模式）
  async sendMessageStream(
    userMessage: string,
    onStream: StreamCallback,
  ): Promise<void> {
    // 重置取消标记
    this.isCancelled = false
    
    // 检查AI配置是否有效
    if (!this.isActiveConfigValid()) {
      const errorMessage =
        '❌ AI配置无效或未选择，请先选择一个有效的AI配置\n\n💡 点击输入框左侧的AI配置按钮'
      this.addMessage('assistant', errorMessage)
      onStream(createStreamContent(errorMessage, StreamContentType.ERROR, true))
      return
    }

    // 添加用户消息到AI Service的内部历史（用于构建发送给AI的消息）
    this.addMessage('user', userMessage)

    try {
      const aiConfig = this.getActiveAIConfig()
      
      // 取消之前的请求
      this.cancelPreviousRequest()

      // 如果已知流式请求不被支持，直接使用非流式模式
      if (this.streamingSupported === false) {
        return new Promise((resolve, reject) => {
          this.fallbackToNonStream(userMessage, onStream, resolve, reject)
        })
      }

      return new Promise((resolve, reject) => {
        const config = this.buildRequestConfig({}, true)

        // 使用 wx.request 发送流式请求
        this.currentRequestTask = wx.request({
          ...config,
          success: (response: HttpResponse) => {
            if (this.isCancelled) {
              // 已被取消：不再处理
              resolve()
              return
            }
            this.handleStreamResponse(response, onStream, resolve, reject)
          },
          fail: (error: unknown) => {
            console.error('流式请求失败:', error)
            // 标记流式请求不被支持
            this.streamingSupported = false
            // 如果流式请求失败，回退到非流式模式
            if (this.isCancelled) {
              resolve()
              return
            }
            this.fallbackToNonStream(userMessage, onStream, resolve, reject)
          },
        })
      })
    } catch (error: unknown) {
      console.error('AI服务流式请求失败:', error)
      const errorMessage = this.getErrorMessage(error)
      onStream(createStreamContent(errorMessage, StreamContentType.ERROR, true))
    }
  }

  // 获取错误消息
  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'errMsg' in error) {
      const errMsg = (error as { errMsg: string }).errMsg
      if (errMsg.includes('request:fail')) {
        return '网络连接失败，请检查网络设置后重试。'
      }
    }
    return '抱歉，服务暂时不可用，请稍后重试。'
  }

  // 处理流式响应
  private async handleStreamResponse(
    response: HttpResponse,
    onStream: StreamCallback,
    resolve: () => void,
    reject: (error: unknown) => void,
  ) {
    if (this.isCancelled) {
      resolve()
      return
    }
    if (response.statusCode === 200) {
      try {
        const data = response.data
        if (typeof data === 'string') {
          // 标记流式请求被支持
          this.streamingSupported = true
          await this.processStreamData(data, onStream, resolve)
        } else {
          // 如果不是字符串格式，说明服务不支持流式响应
          this.streamingSupported = false
          // 回退到非流式模式
          if (this.isCancelled) {
            resolve()
            return
          }
          this.fallbackToNonStream('', onStream, resolve, reject)
        }
      } catch (error) {
        console.error('处理流式响应失败:', error)
        this.streamingSupported = false
        if (this.isCancelled) {
          resolve()
          return
        }
        this.fallbackToNonStream('', onStream, resolve, reject)
      }
    } else {
      console.error('API响应错误:', response)
      this.streamingSupported = false
      if (this.isCancelled) {
        resolve()
        return
      }
      this.fallbackToNonStream('', onStream, resolve, reject)
    }
  }

  // 处理流式数据
  private async processStreamData(
    data: string,
    onStream: StreamCallback,
    resolve: () => void,
  ) {
    const lines = data.split('\n')
    let assistantContent: RenderNode = ''
    let hasToolCalls = false
    let toolCalls: ToolCall[] = []

    for (const line of lines) {
      if (this.isCancelled) {
        resolve()
        return
      }
      if (line.startsWith('data: ')) {
        const jsonData = line.slice(6)
        if (jsonData === '[DONE]') {
          // 流式响应结束
          if (this.isCancelled) {
            resolve()
            return
          }
          await this.handleStreamCompletion(
            assistantContent,
            hasToolCalls,
            toolCalls,
            onStream,
            resolve,
          )
          return
        }

        try {
          const parsed = JSON.parse(jsonData) as AIResponse
          const delta = parsed.choices?.[0]?.delta

          if (delta?.content) {
            assistantContent += delta.content
            if (!this.isCancelled) {
              onStream(
                createStreamContent(
                  assistantContent,
                  StreamContentType.NORMAL,
                  false,
                ),
              )
            }
          }

          // 检查是否有工具调用
          if (delta?.tool_calls) {
            hasToolCalls = true
            toolCalls = this.processToolCallDelta(delta.tool_calls, toolCalls)
          }
        } catch (e) {
          console.warn('解析流式数据失败:', e)
        }
      }
    }
  }

  // 处理工具调用增量
  private processToolCallDelta(
    toolCallDeltas: ToolCallDelta[],
    existingToolCalls: ToolCall[],
  ): ToolCall[] {
    for (const toolCallDelta of toolCallDeltas) {
      if (toolCallDelta.index !== undefined) {
        // 新的工具调用
        if (!existingToolCalls[toolCallDelta.index]) {
          existingToolCalls[toolCallDelta.index] = {
            id: toolCallDelta.id || '',
            type: 'function',
            function: {
              name: toolCallDelta.function?.name || '',
              arguments: toolCallDelta.function?.arguments || '',
            },
          }
        } else {
          // 更新现有工具调用
          if (toolCallDelta.id) {
            existingToolCalls[toolCallDelta.index].id = toolCallDelta.id
          }
          if (toolCallDelta.function?.name) {
            existingToolCalls[toolCallDelta.index].function.name =
              toolCallDelta.function.name
          }
          if (toolCallDelta.function?.arguments) {
            existingToolCalls[toolCallDelta.index].function.arguments +=
              toolCallDelta.function.arguments
          }
        }
      }
    }
    return existingToolCalls
  }

  // 处理流式响应完成
  private async handleStreamCompletion(
    assistantContent: RenderNode,
    hasToolCalls: boolean,
    toolCalls: ToolCall[],
    onStream: StreamCallback,
    resolve: () => void,
  ) {
    if (hasToolCalls && toolCalls.length > 0) {
      // 添加助手消息（保存工具调用信息，以便显示）
      this.addMessage('assistant', assistantContent, undefined, toolCalls)
      {
        const sc = createStreamContent(
          assistantContent,
          StreamContentType.NORMAL,
          false,
          toolCalls,
        )
        sc.shouldPersistAssistantToolPlan = true
        onStream(sc)
      } // 传递 toolCalls 以便显示工具调用信息，并标记需持久化一次

      // 处理工具调用
      await this.handleToolCalls(toolCalls, onStream)
    } else {
      this.addMessage('assistant', assistantContent)
      onStream(
        createStreamContent(assistantContent, StreamContentType.NORMAL, true),
      )
    }
    resolve()
  }

  // 处理工具调用
  private async handleToolCalls(
    toolCalls: ToolCall[],
    onStream: StreamCallback,
  ) {
    try {
      // 执行所有工具调用
      const toolResults = await this.executeAllToolCalls(toolCalls, onStream)

      // 构建工具调用响应消息
      const toolResponses = buildToolCallResponse(toolCalls, toolResults)

      // 保存工具调用结果到聊天历史（使用原始数据）
      this.saveToolCallResults(toolResponses)

      // 发送工具调用结果给AI，获取最终回复
      await this.sendToolResultsToAI(toolResponses, onStream)
    } catch (error) {
      console.error('处理工具调用失败:', error)
      onStream(
        createStreamContent(
          '工具调用处理失败，请稍后重试。',
          StreamContentType.ERROR,
          true,
        ),
      )
    }
  }

  // 保存工具调用结果到聊天历史
  private saveToolCallResults(toolResponses: any[]) {
    toolResponses.forEach((response) => {
      if (response.originalData) {
        // 如果 originalData 是对象，需要转换为字符串
        let content = response.originalData
        if (typeof content === 'object' && content !== null) {
          if (content instanceof Error) {
            content = `错误: ${content.message}`
          } else if (typeof content === 'object' && 'render' in content) {
            // 如果是组件实例，使用 ComponentRenderer 渲染
            content = ComponentRenderer.render(content)
          } else {
            content = JSON.stringify(content, null, 2)
          }
        }
        this.addMessage('tool', content, response.tool_call_id)
      } else {
        // 如果没有原始数据，使用渲染后的内容
        this.addMessage('tool', response.content, response.tool_call_id)
      }
    })
  }

  // 执行所有工具调用
  private async executeAllToolCalls(
    toolCalls: ToolCall[],
    onStream: StreamCallback,
  ): Promise<(ToolCallResult | Error)[]> {
    const toolResults: (ToolCallResult | Error)[] = []
    const toolManager = ToolManager.getInstance()

    for (const call of toolCalls) {
      try {
        const args = JSON.parse(call.function.arguments) as Record<
          string,
          unknown
        >

        // 通知页面显示正在调用的工具，传递当前工具信息
        onStream(
          createStreamContent(
            '',
            StreamContentType.TOOL,
            false,
            undefined,
            call,
          ),
        )

        // 使用工具管理器执行工具
        const currentAgent = this.getCurrentAgent()
        const result = await toolManager.executeTool(call.function.name, args, onStream, currentAgent)
        toolResults.push(result)

        // 移除这里的addMessage调用，现在在saveToolCallResults中统一处理
        // this.addMessage('tool', result.data, call.id)

        onStream(
          createStreamContent(result.data, StreamContentType.TOOL, false),
        )
      } catch (error) {
        console.error(`工具调用 ${call.function.name} 失败:`, error)
        const errorObj =
          error instanceof Error ? error : new Error('工具调用失败')
        toolResults.push(errorObj)

        // 移除这里的addMessage调用，统一在saveToolCallResults中处理
        // this.addMessage('tool', `错误: ${errorObj.message}`, call.id)
        const errorMessage = formatToolCallErrorMessage(
          call.function.name,
          errorObj.message,
        )
        onStream(
          createStreamContent(errorMessage, StreamContentType.TOOL, false),
        ) // 清除当前工具显示
      }
    }
    return toolResults
  }

  // 发送工具调用结果给AI
  private async sendToolResultsToAI(
    toolResponses: ToolResponseMessage[],
    onStream: StreamCallback,
  ) {
    try {
      const config = this.buildRequestConfig({})
      const response = await this.sendHttpRequest(config)

      if (response.statusCode === 200 && response.data) {
        const aiResponse = response.data as AIResponse
        const message = aiResponse.choices?.[0]?.message

        // 检查是否有新的工具调用
        const { hasToolCalls, toolCalls } = processToolCalls(aiResponse)

        if (hasToolCalls && toolCalls && toolCalls.length > 0) {
          // 处理新的工具调用
          await this.handleToolCalls(toolCalls, onStream)
        } else {
          const assistantMessage =
            message?.content || '抱歉，我没有收到有效的回复。'
          this.addMessage('assistant', assistantMessage)

          // 模拟流式效果显示最终回复
          this.simulateStreamingEffect(assistantMessage, onStream)
        }
      } else {
        throw new Error(`API请求失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('发送工具结果给AI失败:', error)
      onStream(
        createStreamContent(
          '\n\n处理工具调用结果失败，请稍后重试。',
          StreamContentType.ERROR,
          true,
        ),
      )
    }
  }

  // 模拟流式效果
  private simulateStreamingEffect(
    content: RenderNode,
    onStream: StreamCallback,
  ) {
    // 确保 content 是字符串类型
    if (typeof content !== 'string') {
      console.warn(
        'simulateStreamingEffect: content 不是字符串类型，跳过流式效果',
      )
      onStream(createStreamContent(content, StreamContentType.NORMAL, true))
      return
    }

    if (this.isCancelled) {
      return
    }

    let currentContent = ''
    const characters = content.split('')
    let index = 0

    const streamInterval = setInterval(() => {
      if (this.isCancelled) {
        clearInterval(streamInterval)
        return
      }
      if (index < characters.length) {
        currentContent += characters[index]
        onStream(
          createStreamContent(currentContent, StreamContentType.NORMAL, false),
        )
        index++
      } else {
        clearInterval(streamInterval)
        onStream(
          createStreamContent(currentContent, StreamContentType.NORMAL, true),
        )
      }
    }, 30)

    // 记录interval，取消时清除
    // 在小程序环境下 setInterval 返回 number
    this.streamingIntervalId = streamInterval as unknown as number
  }

  // 回退到非流式模式
  private async fallbackToNonStream(
    _userMessage: string,
    onStream: StreamCallback,
    resolve: () => void,
    reject: (error: unknown) => void,
  ) {
    if (this.isCancelled) {
      resolve()
      return
    }
    try {
      const config = this.buildRequestConfig({})
      const response = await this.sendHttpRequest(config)

      if (response.statusCode === 200 && response.data) {
        const aiResponse = response.data as AIResponse
        const message = aiResponse.choices?.[0]?.message

        // 检查是否有工具调用
        const { hasToolCalls, toolCalls } = processToolCalls(aiResponse)

        if (hasToolCalls && toolCalls && toolCalls.length > 0) {
          // 添加助手消息（保存工具调用信息，以便显示）
          this.addMessage(
            'assistant',
            message?.content || '',
            undefined,
            toolCalls,
          )
          {
            const sc = createStreamContent(
              message?.content || '',
              StreamContentType.NORMAL,
              false,
              toolCalls,
            )
            sc.shouldPersistAssistantToolPlan = true
            onStream(sc)
          } // 传递 toolCalls 以便显示工具调用信息，并标记需持久化一次

          // 处理工具调用
          if (!this.isCancelled) {
            await this.handleToolCalls(toolCalls, onStream)
          } else {
            resolve()
            return
          }
        } else {
          const fullResponse =
            message?.content || '抱歉，我没有收到有效的回复。'
          this.addMessage('assistant', fullResponse)

          // 模拟流式效果
          if (!this.isCancelled) {
            this.simulateStreamingEffect(fullResponse, onStream)
          }
          resolve()
        }
      } else {
        throw new Error(`API请求失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('非流式模式也失败:', error)
      if (!this.isCancelled) {
        onStream(
          createStreamContent(
            '抱歉，服务暂时不可用，请稍后重试。',
            StreamContentType.ERROR,
            true,
          ),
        )
      }
      reject(error)
    }
  }

  // 发送消息到AI服务（非流式模式，作为后备方案）
  async sendMessageNonStream(userMessage: string): Promise<RenderNode> {
    // 检查AI配置是否有效
    if (!this.isActiveConfigValid()) {
      const errorMessage =
        '❌ AI配置无效或未选择，请先选择一个有效的AI配置\n\n💡 点击输入框左侧的AI配置按钮'
      this.addMessage('assistant', errorMessage)
      return errorMessage
    }

    // 添加用户消息到历史
    this.addMessage('user', userMessage)

    try {
      const aiConfig = this.getActiveAIConfig()

      const config = this.buildRequestConfig({})

      const response = await this.sendHttpRequest(config)

      if (response.statusCode === 200 && response.data) {
        const aiResponse = response.data as AIResponse
        const message = aiResponse.choices?.[0]?.message

        // 检查是否有工具调用
        const { hasToolCalls, toolCalls } = processToolCalls(aiResponse)

        if (hasToolCalls && toolCalls && toolCalls.length > 0) {
          // 添加助手消息（包含工具调用）
          this.addMessage(
            'assistant',
            message?.content || '',
            undefined,
            toolCalls,
          )

          // 处理工具调用（非流式模式）
          await this.handleToolCallsNonStream(toolCalls)

          // 重新发送请求获取最终回复
          return this.sendMessageNonStream('')
        } else {
          const assistantMessage =
            message?.content || '抱歉，我没有收到有效的回复。'
          this.addMessage('assistant', assistantMessage)
          return assistantMessage
        }
      } else {
        console.error('API响应错误:', response)
        throw new Error(
          `API请求失败: ${response.statusCode} - ${
            (response.data as AIResponse)?.choices?.[0]?.message?.content ||
            '未知错误'
          }`,
        )
      }
    } catch (error: unknown) {
      console.error('AI服务请求失败:', error)

      // 如果是网络错误，提供更友好的提示
      const errorMessage = this.getErrorMessage(error)

      this.addMessage('assistant', errorMessage)
      return errorMessage
    }
  }

  // 处理工具调用（非流式模式）
  private async handleToolCallsNonStream(toolCalls: ToolCall[]) {
    try {
      const toolManager = ToolManager.getInstance()

      // 执行所有工具调用
      for (const call of toolCalls) {
        try {
          const args = JSON.parse(call.function.arguments) as Record<
            string,
            unknown
          >

          // 使用工具管理器执行工具
          const currentAgent = this.getCurrentAgent()
          const result = await toolManager.executeTool(call.function.name, args, undefined, currentAgent)

          // 直接保存原始数据，不进行渲染
          this.addMessage('tool', result.data, call.id)
        } catch (error) {
          console.error(`工具调用 ${call.function.name} 失败:`, error)
          const errorMessage =
            error instanceof Error ? error.message : '工具调用失败'
          this.addMessage('tool', `错误: ${errorMessage}`, call.id)
        }
      }
    } catch (error) {
      console.error('处理工具调用失败（非流式）:', error)
      throw error
    }
  }

  // 发送消息到AI服务（保持向后兼容）
  async sendMessage(userMessage: string): Promise<RenderNode> {
    return this.sendMessageNonStream(userMessage)
  }

  // 获取消息历史（不包括系统消息） - 向后兼容
  getMessageHistory(): RenderMessage[] {
    return this.renderMessages
  }

  // 取消当前请求
  cancelCurrentRequest() {
    this.isCancelled = true
    if (this.streamingIntervalId !== null) {
      clearInterval(this.streamingIntervalId as unknown as number)
      this.streamingIntervalId = null
    }
    if (this.currentRequestTask) {
      this.currentRequestTask.abort()
      this.currentRequestTask = null
    }
  }
}
