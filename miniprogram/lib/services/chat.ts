import { ChatSession } from '../types/chat-history'
import { RenderMessage } from '../types/message'
import { RenderNode, ToolCall } from '../mcp/types'
import storage from './storage'

export interface CreateChatOptions {
  title?: string
  firstMessage?: Omit<RenderMessage, 'id' | 'createdAt'>
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
  aiconfig?: {
    id: string
    name: string
    model: string
  }
  agent?: {
    name: string
  }
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

    // 部分后端返回的消息内字段使用 camelCase，这里做一次兼容映射
    type RawMessage = Partial<RenderMessage> & {
      toolCalls?: ToolCall[]
      toolCallId?: string
    }
    type RawChat = Omit<ChatSession, 'messages'> & {
      messages?: RawMessage[]
    }

    const chats = (result.data as RawChat[]).map((c) => {
      if (Array.isArray(c?.messages)) {
        c.messages = c.messages.map((m: RawMessage) => {
          const mapped: Record<string, unknown> = { ...m }
          if (mapped.tool_calls === undefined && mapped.toolCalls !== undefined) {
            mapped.tool_calls = mapped.toolCalls
          }
          if (mapped.tool_call_id === undefined && mapped.toolCallId !== undefined) {
            mapped.tool_call_id = mapped.toolCallId
          }
          return (mapped as unknown) as RenderMessage
        })
      }
      return c
    }) as ChatSession[]

    return chats
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
      const rawMessages = messagesResult.ok ? (messagesResult.data as any[]) : []

      // 统一字段：将后端 camelCase 字段映射到前端使用的下划线风格
      const messages: RenderMessage[] = rawMessages.map((m) => {
        const mapped: Record<string, unknown> = { ...m }
        if (mapped.tool_calls === undefined && mapped.toolCalls !== undefined) {
          mapped.tool_calls = mapped.toolCalls
        }
        if (mapped.tool_call_id === undefined && mapped.toolCallId !== undefined) {
          mapped.tool_call_id = mapped.toolCallId
        }
        return (mapped as unknown) as RenderMessage
      })

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
   * 分页获取聊天消息
   */
  async getChatMessages(
    chatId: string,
    options: {
      limit?: number
      cursor?: string
      order?: 'asc' | 'desc'
    } = {}
  ): Promise<{
    messages: RenderMessage[]
    hasMore: boolean
    nextCursor?: string
  }> {
    try {
      const { limit = 20, cursor, order = 'desc' } = options
      
      // 构建查询参数（兼容小程序环境，不使用 URLSearchParams）
      const queryEntries: Array<[string, string]> = [
        ['limit', String(limit)],
        ['order', order],
      ]
      if (cursor) {
        queryEntries.push(['cursor', cursor])
      }
      const queryString = queryEntries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')

      const result = await storage.get(`/chats/${chatId}/messages?${queryString}`)
      
      if (!result.ok) {
        throw new Error(result.error || '获取消息失败')
      }

      const rawMessages = result.data as any[]
      
      // 统一字段：将后端 camelCase 字段映射到前端使用的下划线风格
      const messages: RenderMessage[] = rawMessages.map((m) => {
        const mapped: Record<string, unknown> = { ...m }
        if (mapped.tool_calls === undefined && mapped.toolCalls !== undefined) {
          mapped.tool_calls = mapped.toolCalls
        }
        if (mapped.tool_call_id === undefined && mapped.toolCallId !== undefined) {
          mapped.tool_call_id = mapped.toolCallId
        }
        return (mapped as unknown) as RenderMessage
      })

      // 判断是否还有更多消息
      const hasMore = messages.length === limit
      const nextCursor = hasMore && messages.length > 0 
        ? messages[messages.length - 1].createdAt 
        : undefined

      return {
        messages,
        hasMore,
        nextCursor,
      }
    } catch (error) {
      console.error('分页获取消息失败:', error)
      throw error
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
  ): Promise<{ message: RenderMessage; chat: ChatSession }> {
    const { chatId, role, content, tool_calls, tool_call_id, aiconfig, agent } = options

    // 构建消息数据
    const messageData: {
      role: typeof role
      content: RenderNode
      toolCalls?: ToolCall[]
      toolCallId?: string
      aiconfig?: {
        id: string
        name: string
        model: string
      }
      agent?: {
        name: string
      }
    } = {
      role,
      content,
      ...(tool_calls && { toolCalls: tool_calls }),
      ...(tool_call_id && { toolCallId: tool_call_id }),
      ...(aiconfig && { aiconfig }),
      ...(agent && { agent }),
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
      message: result.data as RenderMessage,
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

  
}

export default ChatService.getInstance()
