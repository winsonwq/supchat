// 聊天历史相关类型定义

// 使用新的消息类型定义
import { RenderMessage } from './message'

export interface ChatSession {
  id: string
  _id?: string // 云函数返回的原始ID
  userId: string // 用户ID
  title: string // 会话标题，通常是第一条用户消息的摘要
  isDeleted?: boolean // 是否已删除
  lastMessageAt?: Date | string // 最后消息时间
  messageCount?: number // 消息数量
  lastMessagePreview?: string // 最后消息预览
  messagesRecent?: Array<{ role: string; content: string; createdAt: Date | string }> // 最近消息预览
  createdAt: Date | string | number // 创建时间
  updatedAt: Date | string | number // 最后更新时间
  isActive?: boolean // 是否为当前活跃会话
}

/**
 * @deprecated 使用 RenderMessage 替代
 * 为了向后兼容保留的旧消息类型
 */
export interface ChatMessage extends RenderMessage {
  // 保持向后兼容
}

export interface ChatHistoryStorage {
  // 获取所有聊天会话
  getAllSessions(): ChatSession[]
  
  // 根据ID获取聊天会话
  getSessionById(sessionId: string): ChatSession | null
  
  // 创建新的聊天会话
  createSession(title?: string): ChatSession
  
  // 更新聊天会话
  updateSession(sessionId: string, updates: Partial<ChatSession>): boolean
  
  // 删除聊天会话
  deleteSession(sessionId: string): boolean
  
  // 添加消息到会话
  addMessage(sessionId: string, message: Omit<RenderMessage, 'id' | 'timestamp'>): boolean
  
  // 获取当前活跃会话
  getActiveSession(): ChatSession | null
  
  // 设置活跃会话
  setActiveSession(sessionId: string): boolean
  
  // 清空所有聊天历史
  clearAllHistory(): boolean
  
  // 获取会话数量
  getSessionCount(): number
}
