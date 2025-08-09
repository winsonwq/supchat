import { API_CONFIG, isConfigValid } from '../config/api.js'
import {
  transformToOpenRouterTool,
  executeToolCall,
  processToolCalls,
  buildToolCallResponse,
  allTools,
} from '../mcp/index.js'
import {
  formatToolCallMessage,
  formatToolCallErrorMessage,
  createNormalContent,
  createToolContent,
  createErrorContent,
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
  TowxmlNode,
  StreamContent,
  StreamContentType,
} from '../mcp/types.js'

// 消息类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  towxmlNodes?: TowxmlNode // 存储 towxml 解析后的节点
  tool_call_id?: string // 工具调用ID
  tool_calls?: ToolCall[] // 存储工具调用信息
}

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
  private messages: Message[] = []
  private currentRequestTask: WxRequestTask | null = null

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // 添加消息到历史记录
  addMessage(
    role: 'user' | 'assistant' | 'tool',
    content?: string,
    tool_call_id?: string,
    tool_calls?: ToolCall[],
  ) {
    this.messages.push({
      role,
      content: content || '',
      tool_call_id,
      tool_calls,
    })
  }

  // 获取所有消息（包括系统消息）
  getMessages(): Message[] {
    return [
      {
        role: 'system',
        content:
          '你是一个有用的AI助手，请用简洁友好的方式回答用户的问题。你可以使用可用的工具来帮助用户。当需要使用工具时，请直接调用相应的工具。',
      },
      ...this.messages,
    ]
  }

  // 清空消息历史
  clearMessages() {
    this.messages = []
  }

  // 构建请求配置
  private buildRequestConfig(
    data: Record<string, unknown>,
    isStream: boolean = false,
  ): RequestConfig {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_CONFIG.AI.API_KEY}`,
    }

    if (isStream) {
      headers.Accept = 'text/event-stream'
    }

    return {
      url: `${API_CONFIG.AI.HOST}/chat/completions`,
      method: 'POST',
      headers,
      data: {
        model: API_CONFIG.AI.MODEL,
        messages: this.getMessages(),
        tools: allTools.map(transformToOpenRouterTool),
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
    // 检查API配置是否有效
    if (!isConfigValid) {
      const errorMessage =
        '❌ API配置无效，请先配置API密钥\n\n💡 请查看控制台获取配置指南'
      this.addMessage('assistant', errorMessage)
      onStream(createErrorContent(errorMessage, true))
      return
    }

    // 添加用户消息到历史
    this.addMessage('user', userMessage)

    try {
      console.log('发送流式请求到:', `${API_CONFIG.AI.HOST}/chat/completions`)

      // 取消之前的请求
      this.cancelPreviousRequest()

      return new Promise((resolve, reject) => {
        const config = this.buildRequestConfig({}, true)

        // 使用 wx.request 发送流式请求
        this.currentRequestTask = wx.request({
          ...config,
          success: (response: HttpResponse) => {
            console.log('流式请求成功:', response)
            this.handleStreamResponse(response, onStream, resolve, reject)
          },
          fail: (error: unknown) => {
            console.error('流式请求失败:', error)
            // 如果流式请求失败，回退到非流式模式
            this.fallbackToNonStream(userMessage, onStream, resolve, reject)
          },
        })
      })
    } catch (error: unknown) {
      console.error('AI服务流式请求失败:', error)
      const errorMessage = this.getErrorMessage(error)
      onStream(createErrorContent(errorMessage, true))
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
    if (response.statusCode === 200) {
      try {
        const data = response.data
        if (typeof data === 'string') {
          await this.processStreamData(data, onStream, resolve)
        } else {
          // 如果不是字符串格式，回退到非流式模式
          this.fallbackToNonStream('', onStream, resolve, reject)
        }
      } catch (error) {
        console.error('处理流式响应失败:', error)
        this.fallbackToNonStream('', onStream, resolve, reject)
      }
    } else {
      console.error('API响应错误:', response)
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
    let assistantContent = ''
    let hasToolCalls = false
    let toolCalls: ToolCall[] = []

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonData = line.slice(6)
        if (jsonData === '[DONE]') {
          // 流式响应结束
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
            onStream(createNormalContent(assistantContent, false))
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
    assistantContent: string,
    hasToolCalls: boolean,
    toolCalls: ToolCall[],
    onStream: StreamCallback,
    resolve: () => void,
  ) {
    if (hasToolCalls && toolCalls.length > 0) {
      // 添加助手消息（保存工具调用信息，以便显示）
      this.addMessage('assistant', assistantContent, undefined, toolCalls)
      onStream(createNormalContent(assistantContent, false, toolCalls)) // 传递 toolCalls 以便显示工具调用信息

      // 处理工具调用
      await this.handleToolCalls(toolCalls, onStream)
    } else {
      this.addMessage('assistant', assistantContent)
      onStream(createNormalContent(assistantContent, true))
    }
    resolve()
  }

  // 处理工具调用
  private async handleToolCalls(
    toolCalls: ToolCall[],
    onStream: StreamCallback,
  ) {
    try {
      console.log('处理工具调用:', toolCalls)

      // 执行所有工具调用
      const toolResults = await this.executeAllToolCalls(toolCalls, onStream)

      // 构建工具调用响应消息
      const toolResponses = buildToolCallResponse(toolCalls, toolResults)

      // 发送工具调用结果给AI，获取最终回复
      await this.sendToolResultsToAI(toolResponses, onStream)
    } catch (error) {
      console.error('处理工具调用失败:', error)
      onStream(createErrorContent('工具调用处理失败，请稍后重试。', true))
    }
  }

  // 执行所有工具调用
  private async executeAllToolCalls(
    toolCalls: ToolCall[],
    onStream: StreamCallback,
  ): Promise<(ToolCallResult | Error)[]> {
    const toolResults: (ToolCallResult | Error)[] = []
    for (const call of toolCalls) {
      try {
        const args = JSON.parse(call.function.arguments) as Record<
          string,
          unknown
        >
        console.log(`执行工具 ${call.function.name}:`, args)

        // 通知页面显示正在调用的工具，传递当前工具信息
        onStream(
          createStreamContent(
            '',
            StreamContentType.NORMAL,
            false,
            undefined,
            call,
          ),
        )

        const result = await executeToolCall(call.function.name, args, allTools)
        toolResults.push(result)

        this.addMessage('tool', result.data, call.id)
        onStream(createToolContent(result.data || '', false)) // 清除当前工具显示，但保持 toolCalls 显示
      } catch (error) {
        console.error(`工具调用 ${call.function.name} 失败:`, error)
        const errorObj =
          error instanceof Error ? error : new Error('工具调用失败')
        toolResults.push(errorObj)

        this.addMessage('tool', `错误: ${errorObj.message}`, call.id)
        const errorMessage = formatToolCallErrorMessage(
          call.function.name,
          errorObj.message,
        )
        onStream(createToolContent(errorMessage, false)) // 清除当前工具显示
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
      console.log('发送工具结果给AI:', toolResponses)

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
        createErrorContent('\n\n处理工具调用结果失败，请稍后重试。', true),
      )
    }
  }

  // 模拟流式效果
  private simulateStreamingEffect(content: string, onStream: StreamCallback) {
    let currentContent = ''
    const characters = content.split('')
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < characters.length) {
        currentContent += characters[index]
        onStream(createNormalContent(currentContent, false))
        index++
      } else {
        clearInterval(streamInterval)
        onStream(createNormalContent(currentContent, true))
      }
    }, 30)
  }

  // 回退到非流式模式
  private async fallbackToNonStream(
    _userMessage: string,
    onStream: StreamCallback,
    resolve: () => void,
    reject: (error: unknown) => void,
  ) {
    try {
      console.log('回退到非流式模式')

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
          onStream(
            createNormalContent(message?.content || '', false, toolCalls),
          ) // 传递 toolCalls 以便显示工具调用信息

          // 处理工具调用
          await this.handleToolCalls(toolCalls, onStream)
        } else {
          const fullResponse =
            message?.content || '抱歉，我没有收到有效的回复。'
          this.addMessage('assistant', fullResponse)

          // 模拟流式效果
          this.simulateStreamingEffect(fullResponse, onStream)
          resolve()
        }
      } else {
        throw new Error(`API请求失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('非流式模式也失败:', error)
      onStream(createErrorContent('抱歉，服务暂时不可用，请稍后重试。', true))
      reject(error)
    }
  }

  // 发送消息到AI服务（非流式模式，作为后备方案）
  async sendMessageNonStream(userMessage: string): Promise<string> {
    // 检查API配置是否有效
    if (!isConfigValid) {
      const errorMessage =
        '❌ API配置无效，请先配置API密钥\n\n💡 请查看控制台获取配置指南'
      this.addMessage('assistant', errorMessage)
      return errorMessage
    }

    // 添加用户消息到历史
    this.addMessage('user', userMessage)

    try {
      console.log('发送请求到:', `${API_CONFIG.AI.HOST}/chat/completions`)

      const config = this.buildRequestConfig({})
      console.log('请求数据:', config.data)

      const response = await this.sendHttpRequest(config)

      console.log('API响应:', response)

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
      console.log('处理工具调用（非流式）:', toolCalls)

      // 执行所有工具调用
      for (const call of toolCalls) {
        try {
          const args = JSON.parse(call.function.arguments) as Record<
            string,
            unknown
          >
          console.log(`执行工具 ${call.function.name}:`, args)

          const result = await executeToolCall(
            call.function.name,
            args,
            allTools,
          )

          this.addMessage('tool', result.data as string, call.id)
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
  async sendMessage(userMessage: string): Promise<string> {
    return this.sendMessageNonStream(userMessage)
  }

  // 获取消息历史（不包括系统消息）
  getMessageHistory(): Message[] {
    return [...this.messages]
  }

  // 取消当前请求
  cancelCurrentRequest() {
    if (this.currentRequestTask) {
      this.currentRequestTask.abort()
      this.currentRequestTask = null
    }
  }
}
