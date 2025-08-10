// AI配置相关类型定义

export interface AIConfig {
  id: string
  name: string // 配置名称，如 "GPT-4o"、"Claude 3.5 Sonnet" 等
  provider: string // 服务提供商，如 "openai"、"anthropic"、"openrouter" 等
  apiKey: string
  apiHost: string
  model: string
  isActive: boolean // 是否为当前启用的配置
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}

export interface AIProvider {
  id: string
  name: string
  defaultHost: string
  models: string[]
  description?: string
}

// 预定义的AI服务提供商
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultHost: 'https://openrouter.ai/api/v1',
    models: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-3.5-turbo',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct'
    ],
    description: '提供多种AI模型的统一接口服务'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultHost: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ],
    description: 'OpenAI 官方API服务'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    defaultHost: 'https://api.anthropic.com/v1',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229'
    ],
    description: 'Anthropic Claude 官方API服务'
  },
  {
    id: 'custom',
    name: '自定义',
    defaultHost: '',
    models: [],
    description: '自定义API服务，兼容OpenAI格式'
  }
]
