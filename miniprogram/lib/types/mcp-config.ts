// MCP Server 配置相关类型定义

// 认证方式枚举
export enum AuthType {
  NONE = 'none',
  BEARER_TOKEN = 'bearer_token',
  BASIC_AUTH = 'basic_auth',
  API_KEY = 'api_key'
}

// 认证方式选项
export interface AuthTypeOption {
  value: AuthType
  label: string
}

// MCP Server 工具信息
export interface MCPTool {
  name: string
  description: string
  inputSchema?: Record<string, unknown>
  isEnabled?: boolean // 工具是否启用，默认为 true
}

// MCP Server 配置
export interface MCPConfig {
  id: string
  name: string // 配置名称
  url: string // MCP Server URL
  authType: AuthType // 认证方式
  authConfig: {
    token?: string // Bearer Token 或 API Key
    username?: string // Basic Auth 用户名
    password?: string // Basic Auth 密码
    apiKey?: string // API Key
  }
  isEnabled: boolean // 是否开启
  isOnline?: boolean // 在线状态
  tools?: MCPTool[] // 工具列表
  toolCount?: number // 工具数量
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}

// 认证方式选项列表
export const authTypeOptions: AuthTypeOption[] = [
  { value: AuthType.NONE, label: '无需认证' },
  { value: AuthType.BEARER_TOKEN, label: 'Bearer Token' },
  { value: AuthType.BASIC_AUTH, label: 'BasicAuth' },
  { value: AuthType.API_KEY, label: 'API Key' }
]
