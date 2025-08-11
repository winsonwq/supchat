// MCP 工具服务
import { MCPConfigStorage } from '../storage/mcp-config-storage'
import { MCPTool } from '../types/mcp-config'
import { OpenRouterTool } from '../mcp/types'
import { MCPServerService } from './mcp-server'

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
        // 只添加已启用的工具
        const enabledTools = config.tools.filter(tool => tool.isEnabled !== false)
        allTools.push(...enabledTools)
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
        description: tool.description,
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
    // 查找工具对应的配置
    const configs = MCPConfigStorage.getAllConfigs()
    let targetConfig = null
    let targetTool = null
    
    for (const config of configs) {
      if (config.isOnline && config.tools) {
        const tool = config.tools.find(t => t.name === toolName)
        if (tool && tool.isEnabled !== false) {
          targetConfig = config
          targetTool = tool
          break
        }
      }
    }
    
    if (!targetConfig || !targetTool) {
      throw new Error(`未找到可用的工具: ${toolName}`)
    }
    
    try {
      // 使用 MCP 服务器服务执行工具调用
      const result = await MCPServerService.callTool(targetConfig, toolName, args)
      
      return {
        data: JSON.stringify(result, null, 2)
      }
    } catch (error) {
      console.error(`执行 MCP 工具 ${toolName} 失败:`, error)
      throw error
    }
  }

  /**
   * 检查是否为 MCP 工具
   */
  static isMCPTool(toolName: string): boolean {
    return this.findMCPToolByName(toolName) !== null
  }
}
