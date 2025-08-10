// AI配置相关类型定义

export interface AIConfig {
  id: string
  name: string // 配置名称，如 "GPT-4o"、"Claude 3.5 Sonnet" 等
  apiKey: string
  apiHost: string
  model: string
  isActive: boolean // 是否为当前启用的配置
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}


