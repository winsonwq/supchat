// 聊天历史存储服务
import {
  ChatSession,
  ChatMessage,
  ChatHistoryStorage,
} from '../types/chat-history'
import { RenderNode } from '../mcp/types'
import { BaseComponent } from '../mcp/components/base-component.js'

// 确保组件已注册
import '../mcp/components/component-registry.js'

const STORAGE_KEY = 'chat_history'
const ACTIVE_SESSION_KEY = 'active_session_id'

export class LocalChatHistoryStorage implements ChatHistoryStorage {
  private static instance: LocalChatHistoryStorage

  static getInstance(): LocalChatHistoryStorage {
    if (!LocalChatHistoryStorage.instance) {
      LocalChatHistoryStorage.instance = new LocalChatHistoryStorage()
    }
    return LocalChatHistoryStorage.instance
  }

  /**
   * 获取所有聊天会话
   */
  getAllSessions(): ChatSession[] {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      if (!data) return []

      const sessions = JSON.parse(data) as ChatSession[]
      // 反序列化所有会话的消息内容
      const deserializedSessions = sessions.map((session) => ({
        ...session,
        messages: session.messages.map((message) => ({
          ...message,
          content: this.deserializeContent(message.content),
        })),
      }))

      // 按最后更新时间排序，最新的在前面
      return deserializedSessions.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('获取聊天历史失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取聊天会话
   */
  getSessionById(sessionId: string): ChatSession | null {
    const sessions = this.getAllSessions()
    const session = sessions.find((session) => session.id === sessionId) || null

    if (session) {
      // 反序列化所有消息内容
      session.messages = session.messages.map((message) => ({
        ...message,
        content: this.deserializeContent(message.content),
      }))
    }

    return session
  }

  /**
   * 创建新的聊天会话
   */
  createSession(title?: string): ChatSession {
    const now = Date.now()
    const sessionId = this.generateSessionId()

    const newSession: ChatSession = {
      id: sessionId,
      title: title || '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    }

    // 将其他会话设置为非活跃
    this.deactivateOtherSessions()

    // 保存新会话
    this.saveSessions([...this.getAllSessions(), newSession])

    // 设置新会话为活跃会话
    this.setActiveSessionId(sessionId)

    return newSession
  }

  /**
   * 更新聊天会话
   */
  updateSession(sessionId: string, updates: Partial<ChatSession>): boolean {
    try {
      const sessions = this.getAllSessions()
      const sessionIndex = sessions.findIndex(
        (session) => session.id === sessionId,
      )

      if (sessionIndex === -1) {
        return false
      }

      // 更新会话
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...updates,
        updatedAt: Date.now(),
      }

      this.saveSessions(sessions)
      return true
    } catch (error) {
      console.error('更新会话失败:', error)
      return false
    }
  }

  /**
   * 删除聊天会话
   */
  deleteSession(sessionId: string): boolean {
    try {
      const sessions = this.getAllSessions()
      const filteredSessions = sessions.filter(
        (session) => session.id !== sessionId,
      )

      if (filteredSessions.length === sessions.length) {
        return false // 会话不存在
      }

      // 如果删除的是当前活跃会话，需要设置新的活跃会话
      const activeSessionId = this.getActiveSessionId()
      if (activeSessionId === sessionId) {
        const newActiveSession = filteredSessions[0]
        if (newActiveSession) {
          this.setActiveSessionId(newActiveSession.id)
          newActiveSession.isActive = true
        }
      }

      this.saveSessions(filteredSessions)
      return true
    } catch (error) {
      console.error('删除会话失败:', error)
      return false
    }
  }

  /**
   * 添加消息到会话
   */
  addMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ): boolean {
    try {
      const sessions = this.getAllSessions()
      const sessionIndex = sessions.findIndex(
        (session) => session.id === sessionId,
      )

      if (sessionIndex === -1) {
        return false
      }

      // 序列化消息内容，处理组件实例
      const serializedContent = this.serializeContent(message.content)

      const newMessage: ChatMessage = {
        ...message,
        content: serializedContent,
        id: this.generateMessageId(),
        timestamp: Date.now(),
      }

      // 添加消息到会话
      sessions[sessionIndex].messages.push(newMessage)
      sessions[sessionIndex].updatedAt = Date.now()

      // 如果是第一条用户消息，自动生成标题
      if (
        message.role === 'user' &&
        sessions[sessionIndex].messages.length === 1
      ) {
        sessions[sessionIndex].title = this.generateTitle(message.content)
      }

      this.saveSessions(sessions)
      return true
    } catch (error) {
      console.error('添加消息失败:', error)
      return false
    }
  }

  /**
   * 获取当前活跃会话
   */
  getActiveSession(): ChatSession | null {
    const activeSessionId = this.getActiveSessionId()
    if (!activeSessionId) {
      return null
    }
    return this.getSessionById(activeSessionId)
  }

  /**
   * 设置活跃会话
   */
  setActiveSession(sessionId: string): boolean {
    try {
      const sessions = this.getAllSessions()
      const sessionIndex = sessions.findIndex(
        (session) => session.id === sessionId,
      )

      if (sessionIndex === -1) {
        return false
      }

      // 将其他会话设置为非活跃
      this.deactivateOtherSessions()

      // 设置指定会话为活跃
      sessions[sessionIndex].isActive = true
      sessions[sessionIndex].updatedAt = Date.now()

      this.saveSessions(sessions)
      this.setActiveSessionId(sessionId)

      return true
    } catch (error) {
      console.error('设置活跃会话失败:', error)
      return false
    }
  }

  /**
   * 清空所有聊天历史
   */
  clearAllHistory(): boolean {
    try {
      wx.removeStorageSync(STORAGE_KEY)
      wx.removeStorageSync(ACTIVE_SESSION_KEY)
      return true
    } catch (error) {
      console.error('清空聊天历史失败:', error)
      return false
    }
  }

  /**
   * 获取会话数量
   */
  getSessionCount(): number {
    return this.getAllSessions().length
  }

  /**
   * 保存所有会话到存储
   */
  private saveSessions(sessions: ChatSession[]): void {
    try {
      wx.setStorageSync(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('保存聊天历史失败:', error)
    }
  }

  /**
   * 获取活跃会话ID
   */
  private getActiveSessionId(): string | null {
    try {
      return wx.getStorageSync(ACTIVE_SESSION_KEY) || null
    } catch (error) {
      console.error('获取活跃会话ID失败:', error)
      return null
    }
  }

  /**
   * 设置活跃会话ID
   */
  private setActiveSessionId(sessionId: string): void {
    try {
      wx.setStorageSync(ACTIVE_SESSION_KEY, sessionId)
    } catch (error) {
      console.error('设置活跃会话ID失败:', error)
    }
  }

  /**
   * 将其他会话设置为非活跃
   */
  private deactivateOtherSessions(): void {
    const sessions = this.getAllSessions()
    const updatedSessions = sessions.map((session) => ({
      ...session,
      isActive: false,
    }))
    this.saveSessions(updatedSessions)
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 根据消息内容生成标题
   */
  private generateTitle(content: RenderNode): string {
    // 确保 content 是字符串类型
    if (typeof content !== 'string') {
      return '新对话'
    }

    // 取前20个字符作为标题，如果超过20个字符则截断并添加省略号
    const maxLength = 20
    if (content.length <= maxLength) {
      return content
    }
    return content.substring(0, maxLength) + '...'
  }

  /**
   * 序列化消息内容，将组件实例转换为可存储的格式
   */
  private serializeContent(content: RenderNode): any {
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      return content.map((item) => this.serializeContent(item))
    }

    if (
      typeof content === 'object' &&
      content !== null &&
      'renderForMiniProgram' in content
    ) {
      // 优先使用微信小程序友好的格式
      return (content as any).renderForMiniProgram()
    }

    if (
      typeof content === 'object' &&
      content !== null &&
      'serialize' in content
    ) {
      return (content as any).serialize()
    }

    // 如果是其他类型的对象，尝试转换为字符串
    return JSON.stringify(content)
  }

  /**
   * 反序列化消息内容，将存储的格式转换为可渲染的格式
   */
  private deserializeContent(content: any): RenderNode {
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      const deserializedArray = content.map((item) =>
        this.deserializeContent(item),
      )
      // 确保数组中的每个元素都是正确的类型
      return deserializedArray as RenderNode
    }

    if (
      typeof content === 'object' &&
      content !== null &&
      content.componentType // 统一使用 componentType 字段
    ) {
      // 使用 componentType 字段
      const componentType = content.componentType

      // 使用BaseComponent的通用反序列化方法
      try {
        console.log('=== 开始反序列化组件 ===')
        console.log('组件数据:', content)
        console.log('组件类型:', componentType)

        const result = BaseComponent.deserialize(content)
        console.log('✅ 反序列化成功:', result)
        return result
      } catch (error) {
        console.error('❌ 反序列化失败:', error)

        // 如果反序列化失败，返回HTML字符串作为降级方案
        return content.html || JSON.stringify(content)
      }
    }

    return content
  }
}
