#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 SupChat 配置向导')
console.log('==================')

const configPath = path.join(__dirname, 'miniprogram/lib/config/local.config.js')
const examplePath = path.join(__dirname, 'miniprogram/lib/config/local.config.example.js')

// 检查示例文件是否存在
if (!fs.existsSync(examplePath)) {
  console.error('❌ 示例配置文件不存在:', examplePath)
  process.exit(1)
}

// 检查配置文件是否已存在
if (fs.existsSync(configPath)) {
  console.log('✅ 配置文件已存在:', configPath)
  console.log('💡 如需重新配置，请删除该文件后重新运行此脚本')
  process.exit(0)
}

try {
  // 复制示例文件
  fs.copyFileSync(examplePath, configPath)
  console.log('✅ 已创建配置文件:', configPath)
  console.log('')
  console.log('📝 下一步：')
  console.log('1. 选择您要使用的AI服务（OpenRouter、OpenAI、Anthropic等）')
  console.log('2. 获取相应的API密钥')
  console.log('3. 编辑', configPath)
  console.log('4. 配置 AI_API_KEY、AI_HOST、AI_MODEL 等参数')
  console.log('5. 保存文件并重启微信开发者工具')
  console.log('')
  console.log('💡 支持的AI服务：')
  console.log('  - OpenRouter: https://openrouter.ai/ (推荐，支持多种模型)')
  console.log('  - OpenAI: https://platform.openai.com/')
  console.log('  - Anthropic: https://console.anthropic.com/')
  console.log('  - 任何兼容OpenAI API格式的服务')
  console.log('')
  console.log('🔒 安全提醒：local.config.js 文件已被git忽略，不会被提交到仓库')
} catch (error) {
  console.error('❌ 创建配置文件失败:', error.message)
  process.exit(1)
}
