import { ChatSession } from '../types/chat-history'
import { RenderMessage } from '../types/message'
import { RenderNode, ToolCall } from '../mcp/types'
import storage from './storage'

export interface CreateChatOptions {
  title?: string
  firstMessage?: Omit<RenderMessage, 'id' | 'timestamp'>
}

export interface UpdateChatOptions {
  title?: string
  isActive?: boolean
}

export interface AddMessageOptions {
  chatId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: RenderNode
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ChatWithMessages extends ChatSession {
  messages: RenderMessage[]
}

export class ChatService {
  private static instance: ChatService

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService()
    }
    return ChatService.instance
  }

  /**
   * 创建新的聊天
   */
  async createChat(options: CreateChatOptions = {}): Promise<ChatSession> {
    const result = await storage.create('/chats', {
      title: options.title || '新对话',
      firstMessage: options.firstMessage,
    })

    if (!result.ok) {
      throw new Error(result.error || '创建聊天失败')
    }

    return result.data as unknown as ChatSession
  }

  /**
   * 获取所有聊天记录
   */
  async getChats(): Promise<ChatSession[]> {
    const result = await storage.get('/chats')

    if (!result.ok) {
      throw new Error(result.error || '获取聊天列表失败')
    }

    return result.data as ChatSession[]
  }

  /**
   * 根据ID获取聊天记录
   */
  async getChatById(chatId: string): Promise<ChatSession | null> {
    const result = await storage.get(`/chats/${chatId}`)

    if (!result.ok) {
      if (result.error?.includes('not found')) {
        return null
      }
      throw new Error(result.error || '获取聊天记录失败')
    }

    return result.data as ChatSession
  }

  /**
   * 获取聊天及其消息（用于切换聊天显示）
   */
  async getChatWithMessages(chatId: string): Promise<ChatWithMessages | null> {
    try {
      // 获取聊天基本信息
      const chat = await this.getChatById(chatId)
      if (!chat) {
        return null
      }

      // 获取聊天消息
      const messagesResult = await storage.get(`/chats/${chatId}/messages`)
      const messages = messagesResult.ok ? (messagesResult.data as RenderMessage[]) : []

      return {
        ...chat,
        messages,
      }
    } catch (error) {
      console.error('获取聊天及消息失败:', error)
      return null
    }
  }

  /**
   * 切换聊天（获取聊天数据和消息，用于显示）
   * 这个方法只获取数据，不更新数据库状态
   */
  async switchToChat(chatId: string): Promise<ChatWithMessages | null> {
    return await this.getChatWithMessages(chatId)
  }

  /**
   * 更新聊天记录
   */
  async updateChat(
    chatId: string,
    updates: UpdateChatOptions,
  ): Promise<ChatSession> {
    const result = await storage.update(`/chats/${chatId}`, updates)

    if (!result.ok) {
      throw new Error(result.error || '更新聊天失败')
    }

    return result.data as ChatSession
  }

  /**
   * 删除聊天记录
   */
  async deleteChat(chatId: string): Promise<boolean> {
    const result = await storage.delete(`/chats/${chatId}`)

    if (!result.ok) {
      throw new Error(result.error || '删除聊天失败')
    }

    return result.data as boolean
  }

  /**
   * 添加消息到聊天
   */
  async addMessage(
    options: AddMessageOptions,
  ): Promise<{ message: any; chat: ChatSession }> {
    const { chatId, role, content, tool_calls, tool_call_id } = options

    // 构建消息数据
    const messageData: any = { 
      role, 
      content,
      ...(tool_calls && { toolCalls: tool_calls }),
      ...(tool_call_id && { toolCallId: tool_call_id })
    }

    const result = await storage.create(`/chats/${chatId}/messages`, messageData)

    if (!result.ok) {
      throw new Error(result.error || '发送消息失败')
    }

    // 获取更新后的聊天记录
    const chat = await this.getChatById(chatId)
    if (!chat) {
      throw new Error('聊天记录不存在')
    }

    return {
      message: result.data,
      chat,
    }
  }

  /**
   * 设置当前活跃聊天
   */
  async setActiveChat(chatId: string): Promise<void> {
    // 先取消所有聊天的活跃状态
    const chats = await this.getChats()
    const updatePromises = chats
      .filter(chat => chat.isActive)
      .map(chat => this.updateChat(chat.id, { isActive: false }))
    
    await Promise.all(updatePromises)

    // 设置指定聊天为活跃状态
    await this.updateChat(chatId, { isActive: true })
  }

  /**
   * 获取当前活跃聊天
   */
  async getActiveChat(): Promise<ChatSession | null> {
    const chats = await this.getChats()
    return chats.find((chat) => chat.isActive) || null
  }

  /**
   * 清空所有聊天历史
   */
  async clearAllChats(): Promise<boolean> {
    const chats = await this.getChats()

    const deletePromises = chats.map((chat) => this.deleteChat(chat.id))
    await Promise.all(deletePromises)

    return true
  }

  /**
   * 获取聊天数量
   */
  async getChatCount(): Promise<number> {
    const chats = await this.getChats()
    return chats.length
  }

  /**
   * 测试云函数连接
   */
  async testCloudConnection(): Promise<boolean> {
    try {
      // 尝试获取聊天列表来测试云函数连接
      await this.getChats()
      return true
    } catch (error) {
      console.error('云函数连接测试失败:', error)
      return false
    }
  }

  /**
   * 测试新的 addMessage 功能
   */
  async testAddMessageWithComplexContent(): Promise<boolean> {
    try {
      // 创建一个测试聊天
      const chat = await this.createChat({ title: '测试复杂内容' })
      
      // 测试添加包含 tool_calls 的消息
      const result = await this.addMessage({
        chatId: chat.id,
        role: 'assistant',
        content: '这是一个测试消息',
        tool_calls: [
          {
            id: 'test_tool_1',
            type: 'function',
            function: {
              name: 'test_function',
              arguments: '{"param": "value"}'
            }
          }
        ]
      })

      // 测试添加 tool 角色的消息
      const toolResult = await this.addMessage({
        chatId: chat.id,
        role: 'tool',
        content: '工具执行结果: [1, 2, 3]',
        tool_call_id: 'test_tool_1'
      })

      console.log('测试成功:', { result, toolResult })
      return true
    } catch (error) {
      console.error('测试失败:', error)
      return false
    }
  }
}

export default ChatService.getInstance()
