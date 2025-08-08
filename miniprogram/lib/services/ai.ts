import { API_CONFIG } from '../config/api'

// 消息类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  towxmlNodes?: any  // 存储 towxml 解析后的节点
}

// 流式响应回调类型
export type StreamCallback = (content: string, isComplete: boolean) => void

// AI服务类
export class AIService {
  private static instance: AIService
  private messages: Message[] = []
  private currentRequestTask: any = null

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // 添加消息到历史记录
  addMessage(role: 'user' | 'assistant', content: string) {
    this.messages.push({ role, content })
  }

  // 获取所有消息（包括系统消息）
  getMessages(): Message[] {
    return [
      { role: 'system', content: '你是一个有用的AI助手，请用简洁友好的方式回答用户的问题。' },
      ...this.messages
    ]
  }

  // 清空消息历史
  clearMessages() {
    this.messages = []
  }

  // 发送消息到AI服务（流式模式）
  async sendMessageStream(userMessage: string, onStream: StreamCallback): Promise<void> {
    // 添加用户消息到历史
    this.addMessage('user', userMessage)

    try {
      console.log('发送流式请求到:', `${API_CONFIG.OPENROUTER.HOST}/chat/completions`)
      
      // 取消之前的请求
      if (this.currentRequestTask) {
        this.currentRequestTask.abort()
      }

      return new Promise((resolve, reject) => {
        // 使用 wx.request 发送流式请求
        this.currentRequestTask = wx.request({
          url: `${API_CONFIG.OPENROUTER.HOST}/chat/completions`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.OPENROUTER.API_KEY}`,
            'Accept': 'text/event-stream'
          },
          data: {
            model: API_CONFIG.OPENROUTER.MODEL,
            messages: this.getMessages(),
            stream: true
          },
          success: (response: any) => {
            console.log('流式请求成功:', response)
            this.handleStreamResponse(response, onStream, resolve, reject)
          },
          fail: (error: any) => {
            console.error('流式请求失败:', error)
            // 如果流式请求失败，回退到非流式模式
            this.fallbackToNonStream(userMessage, onStream, resolve, reject)
          }
        })
      })

    } catch (error: any) {
      console.error('AI服务流式请求失败:', error)
      let errorMessage = '抱歉，服务暂时不可用，请稍后重试。'
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        errorMessage = '网络连接失败，请检查网络设置后重试。'
      }
      onStream(errorMessage, true)
    }
  }

  // 处理流式响应
  private handleStreamResponse(response: any, onStream: StreamCallback, resolve: Function, reject: Function) {
    if (response.statusCode === 200) {
      try {
        // 解析 SSE 格式的数据
        const data = response.data
        if (typeof data === 'string') {
          const lines = data.split('\n')
          let assistantContent = ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6)
              if (jsonData === '[DONE]') {
                // 流式响应结束
                this.addMessage('assistant', assistantContent)
                onStream(assistantContent, true)
                resolve()
                return
              }
              
              try {
                const parsed = JSON.parse(jsonData)
                const delta = parsed.choices[0]?.delta?.content
                if (delta) {
                  assistantContent += delta
                  onStream(assistantContent, false)
                }
              } catch (e) {
                console.warn('解析流式数据失败:', e)
              }
            }
          }
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

  // 回退到非流式模式
  private async fallbackToNonStream(userMessage: string, onStream: StreamCallback, resolve: Function, reject: Function) {
    try {
      console.log('回退到非流式模式')
      
      // 注意：这里不需要再次添加用户消息，因为在 sendMessageStream 开始时已经添加了
      // 我们直接发送请求获取响应
      const response = await new Promise((resolveRequest, rejectRequest) => {
        wx.request({
          url: `${API_CONFIG.OPENROUTER.HOST}/chat/completions`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.OPENROUTER.API_KEY}`
          },
          data: {
            model: API_CONFIG.OPENROUTER.MODEL,
            messages: this.getMessages(),
            stream: false
          },
          success: resolveRequest,
          fail: rejectRequest
        })
      }) as any

      if (response.statusCode === 200 && response.data) {
        const fullResponse = response.data.choices[0]?.message?.content || '抱歉，我没有收到有效的回复。'
        this.addMessage('assistant', fullResponse)
        
        // 模拟流式效果
        let currentContent = ''
        const characters = fullResponse.split('')
        let index = 0
        
        const streamInterval = setInterval(() => {
          if (index < characters.length) {
            currentContent += characters[index]
            onStream(currentContent, false)
            index++
          } else {
            clearInterval(streamInterval)
            onStream(currentContent, true)
            resolve()
          }
        }, 30) // 每30ms输出一个字符
      } else {
        throw new Error(`API请求失败: ${response.statusCode}`)
      }
    } catch (error) {
      console.error('非流式模式也失败:', error)
      onStream('抱歉，服务暂时不可用，请稍后重试。', true)
      reject(error)
    }
  }

  // 发送消息到AI服务（非流式模式，作为后备方案）
  async sendMessageNonStream(userMessage: string): Promise<string> {
    // 添加用户消息到历史
    this.addMessage('user', userMessage)

    try {
      console.log('发送请求到:', `${API_CONFIG.OPENROUTER.HOST}/chat/completions`)
      console.log('请求数据:', {
        model: API_CONFIG.OPENROUTER.MODEL,
        messages: this.getMessages(),
        stream: false
      })

      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_CONFIG.OPENROUTER.HOST}/chat/completions`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.OPENROUTER.API_KEY}`
          },
          data: {
            model: API_CONFIG.OPENROUTER.MODEL,
            messages: this.getMessages(),
            stream: false
          },
          success: resolve,
          fail: reject
        })
      }) as any

      console.log('API响应:', response)

      if (response.statusCode === 200 && response.data) {
        const assistantMessage = response.data.choices[0]?.message?.content || '抱歉，我没有收到有效的回复。'
        this.addMessage('assistant', assistantMessage)
        return assistantMessage
      } else {
        console.error('API响应错误:', response)
        throw new Error(`API请求失败: ${response.statusCode} - ${response.data?.error?.message || '未知错误'}`)
      }
    } catch (error: any) {
      console.error('AI服务请求失败:', error)
      
      // 如果是网络错误，提供更友好的提示
      let errorMessage = '抱歉，服务暂时不可用，请稍后重试。'
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        errorMessage = '网络连接失败，请检查网络设置后重试。'
      }
      
      this.addMessage('assistant', errorMessage)
      return errorMessage
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
