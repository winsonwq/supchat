// 内置 MCP 工具配置
import { MCPConfig, AuthType } from '../types/mcp-config'
import { MCPTool } from '../services/mcp-server'
import { allTools } from './tools/index'
import { MCPConfigStorage } from '../storage/mcp-config-storage'

// 内置 MCP 配置 ID
export const BUILTIN_MCP_ID = 'builtin-mcp-tools'

// 内置 MCP 配置
export const builtinMCPConfig: MCPConfig = {
  id: BUILTIN_MCP_ID,
  name: '小程序生态工具包',
  url: 'builtin://tools',
  authType: AuthType.NONE,
  authConfig: {},
  isEnabled: true,
  isOnline: true, // 内置工具始终在线
  tools: [],
  toolCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isBuiltin: true // 标记为内置配置
}

// 将现有工具转换为 MCPTool 格式
export function convertToolsToMCPTools(): MCPTool[] {
  // 获取存储的工具状态
  const toolStates = MCPConfigStorage.getBuiltinToolStates()
  
  return allTools.map(tool => {
    const toolState = toolStates[tool.name]
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      isEnabled: toolState?.isEnabled !== undefined ? toolState.isEnabled : true, // 从存储读取或默认启用
      needConfirm: toolState?.needConfirm !== undefined ? toolState.needConfirm : (tool.needUserConfirm || false),
      chineseName: tool.chineseName || tool.name,
      annotations: tool.annotations || {}
    }
  })
}

// 获取内置 MCP 配置（包含工具）
export function getBuiltinMCPConfig(): MCPConfig {
  const tools = convertToolsToMCPTools()
  
  // 从存储中读取全局启用状态
  const globalEnabled = MCPConfigStorage.getBuiltinGlobalEnabled()
  
  return {
    ...builtinMCPConfig,
    tools,
    toolCount: tools.length,
    // 确保内置配置始终在线
    isOnline: true,
    // 从存储读取全局启用状态，默认为启用
    isEnabled: globalEnabled
  }
}

// 检查是否为内置 MCP 配置
export function isBuiltinMCP(configId: string): boolean {
  return configId === BUILTIN_MCP_ID
}

// 检查是否为内置 MCP 配置（通过配置对象）
export function isBuiltinMCPConfig(config: MCPConfig): boolean {
  return config.id === BUILTIN_MCP_ID || config.isBuiltin === true
}

// 更新内置工具状态
export function updateBuiltinToolState(toolName: string, isEnabled: boolean, needConfirm: boolean): boolean {
  return MCPConfigStorage.updateBuiltinToolState(toolName, isEnabled, needConfirm)
}
