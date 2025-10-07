// 工具管理器
import { allTools } from '../mcp/index.js'
import { MCPToolsService } from './mcp-tools.js'
import { OpenRouterTool } from '../mcp/types.js'
import { ToolCallResult } from '../mcp/types.js'
import { executeToolCall } from '../mcp/utils.js'
import { ToolConfirmManager } from './tool-confirm-manager.js'
import { getBuiltinMCPConfig } from '../mcp/builtin-tools.js'

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
    
    return [...builtinOpenRouterTools, ...mcpTools]
  }

  /**
   * 获取指定 Agent 的工具列表
   */
  getAllToolsForAgent(agent: any): OpenRouterTool[] {
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
    
    // 获取 Agent 特定的 MCP 工具
    const agentMcpTools: OpenRouterTool[] = []
    if (agent && agent.mcpServers && Array.isArray(agent.mcpServers)) {
      agent.mcpServers.forEach((mcpServer: any) => {
        if (mcpServer.tools && Array.isArray(mcpServer.tools)) {
          mcpServer.tools.forEach((tool: any) => {
            if (tool.isEnabled !== false) {
              agentMcpTools.push({
                type: 'function' as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.inputSchema || {}
                }
              })
            }
          })
        }
      })
    }
    
    return [...builtinOpenRouterTools, ...agentMcpTools]
  }

  /**
   * 执行工具调用
   */
  async executeTool(
    toolName: string,
    arguments_: Record<string, unknown>,
    onStreamCallback?: (content: any) => void,
    agent?: any
  ): Promise<ToolCallResult> {
    // 检查是否为内置工具
    const builtinConfig = getBuiltinMCPConfig()
    const builtinTool = builtinConfig.tools?.find(tool => tool.name === toolName)
    
    if (builtinTool) {
      // 检查内置工具是否需要用户确认
      if (builtinTool.needConfirm !== false) {
        const confirmManager = ToolConfirmManager.getInstance()
        const confirmed = await confirmManager.createConfirmRequest(
          toolName,
          { function: { name: toolName, arguments: JSON.stringify(arguments_) } },
          arguments_,
          onStreamCallback
        )
        if (!confirmed) {
          throw new Error('用户取消了操作')
        }
      }
      
      // 执行内置工具
      return await executeToolCall(toolName, arguments_, allTools)
    }
    
    // 检查是否为 Agent 特定的 MCP 工具
    if (agent && agent.mcpServers && Array.isArray(agent.mcpServers)) {
      for (const mcpServer of agent.mcpServers) {
        if (mcpServer.tools && Array.isArray(mcpServer.tools)) {
          const agentTool = mcpServer.tools.find((tool: any) => tool.name === toolName && tool.isEnabled !== false)
          if (agentTool) {
            // 检查工具是否需要用户确认
            if (agentTool.needConfirm !== false) {
              const confirmManager = ToolConfirmManager.getInstance()
              const confirmed = await confirmManager.createConfirmRequest(
                toolName,
                { function: { name: toolName, arguments: JSON.stringify(arguments_) } },
                arguments_,
                onStreamCallback
              )
              if (!confirmed) {
                throw new Error('用户取消了操作')
              }
            }
            
            // 执行 Agent MCP 工具 - 这里需要根据实际的 MCP 工具执行逻辑来实现
            // 目前先返回一个模拟结果，实际项目中需要调用对应的 MCP 服务
            return {
              data: `Agent MCP 工具 ${toolName} 执行成功`
            }
          }
        }
      }
    }
    
    // 检查是否为全局 MCP 工具
    if (MCPToolsService.isMCPTool(toolName)) {
      // 检查 MCP 工具是否需要用户确认
      const mcpTool = MCPToolsService.findMCPToolByName(toolName)
      if (mcpTool && mcpTool.needConfirm !== false) {
        const confirmManager = ToolConfirmManager.getInstance()
        const confirmed = await confirmManager.createConfirmRequest(
          toolName,
          { function: { name: toolName, arguments: JSON.stringify(arguments_) } },
          arguments_,
          onStreamCallback
        )
        if (!confirmed) {
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
