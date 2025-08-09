// 环境变量读取工具
// 注意：微信小程序不支持 process.env，这里提供一个配置接口

export interface EnvConfig {
  AI_API_KEY: string
  AI_MODEL: string
  AI_HOST: string
  AI_PROVIDER?: string // 可选：标识AI服务提供商（如：openrouter, openai, claude等）
  NODE_ENV: 'development' | 'production'
}

// 默认配置（用于开发环境）
const defaultConfig: EnvConfig = {
  AI_API_KEY: '',
  AI_MODEL: 'anthropic/claude-3.5-sonnet',
  AI_HOST: 'https://openrouter.ai/api/v1',
  AI_PROVIDER: 'openrouter',
  NODE_ENV: 'development'
}

// 尝试加载本地配置文件
let localConfig: Partial<EnvConfig> = {}

try {
  // 尝试导入本地配置文件（如果存在）
  // 这个文件应该被gitignore忽略
  localConfig = require('./local.config.js') || {}
} catch (error) {
  console.warn('未找到本地配置文件，使用默认配置')
  console.warn('请复制 local.config.example.js 为 local.config.js 并配置API密钥')
}

// 合并配置
export const env: EnvConfig = {
  ...defaultConfig,
  ...localConfig
}

// 验证必要的配置项
export function validateConfig(): { isValid: boolean; message?: string } {
  if (!env.AI_API_KEY) {
    return {
      isValid: false,
      message: '❌ 未找到 AI_API_KEY\n\n📝 请按以下步骤配置：\n1. 复制配置文件：cp miniprogram/lib/config/local.config.example.js miniprogram/lib/config/local.config.js\n2. 编辑 local.config.js 文件\n3. 配置您的AI服务信息\n\n💡 支持的服务：OpenRouter、OpenAI、Anthropic等兼容OpenAI API格式的服务'
    }
  }
  
  if (env.AI_API_KEY === 'your-ai-api-key-here') {
    return {
      isValid: false,
      message: '❌ 请将 AI_API_KEY 替换为真实的API密钥\n\n📝 配置步骤：\n1. 选择AI服务提供商\n2. 获取API密钥\n3. 在 local.config.js 中配置\n\n当前值: your-ai-api-key-here'
    }
  }
  
  if (!env.AI_HOST) {
    return {
      isValid: false,
      message: '❌ 未配置 AI_HOST\n\n请在配置文件中设置AI服务的API地址'
    }
  }
  
  return { isValid: true }
}

// 获取当前是否为开发环境
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

// 获取当前是否为生产环境
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}
