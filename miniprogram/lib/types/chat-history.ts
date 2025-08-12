// 聊天历史相关类型定义

export interface ChatSession {
  id: string
  title: string // 会话标题，通常是第一条用户消息的摘要
  messages: ChatMessage[]
  createdAt: number // 创建时间戳
  updatedAt: number // 最后更新时间戳
  isActive: boolean // 是否为当前活跃会话
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
  timestamp: number // 消息时间戳
}

// 使用MCP的ToolCall类型，保持一致性
import { ToolCall } from '../mcp/types'

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
  addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): boolean
  
  // 获取当前活跃会话
  getActiveSession(): ChatSession | null
  
  // 设置活跃会话
  setActiveSession(sessionId: string): boolean
  
  // 清空所有聊天历史
  clearAllHistory(): boolean
  
  // 获取会话数量
  getSessionCount(): number
}
