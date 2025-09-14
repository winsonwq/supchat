// 工具管理器
import { allTools, transformToOpenRouterTool } from '../mcp/index.js'
import { MCPToolsService } from './mcp-tools.js'
import { OpenRouterTool } from '../mcp/types.js'
import { ToolCallResult } from '../mcp/types.js'
import { executeToolCall } from '../mcp/utils.js'
import { ToolConfirmManager } from './tool-confirm-manager.js'
import { getBuiltinMCPConfig, isBuiltinMCP } from '../mcp/builtin-tools.js'
import { MCPConfigStorage } from '../storage/mcp-config-storage.js'

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
   * 获取所有可用的工具（内置工具 + MCP 工具）
   */
  getAllTools(): OpenRouterTool[] {
    // 获取内置工具（从内置 MCP 配置中获取启用的工具）
    const builtinConfig = getBuiltinMCPConfig()
    const enabledBuiltinTools = builtinConfig.tools?.filter(tool => tool.isEnabled !== false) || []
    const builtinOpenRouterTools = enabledBuiltinTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema || {}
      }
    }))
    
    // 获取 MCP 工具
    const mcpTools = MCPToolsService.getAllOpenRouterMCPTools()
    
    console.log(`工具管理器: 内置工具 ${builtinOpenRouterTools.length} 个, MCP 工具 ${mcpTools.length} 个`)
    
    return [...builtinOpenRouterTools, ...mcpTools]
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
    
    // 检查是否为内置工具
    const builtinConfig = getBuiltinMCPConfig()
    const builtinTool = builtinConfig.tools?.find(tool => tool.name === toolName)
    
    if (builtinTool) {
      console.log(`工具管理器: 执行内置工具 ${toolName}`)
      
      // 检查内置工具是否需要用户确认
      if (builtinTool.needConfirm !== false) {
        console.log(`内置工具 ${toolName} 需要用户确认`)
        const confirmManager = ToolConfirmManager.getInstance()
        const confirmed = await confirmManager.createConfirmRequest(
          toolName,
          { function: { name: toolName, arguments: JSON.stringify(arguments_) } },
          arguments_,
          onStreamCallback
        )
        if (!confirmed) {
          console.log(`用户取消了内置工具 ${toolName} 的执行`)
          throw new Error('用户取消了操作')
        }
      }
      
      // 执行内置工具
      return await executeToolCall(toolName, arguments_, allTools)
    }
    
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
    }
    
    // 如果都不是，抛出错误
    throw new Error(`工具 ${toolName} 不存在`)
  }


  /**
   * 检查工具是否存在
   */
  hasTool(toolName: string): boolean {
    // 检查内置工具
    const builtinConfig = getBuiltinMCPConfig()
    const builtinToolExists = builtinConfig.tools?.some(tool => tool.name === toolName && tool.isEnabled !== false)
    if (builtinToolExists) {
      return true
    }
    
    // 检查 MCP 工具
    return MCPToolsService.isMCPTool(toolName)
  }

  /**
   * 获取工具信息
   */
  getToolInfo(toolName: string): { type: 'builtin' | 'mcp'; name: string } | null {
    // 检查内置工具
    const builtinConfig = getBuiltinMCPConfig()
    const builtinTool = builtinConfig.tools?.find(tool => tool.name === toolName && tool.isEnabled !== false)
    if (builtinTool) {
      return {
        type: 'builtin',
        name: builtinTool.name
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
