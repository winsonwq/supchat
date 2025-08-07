import { API_CONFIG } from '../config/api'

// 消息类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// AI服务类
export class AIService {
  private static instance: AIService
  private messages: Message[] = []

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

  // 发送消息到AI服务
  async sendMessage(userMessage: string): Promise<string> {
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

  // 获取消息历史（不包括系统消息）
  getMessageHistory(): Message[] {
    return [...this.messages]
  }
}
