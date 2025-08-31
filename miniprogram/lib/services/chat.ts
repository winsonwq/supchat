import { ChatSession } from '../types/chat-history'
import { RenderMessage } from '../types/message'
import { callCloudFunction } from './cloud'

export interface CreateChatOptions {
  title?: string
  firstMessage?: Omit<RenderMessage, 'id' | 'timestamp'>
}

export interface UpdateChatOptions {
  title?: string
}

export interface AddMessageOptions {
  chatId: string
  role: 'user' | 'assistant'
  content: string
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
    const result = await callCloudFunction({
      route: '/chats',
      method: 'POST',
      body: {
        title: options.title || '新对话',
        firstMessage: options.firstMessage,
      },
    })

    if (!result.ok) {
      throw new Error(result.error || '创建聊天失败')
    }

    return result.data as ChatSession
  }

  /**
   * 获取所有聊天记录
   */
  async getChats(): Promise<ChatSession[]> {
    const result = await callCloudFunction({
      route: '/chats',
      method: 'GET',
    })

    if (!result.ok) {
      throw new Error(result.error || '获取聊天列表失败')
    }

    return result.data as ChatSession[]
  }

  /**
   * 根据ID获取聊天记录
   */
  async getChatById(chatId: string): Promise<ChatSession | null> {
    const result = await callCloudFunction({
      route: `/chats/${chatId}`,
      method: 'GET',
    })

    if (!result.ok) {
      if (result.error?.includes('not found')) {
        return null
      }
      throw new Error(result.error || '获取聊天记录失败')
    }

    return result.data as ChatSession
  }

  /**
   * 更新聊天记录
   */
  async updateChat(
    chatId: string,
    updates: UpdateChatOptions,
  ): Promise<ChatSession> {
    const result = await callCloudFunction({
      route: `/chats/${chatId}`,
      method: 'PUT',
      body: updates as Record<string, unknown>,
    })

    if (!result.ok) {
      throw new Error(result.error || '更新聊天失败')
    }

    return result.data as ChatSession
  }

  /**
   * 删除聊天记录
   */
  async deleteChat(chatId: string): Promise<boolean> {
    const result = await callCloudFunction({
      route: `/chats/${chatId}`,
      method: 'DELETE',
    })

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
    const { chatId, role, content } = options

    const result = await callCloudFunction({
      route: `/chats/${chatId}/messages`,
      method: 'POST',
      body: { role, content },
    })

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
    // 云函数会自动处理活跃状态，这里只需要设置当前聊天ID
    // 实际的活跃状态更新在云函数中处理
    return
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
}

export default ChatService.getInstance()
