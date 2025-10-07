// Agent 相关类型定义

import type { MCPConfig } from './mcp-config'

// Agent 定义接口
export interface AgentDefinition {
  id: string
  name: string
  description?: string
  
  systemPrompt: string
  
  // 直接复用系统里的 MCPConfig 结构
  mcpServers: MCPConfig[]
  
  // 元数据
  createdAt?: number
  updatedAt?: number
  isDefault?: boolean
  isEnabled?: boolean
}

// Agent 创建/更新时的输入类型
export interface AgentInput {
  name: string
  description?: string
  systemPrompt: string
  mcpServers: MCPConfig[]
}