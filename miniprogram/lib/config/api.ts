// API配置文件
import { env, validateConfig, isDevelopment } from './env.js'

// 验证配置
const validation = validateConfig()
if (!validation.isValid) {
  if (isDevelopment()) {
    // 开发环境显示友好提示
    console.warn('⚠️ API配置需要设置：')
    console.warn(validation.message)
    
    // 显示微信小程序的模态框提示
    if (typeof wx !== 'undefined') {
      wx.showModal({
        title: 'API配置需要设置',
        content: validation.message?.replace(/\n/g, ' ') || '请配置API密钥',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  } else {
    throw new Error(`API配置验证失败：${validation.message}`)
  }
}

export const API_CONFIG = {
  AI: {
    HOST: env.AI_HOST,
    API_KEY: env.AI_API_KEY,
    MODEL: env.AI_MODEL
  }
}

// 导出配置验证状态，供其他模块检查
export const isConfigValid = validation.isValid
