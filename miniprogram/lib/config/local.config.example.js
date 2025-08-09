// 本地配置文件示例
// 1. 复制此文件为 local.config.js
// 2. 选择您使用的AI服务并填入相应配置
// 3. local.config.js 文件会被 git 忽略，确保密钥安全

module.exports = {
  // === AI服务配置 ===
  AI_API_KEY: 'your-ai-api-key-here',
  AI_MODEL: 'anthropic/claude-3.5-sonnet',
  AI_HOST: 'https://openrouter.ai/api/v1',
  AI_PROVIDER: 'openrouter', // 可选：服务提供商标识
  
  // 环境设置
  NODE_ENV: 'development'
}
