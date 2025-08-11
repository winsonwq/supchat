// MCP 服务器通信服务
import { MCPConfig } from '../types/mcp-config'
import { post } from './http'

export interface MCPTool {
  name: string
  description: string
  chineseName?: string
  inputSchema?: any
  isEnabled?: boolean
}

export interface MCPInitializeResponse {
  jsonrpc: string
  id: number
  result?: {
    protocolVersion: string
    capabilities: {
      tools: {
        listChanged: boolean
      }
    }
    serverInfo: {
      name: string
      version: string
    }
  }
  error?: {
    code: number
    message: string
  }
}

export interface MCPToolsListResponse {
  jsonrpc: string
  id: number
  result?: {
    tools: MCPTool[]
  }
  error?: {
    code: number
    message: string
  }
}

export class MCPServerService {
  
  /**
   * 检查 MCP 服务器在线状态
   */
  static async checkServerOnline(config: MCPConfig): Promise<boolean> {
    try {
      console.log(`检查 MCP 服务器在线状态: ${config.url}`)
      const response = await this.makeMCPRequest(config, 'initialize', {})
      const isOnline = !response.error
      console.log(`MCP 服务器 ${config.url} 在线状态: ${isOnline}`)
      return isOnline
    } catch (error) {
      console.error(`检查 MCP 服务器 ${config.url} 在线状态失败:`, error)
      return false
    }
  }

  /**
   * 获取 MCP 服务器工具列表
   */
  static async getServerTools(config: MCPConfig): Promise<MCPTool[]> {
    try {
      console.log(`获取 MCP 服务器工具列表: ${config.url}`)
      const response = await this.makeMCPRequest(config, 'tools/list', {})
      if (response.error) {
        console.error(`获取工具列表失败: ${config.url}`, response.error)
        return []
      }
      // 类型断言确保 response 是 MCPToolsListResponse
      const toolsResponse = response as MCPToolsListResponse
      const tools = toolsResponse.result?.tools || []
      console.log(`MCP 服务器 ${config.url} 发现 ${tools.length} 个工具`)
      return tools
    } catch (error) {
      console.error(`获取 MCP 服务器 ${config.url} 工具列表失败:`, error)
      return []
    }
  }

  /**
   * 调用 MCP 工具
   */
  static async callTool(
    config: MCPConfig, 
    toolName: string, 
    arguments_: Record<string, any>
  ): Promise<any> {
    try {
      console.log(`调用 MCP 工具: ${toolName} 在 ${config.url}`)
      const response = await this.makeMCPRequest(config, 'tools/call', {
        name: toolName,
        arguments: arguments_
      })
      if (response.error) {
        throw new Error(response.error.message)
      }
      console.log(`MCP 工具 ${toolName} 调用成功`)
      return response.result
    } catch (error) {
      console.error(`调用 MCP 工具 ${toolName} 失败:`, error)
      throw error
    }
  }

  /**
   * 发送 MCP 请求
   */
  private static async makeMCPRequest(
    config: MCPConfig, 
    method: string, 
    params: any
  ): Promise<MCPInitializeResponse | MCPToolsListResponse> {
    const url = config.url
    
    // 验证 URL 格式
    if (!url || !url.startsWith('http')) {
      throw new Error(`无效的 MCP 服务器 URL: ${url}`)
    }
    
    const headers: Record<string, string> = {}

    // 添加认证信息
    if (config.authType === 'bearer_token' && config.authConfig?.token) {
      headers['Authorization'] = `Bearer ${config.authConfig.token}`
    } else if (config.authType === 'api_key' && config.authConfig?.apiKey) {
      headers['X-API-Key'] = config.authConfig.apiKey
    } else if (config.authType === 'basic_auth' && config.authConfig?.username && config.authConfig?.password) {
      // 使用微信小程序兼容的 base64 编码方法
      const credentials = this.base64Encode(`${config.authConfig.username}:${config.authConfig.password}`)
      headers['Authorization'] = `Basic ${credentials}`
    }

    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    }

    console.log(`发送 MCP 请求到 ${url}:`, requestBody)

    try {
      // 使用封装好的 HTTP 服务
      const response = await post(url, requestBody, {
        header: headers,
        timeout: 8000 // 8 秒超时
      })

      console.log(`MCP 响应:`, response.data)
      return response.data as any
      
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
   * Base64 编码（微信小程序兼容）
   */
  private static base64Encode(str: string): string {
    try {
      // 使用微信小程序的 base64 编码
      const encoder = new Uint8Array(str.length)
      for (let i = 0; i < str.length; i++) {
        encoder[i] = str.charCodeAt(i)
      }
      return wx.arrayBufferToBase64(encoder.buffer)
    } catch (error) {
      // 如果失败，返回原始字符串（仅用于测试）
      console.warn('Base64 编码失败，跳过 Basic Auth:', error)
      return str
    }
  }
}
