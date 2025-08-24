// 导出所有工具
export { openPhotoTool } from './photo.js'
export { getWeatherTool } from './weather.js'
export { getLocationTool } from './location.js'
export { chooseFileTool } from './file.js'
export { getDeviceInfoTool } from './device.js'
export { getNetworkStatusTool } from './network.js'
export { scanCodeTool } from './scan.js'

export type { ToolBaseConfig } from '../types.js'

// 所有可用工具列表
import { openPhotoTool } from './photo.js'
import { getWeatherTool } from './weather.js'
import { getLocationTool } from './location.js'
import { chooseFileTool } from './file.js'
import { getDeviceInfoTool } from './device.js'
import { getNetworkStatusTool } from './network.js'
import { scanCodeTool } from './scan.js'

import { ToolBaseConfig } from '../types.js'

export const allTools: ToolBaseConfig[] = [
  openPhotoTool,
  getWeatherTool,
  getLocationTool,
  chooseFileTool,
  getDeviceInfoTool,
  getNetworkStatusTool,
  scanCodeTool,
]

// 根据名称获取工具
export function getToolByName(name: string): ToolBaseConfig | undefined {
  return allTools.find(tool => tool.name === name)
}

// 获取所有工具名称
export function getAllToolNames(): string[] {
  return allTools.map(tool => tool.name)
}
