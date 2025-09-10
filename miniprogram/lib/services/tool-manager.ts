// 工具管理器
import { allTools, transformToOpenRouterTool } from '../mcp/index.js'
import { MCPToolsService } from './mcp-tools.js'
import { OpenRouterTool } from '../mcp/types.js'
import { ToolCallResult } from '../mcp/types.js'
import { executeToolCall } from '../mcp/utils.js'
import { ToolConfirmManager } from './tool-confirm-manager.js'

/**
 * 工具管理器
 * 统一管理本地工具和 MCP 工具
 */
export class ToolManager {
  private static instance: ToolManager

  static getInstance(): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager()
    }
    return ToolManager.instance
  }

  /**
   * 获取所有可用的工具（本地工具 + MCP 工具）
   */
  getAllTools(): OpenRouterTool[] {
    const localTools = allTools.map(transformToOpenRouterTool)
    const mcpTools = MCPToolsService.getAllOpenRouterMCPTools()
    
    console.log(`工具管理器: 本地工具 ${localTools.length} 个, MCP 工具 ${mcpTools.length} 个`)
    
    return [...localTools, ...mcpTools]
  }

  /**
   * 执行工具调用
   */
  async executeTool(
    toolName: string,
    arguments_: Record<string, unknown>,
    onStreamCallback?: (content: any) => void
  ): Promise<ToolCallResult> {
    console.log(`工具管理器: 执行工具 ${toolName}`)
    
    // 检查是否为 MCP 工具
    if (MCPToolsService.isMCPTool(toolName)) {
      console.log(`工具管理器: 执行 MCP 工具 ${toolName}`)
      
      // 检查 MCP 工具是否需要用户确认
      const mcpTool = MCPToolsService.findMCPToolByName(toolName)
      if (mcpTool && mcpTool.needConfirm !== false) {
        console.log(`MCP 工具 ${toolName} 需要用户确认`)
        const confirmManager = ToolConfirmManager.getInstance()
        const confirmed = await confirmManager.createConfirmRequest(
          toolName,
          { function: { name: toolName, arguments: JSON.stringify(arguments_) } },
          arguments_,
          onStreamCallback
        )
        if (!confirmed) {
          console.log(`用户取消了 MCP 工具 ${toolName} 的执行`)
          throw new Error('用户取消了操作')
        }
      }
      
      return await MCPToolsService.executeMCPTool(toolName, arguments_)
    } else {
      console.log(`工具管理器: 执行本地工具 ${toolName}`)
      return await executeToolCall(toolName, arguments_, allTools)
    }
  }


  /**
   * 检查工具是否存在
   */
  hasTool(toolName: string): boolean {
    // 检查本地工具
    const localToolExists = allTools.some(tool => tool.name === toolName)
    if (localToolExists) {
      return true
    }
    
    // 检查 MCP 工具
    return MCPToolsService.isMCPTool(toolName)
  }

  /**
   * 获取工具信息
   */
  getToolInfo(toolName: string): { type: 'local' | 'mcp'; name: string } | null {
    // 检查本地工具
    const localTool = allTools.find(tool => tool.name === toolName)
    if (localTool) {
      return {
        type: 'local',
        name: localTool.name
      }
    }
    
    // 检查 MCP 工具
    const mcpTool = MCPToolsService.findMCPToolByName(toolName)
    if (mcpTool) {
      return {
        type: 'mcp',
        name: mcpTool.name
      }
    }
    
    return null
  }

  /**
   * 获取所有工具名称
   */
  getAllToolNames(): string[] {
    const localToolNames = allTools.map(tool => tool.name)
    const mcpToolNames = MCPToolsService.getAvailableMCPToolNames()
    
    return [...localToolNames, ...mcpToolNames]
  }

  /**
   * 获取工具统计信息
   */
  getToolStats(): {
    total: number
    local: number
    mcp: number
    enabled: number
  } {
    const localCount = allTools.length
    const mcpCount = MCPToolsService.getAvailableMCPToolNames().length
    const total = localCount + mcpCount
    
    return {
      total,
      local: localCount,
      mcp: mcpCount,
      enabled: total // 所有工具默认都是启用的
    }
  }
}
