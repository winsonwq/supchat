// MCP Tools 使用示例

import { AIService } from '../services/ai.js'
import { allTools, transformToOpenRouterTool } from './index.js'

// 示例1：基本使用
export async function exampleBasicUsage() {
  const aiService = AIService.getInstance()
  
  // 发送消息，AI会自动选择合适的工具
  const response = await aiService.sendMessage('帮我查询北京的天气')
  console.log('AI回复:', response)
}

// 示例2：流式模式使用
export function exampleStreamUsage() {
  const aiService = AIService.getInstance()
  
  aiService.sendMessageStream('帮我打开相册选择一张照片', (content, isComplete) => {
    console.log('流式内容:', content)
    if (isComplete) {
      console.log('流式响应完成')
    }
  })
}

// 示例3：查看所有可用工具
export function exampleListTools() {
  console.log('所有可用工具:')
  allTools.forEach(tool => {
    console.log(`- ${tool.chineseName || tool.name}: ${tool.description}`)
  })
  
  // 转换为OpenRouter格式
  const openRouterTools = allTools.map(transformToOpenRouterTool)
  console.log('OpenRouter格式工具:', openRouterTools)
}

// 示例4：手动调用工具
export async function exampleManualToolCall() {
  const { executeToolCall } = await import('./utils.js')
  
  // 手动调用天气查询工具
  const result = await executeToolCall('getWeather', {
    city: '上海',
    date: '2024-01-15'
  }, allTools)
  
  console.log('工具调用结果:', result)
}

// 示例5：工具调用确认
export async function exampleToolWithConfirmation() {
  const { executeToolCall } = await import('./utils.js')
  
  // 调用需要确认的工具（如打开照片）
  const result = await executeToolCall('openPhoto', {
    sourceType: 'album',
    count: 1
  }, allTools)
  
  console.log('照片选择结果:', result)
}
