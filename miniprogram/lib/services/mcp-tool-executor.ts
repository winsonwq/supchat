// MCP 工具执行服务
import { MCPConfig } from '../types/mcp-config'
import { MCPConfigStorage } from '../storage/mcp-config-storage'
import { MCPToolLogger } from './mcp-tool-logger'
import { post } from './request'

// MCP JSON-RPC 请求接口
export interface MCPRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: Record<string, unknown>
}

// MCP JSON-RPC 响应接口
export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

// MCP 工具调用参数
export interface MCPToolCallParams {
  name: string
  arguments: Record<string, unknown>
}

// MCP 工具调用结果
export interface MCPToolCallResult {
  content: Array<{
    type: string
    text?: string
    image_url?: {
      url: string
    }
  }>
}

/**
 * MCP 工具执行服务
 * 负责执行来自 MCP Server 的工具调用
 */
export class MCPToolExecutor {
  private static instance: MCPToolExecutor
  private requestIdCounter = 1

  static getInstance(): MCPToolExecutor {
    if (!MCPToolExecutor.instance) {
      MCPToolExecutor.instance = new MCPToolExecutor()
    }
    return MCPToolExecutor.instance
  }

  /**
   * 执行 MCP 工具调用
   */
  async executeTool(
    toolName: string,
    arguments_: Record<string, unknown>
  ): Promise<{ data: string }> {
    // 查找工具对应的 MCP 配置
    const config = this.findToolConfig(toolName)
    if (!config) {
      throw new Error(`未找到工具 ${toolName} 对应的 MCP 配置`)
    }

    // 检查配置是否启用且在线
    if (!config.isEnabled || !config.isOnline) {
      throw new Error(`MCP 服务器 ${config.name} 未启用或不在线`)
    }

    // 开始记录日志
    const logger = MCPToolLogger.getInstance()
    const logId = logger.logToolCallStart(toolName, config, arguments_)

    try {
      // 构建 MCP 请求
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: this.getNextRequestId(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        }
      }

      console.log(`执行 MCP 工具 ${toolName}:`, {
        server: config.name,
        url: config.url,
        request
      })

      // 发送请求到 MCP 服务器
      const response = await this.sendMCPRequest(config, request)
      
      // 处理响应
      if (response.error) {
        const errorMessage = `MCP 工具调用失败: ${response.error.message}`
        logger.logToolCallError(logId, errorMessage)
        throw new Error(errorMessage)
      }

      const result = response.result as MCPToolCallResult
      console.log(`MCP 工具 ${toolName} 执行成功:`, result)

      // 格式化结果
      const formattedResult = this.formatToolResult(result)
      
      // 记录成功日志
      logger.logToolCallSuccess(logId, result)
      
      return {
        data: formattedResult
      }
    } catch (error) {
      console.error(`执行 MCP 工具 ${toolName} 失败:`, error)
      
      // 记录错误日志
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      logger.logToolCallError(logId, errorMessage)
      
      throw error
    }
  }

  /**
   * 查找工具对应的 MCP 配置
   */
  private findToolConfig(toolName: string): MCPConfig | null {
    const configs = MCPConfigStorage.getAllConfigs()
    
    for (const config of configs) {
      if (config.isEnabled && config.isOnline && config.tools) {
        const tool = config.tools.find(t => t.name === toolName && t.isEnabled !== false)
        if (tool) {
          return config
        }
      }
    }
    
    return null
  }

  /**
   * 发送 MCP 请求
   */
  private async sendMCPRequest(
    config: MCPConfig,
    request: MCPRequest
  ): Promise<MCPResponse> {
    const url = config.url
    
    // 验证 URL 格式
    if (!url || !url.startsWith('http')) {
      throw new Error(`无效的 MCP 服务器 URL: ${url}`)
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // 添加认证信息
    this.addAuthHeaders(headers, config)

    try {
      console.log(`发送 MCP 请求到 ${url}:`, request)
      
      const response = await post(url, request, {
        header: headers,
        timeout: 10000 // 10 秒超时
      })

      console.log(`MCP 响应:`, response.data)
      return response.data as MCPResponse
      
    } catch (error: any) {
      console.error(`MCP 请求失败 (${url}):`, error)
      
      // 提供更友好的错误信息
      if (error.errMsg?.includes('timeout')) {
        throw new Error(`请求超时，请检查服务器地址 ${url} 是否正确`)
      } else if (error.errMsg?.includes('fail')) {
        throw new Error(`网络请求失败，请检查网络连接和服务器地址 ${url}`)
      } else if (error.statusCode) {
        throw new Error(`HTTP ${error.statusCode}: ${error.errMsg || '请求失败'}`)
      } else {
        throw new Error(error.errMsg || '未知错误')
      }
    }
  }

  /**
   * 添加认证头
   */
  private addAuthHeaders(headers: Record<string, string>, config: MCPConfig): void {
    const { authType, authConfig } = config

    switch (authType) {
      case 'bearer_token':
        if (authConfig?.token) {
          headers['Authorization'] = `Bearer ${authConfig.token}`
        }
        break
        
      case 'api_key':
        if (authConfig?.apiKey) {
          headers['X-API-Key'] = authConfig.apiKey
        }
        break
        
      case 'basic_auth':
        if (authConfig?.username && authConfig?.password) {
          const credentials = this.base64Encode(`${authConfig.username}:${authConfig.password}`)
          headers['Authorization'] = `Basic ${credentials}`
        }
        break
    }
  }

  /**
   * Base64 编码（微信小程序兼容）
   */
  private base64Encode(str: string): string {
    try {
      const encoder = new Uint8Array(str.length)
      for (let i = 0; i < str.length; i++) {
        encoder[i] = str.charCodeAt(i)
      }
      return wx.arrayBufferToBase64(encoder.buffer)
    } catch (error) {
      console.warn('Base64 编码失败，跳过 Basic Auth:', error)
      return str
    }
  }

  /**
   * 格式化工具执行结果
   */
  private formatToolResult(result: MCPToolCallResult): string {
    if (!result.content || !Array.isArray(result.content)) {
      return JSON.stringify(result, null, 2)
    }

    // 提取文本内容
    const textParts: string[] = []
    
    for (const item of result.content) {
      if (item.type === 'text' && item.text) {
        textParts.push(item.text)
      } else if (item.type === 'image_url' && item.image_url?.url) {
        textParts.push(`[图片: ${item.image_url.url}]`)
      }
    }

    if (textParts.length > 0) {
      return textParts.join('\n')
    }

    // 如果没有文本内容，返回原始 JSON
    return JSON.stringify(result, null, 2)
  }

  /**
   * 获取下一个请求 ID
   */
  private getNextRequestId(): number {
    return this.requestIdCounter++
  }

  /**
   * 检查是否为 MCP 工具
   */
  static isMCPTool(toolName: string): boolean {
    const configs = MCPConfigStorage.getAllConfigs()
    
    for (const config of configs) {
      if (config.isEnabled && config.isOnline && config.tools) {
        const tool = config.tools.find(t => t.name === toolName && t.isEnabled !== false)
        if (tool) {
          return true
        }
      }
    }
    
    return false
  }

  /**
   * 获取所有可用的 MCP 工具名称
   */
  static getAvailableMCPToolNames(): string[] {
    const configs = MCPConfigStorage.getAllConfigs()
    const toolNames: string[] = []
    
    for (const config of configs) {
      if (config.isEnabled && config.isOnline && config.tools) {
        const enabledTools = config.tools.filter(t => t.isEnabled !== false)
        toolNames.push(...enabledTools.map(t => t.name))
      }
    }
    
    return toolNames
  }
}
