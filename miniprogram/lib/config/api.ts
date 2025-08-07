// API配置文件
export const API_CONFIG = {
  OPENROUTER: {
    HOST: 'https://openrouter.ai/api/v1',
    API_KEY: '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',
    MODEL: 'google/gemini-2.5-flash-lite'
  }
}

export const SYSTEM_MESSAGE = {
  role: 'system',
  content: '你是一个有用的AI助手，请用简洁友好的方式回答用户的问题。'
}
