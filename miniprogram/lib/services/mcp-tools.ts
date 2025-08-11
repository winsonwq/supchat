// MCP 工具服务
import { MCPConfigStorage } from '../storage/mcp-config-storage'
import { MCPTool } from '../types/mcp-config'
import { OpenRouterTool } from '../mcp/types'

/**
 * MCP 工具服务类
 */
export class MCPToolsService {
  
  /**
   * 获取所有已启用的 MCP 工具
   */
  static getAllEnabledMCPTools(): MCPTool[] {
    const enabledConfigs = MCPConfigStorage.getEnabledConfigs()
    const allTools: MCPTool[] = []
    
    enabledConfigs.forEach(config => {
      if (config.isOnline && config.tools) {
        allTools.push(...config.tools)
      }
    })
    
    return allTools
  }

  /**
   * 将 MCP 工具转换为 OpenRouter 格式
   */
  static transformMCPToolToOpenRouter(tool: MCPTool): OpenRouterTool {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.chineseName 
          ? `[${tool.chineseName}] ${tool.description}`
          : tool.description,
        parameters: tool.inputSchema || {
          type: 'object',
          properties: {},
          required: []
        }
      }
    }
  }

  /**
   * 获取所有 OpenRouter 格式的 MCP 工具
   */
  static getAllOpenRouterMCPTools(): OpenRouterTool[] {
    const mcpTools = this.getAllEnabledMCPTools()
    return mcpTools.map(tool => this.transformMCPToolToOpenRouter(tool))
  }

  /**
   * 根据名称查找 MCP 工具
   */
  static findMCPToolByName(toolName: string): MCPTool | null {
    const allTools = this.getAllEnabledMCPTools()
    return allTools.find(tool => tool.name === toolName) || null
  }

  /**
   * 执行 MCP 工具调用
   */
  static async executeMCPTool(
    toolName: string, 
    args: Record<string, unknown>
  ): Promise<{ data: string }> {
    // 这里应该实际调用对应的 MCP Server
    // 现在返回模拟数据
    console.log(`执行 MCP 工具: ${toolName}`, args)
    
    // 模拟异步调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 返回模拟结果
    return {
      data: `MCP 工具 ${toolName} 执行成功，参数：${JSON.stringify(args)}`
    }
  }

  /**
   * 检查是否为 MCP 工具
   */
  static isMCPTool(toolName: string): boolean {
    return this.findMCPToolByName(toolName) !== null
  }
}
