// 环境变量读取工具
// 注意：微信小程序不支持 process.env，这里提供一个配置接口

import { AIConfigStorage } from '../storage/ai-config-storage'

export interface EnvConfig {
  AI_API_KEY: string
  AI_MODEL: string
  AI_HOST: string
  NODE_ENV: 'development' | 'production'
}

// 默认配置（用于开发环境和后备）
const defaultConfig: EnvConfig = {
  AI_API_KEY: '',
  AI_MODEL: 'anthropic/claude-3.5-sonnet',
  AI_HOST: 'https://openrouter.ai/api/v1',
  NODE_ENV: 'development'
}

// 尝试加载本地配置文件（后备方案）
let localConfig: Partial<EnvConfig> = {}

try {
  // 尝试导入本地配置文件（如果存在）
  // 这个文件应该被gitignore忽略
  localConfig = require('./local.config.js') || {}
} catch (error) {
  // 本地配置文件不存在，这是正常情况
  // 现在优先使用UI配置的AI设置
}

// 获取当前生效的配置
function getCurrentConfig(): EnvConfig {
  // 优先使用UI配置的激活AI设置
  const activeConfig = AIConfigStorage.getActiveConfig()
  
  if (activeConfig) {
    return {
      AI_API_KEY: activeConfig.apiKey,
      AI_MODEL: activeConfig.model,
      AI_HOST: activeConfig.apiHost,
      NODE_ENV: 'development'
    }
  }
  
  // 后备方案：使用本地配置文件或默认配置
  return {
    ...defaultConfig,
    ...localConfig
  }
}

// 导出动态配置
export const env: EnvConfig = getCurrentConfig()

// 刷新配置的方法（在AI设置变更后调用）
export function refreshEnvConfig(): EnvConfig {
  const newConfig = getCurrentConfig()
  Object.assign(env, newConfig)
  return env
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
