// 导出所有工具
export { openPhotoTool } from './photo.js'
export { getWeatherTool } from './weather.js'
export type { ToolBaseConfig } from '../types.js'

// 所有可用工具列表
import { openPhotoTool } from './photo.js'
import { getWeatherTool } from './weather.js'
import { ToolBaseConfig } from '../types.js'

export const allTools: ToolBaseConfig[] = [
  openPhotoTool,
  getWeatherTool,
  // 在这里添加更多工具
]

// 根据名称获取工具
export function getToolByName(name: string): ToolBaseConfig | undefined {
  return allTools.find(tool => tool.name === name)
}

// 获取所有工具名称
export function getAllToolNames(): string[] {
  return allTools.map(tool => tool.name)
}
