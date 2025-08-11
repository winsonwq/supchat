// MCP 工具服务
import { MCPConfigStorage } from '../storage/mcp-config-storage'
import { MCPTool } from '../types/mcp-config'
import { OpenRouterTool } from '../mcp/types'
import { MCPToolExecutor } from './mcp-tool-executor'
import { MCPToolTransformer } from './mcp-tool-transformer'

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
    return MCPToolTransformer.transformToOpenRouter(tool)
  }

  /**
   * 获取所有 OpenRouter 格式的 MCP 工具
   */
  static getAllOpenRouterMCPTools(): OpenRouterTool[] {
    const mcpTools = this.getAllEnabledMCPTools()
    return MCPToolTransformer.transformMultiple(mcpTools)
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
    try {
      // 使用新的 MCP 工具执行器
      const executor = MCPToolExecutor.getInstance()
      return await executor.executeTool(toolName, args)
    } catch (error) {
      console.error(`执行 MCP 工具 ${toolName} 失败:`, error)
      throw error
    }
  }

  /**
   * 检查是否为 MCP 工具
   */
  static isMCPTool(toolName: string): boolean {
    return MCPToolExecutor.isMCPTool(toolName)
  }

  /**
   * 获取所有可用的 MCP 工具名称
   */
  static getAvailableMCPToolNames(): string[] {
    return MCPToolExecutor.getAvailableMCPToolNames()
  }

  /**
   * 验证 MCP 工具配置
   */
  static validateMCPTool(tool: MCPTool): { isValid: boolean; message?: string } {
    if (!tool.name?.trim()) {
      return { isValid: false, message: '工具名称不能为空' }
    }
    
    if (!tool.description?.trim()) {
      return { isValid: false, message: '工具描述不能为空' }
    }
    
    return { isValid: true }
  }

  /**
   * 获取 MCP 工具统计信息
   */
  static getMCPToolStats(): {
    total: number
    enabled: number
    disabled: number
    byServer: Record<string, number>
  } {
    const configs = MCPConfigStorage.getAllConfigs()
    let total = 0
    let enabled = 0
    let disabled = 0
    const byServer: Record<string, number> = {}
    
    configs.forEach(config => {
      if (config.tools) {
        const serverToolCount = config.tools.length
        total += serverToolCount
        byServer[config.name] = serverToolCount
        
        config.tools.forEach(tool => {
          if (tool.isEnabled !== false) {
            enabled++
          } else {
            disabled++
          }
        })
      }
    })
    
    return {
      total,
      enabled,
      disabled,
      byServer
    }
  }
}
