// MCP 工具转换器
import { MCPTool } from '../types/mcp-config'
import { OpenRouterTool } from '../mcp/types'

/**
 * MCP 工具转换器
 * 负责将 MCP 工具转换为 OpenRouter 格式
 */
export class MCPToolTransformer {
  
  /**
   * 将 MCP 工具转换为 OpenRouter 格式
   */
  static transformToOpenRouter(tool: MCPTool): OpenRouterTool {
    // 构建参数模式
    const parameters = this.buildParameters(tool)
    
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: this.buildDescription(tool),
        parameters
      }
    }
  }

  /**
   * 构建工具描述
   */
  private static buildDescription(tool: MCPTool): string {
    let description = tool.description || ''
    
    // 如果有中文名称，添加到描述前面
    if (tool.chineseName) {
      description = `[${tool.chineseName}] ${description}`
    }
    
    // 添加 MCP 标识
    description = `[MCP] ${description}`
    
    return description
  }

  /**
   * 构建参数模式
   */
  private static buildParameters(tool: MCPTool): Record<string, unknown> {
    // 如果工具有预定义的输入模式，使用它
    if (tool.inputSchema && typeof tool.inputSchema === 'object') {
      return tool.inputSchema
    }
    
    // 否则使用默认模式
    return {
      type: 'object',
      properties: {
        // 这里可以根据工具名称添加一些通用的参数
        // 例如，对于文件操作工具，可以添加 path 参数
        ...this.getDefaultProperties(tool.name)
      },
      required: this.getDefaultRequired(tool.name)
    }
  }

  /**
   * 获取默认属性
   */
  private static getDefaultProperties(toolName: string): Record<string, unknown> {
    // 根据工具名称提供一些默认的参数模式
    const toolNameLower = toolName.toLowerCase()
    
    if (toolNameLower.includes('file') || toolNameLower.includes('directory')) {
      return {
        path: {
          type: 'string',
          description: '文件或目录路径'
        }
      }
    }
    
    if (toolNameLower.includes('search') || toolNameLower.includes('query')) {
      return {
        query: {
          type: 'string',
          description: '搜索查询'
        }
      }
    }
    
    if (toolNameLower.includes('weather')) {
      return {
        location: {
          type: 'string',
          description: '位置（城市名或坐标）'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: '温度单位'
        }
      }
    }
    
    // 通用参数
    return {
      input: {
        type: 'string',
        description: '输入参数'
      }
    }
  }

  /**
   * 获取默认必需参数
   */
  private static getDefaultRequired(toolName: string): string[] {
    const toolNameLower = toolName.toLowerCase()
    
    if (toolNameLower.includes('file') || toolNameLower.includes('directory')) {
      return ['path']
    }
    
    if (toolNameLower.includes('search') || toolNameLower.includes('query')) {
      return ['query']
    }
    
    if (toolNameLower.includes('weather')) {
      return ['location']
    }
    
    return ['input']
  }

  /**
   * 批量转换工具
   */
  static transformMultiple(tools: MCPTool[]): OpenRouterTool[] {
    return tools.map(tool => this.transformToOpenRouter(tool))
  }

  /**
   * 验证转换后的工具格式
   */
  static validateTransformedTool(tool: OpenRouterTool): boolean {
    if (!tool || typeof tool !== 'object') {
      return false
    }
    
    if (tool.type !== 'function') {
      return false
    }
    
    if (!tool.function || typeof tool.function !== 'object') {
      return false
    }
    
    if (!tool.function.name || typeof tool.function.name !== 'string') {
      return false
    }
    
    if (!tool.function.description || typeof tool.function.description !== 'string') {
      return false
    }
    
    if (!tool.function.parameters || typeof tool.function.parameters !== 'object') {
      return false
    }
    
    return true
  }
}
