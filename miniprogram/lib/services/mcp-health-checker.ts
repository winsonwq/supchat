// MCP 工具健康检查服务
import { MCPConfig } from '../types/mcp-config'
import { MCPConfigStorage } from '../storage/mcp-config-storage'
import { post } from './http'

// 健康检查结果
export interface MCPHealthCheckResult {
  configId: string
  serverName: string
  url: string
  isOnline: boolean
  responseTime: number
  lastChecked: number
  error?: string
  toolsCount?: number
}

// 健康检查统计
export interface MCPHealthCheckStats {
  total: number
  online: number
  offline: number
  averageResponseTime: number
  lastCheckTime: number
}

/**
 * MCP 工具健康检查服务
 * 用于检查 MCP 服务器的在线状态和响应时间
 */
export class MCPHealthChecker {
  private static instance: MCPHealthChecker
  private healthResults: Map<string, MCPHealthCheckResult> = new Map()
  private isChecking = false

  static getInstance(): MCPHealthChecker {
    if (!MCPHealthChecker.instance) {
      MCPHealthChecker.instance = new MCPHealthChecker()
    }
    return MCPHealthChecker.instance
  }

  /**
   * 检查单个 MCP 配置的健康状态
   */
  async checkConfigHealth(config: MCPConfig): Promise<MCPHealthCheckResult> {
    const startTime = Date.now()
    let isOnline = false
    let error: string | undefined
    let toolsCount: number | undefined

    try {
      console.log(`检查 MCP 服务器健康状态: ${config.name} (${config.url})`)

      // 发送健康检查请求
      const response = await this.sendHealthCheckRequest(config)
      
      if (response.statusCode === 200) {
        isOnline = true
        // 尝试获取工具数量
        try {
          const data = response.data as any
          if (data && data.result && data.result.tools) {
            toolsCount = Array.isArray(data.result.tools) ? data.result.tools.length : 0
          }
        } catch (e) {
          console.warn('无法解析工具数量:', e)
        }
      } else {
        error = `HTTP ${response.statusCode}: ${response.errMsg || '请求失败'}`
      }
    } catch (err: any) {
      error = err.message || '网络请求失败'
      console.error(`MCP 服务器健康检查失败 ${config.name}:`, err)
    }

    const responseTime = Date.now() - startTime
    const result: MCPHealthCheckResult = {
      configId: config.id,
      serverName: config.name,
      url: config.url,
      isOnline,
      responseTime,
      lastChecked: Date.now(),
      error,
      toolsCount
    }

    // 保存结果
    this.healthResults.set(config.id, result)

    // 更新配置的在线状态
    MCPConfigStorage.updateConfigOnlineStatus(config.id, isOnline)

    console.log(`MCP 服务器 ${config.name} 健康检查完成:`, {
      isOnline,
      responseTime: `${responseTime}ms`,
      toolsCount
    })

    return result
  }

  /**
   * 检查所有 MCP 配置的健康状态
   */
  async checkAllConfigsHealth(): Promise<MCPHealthCheckResult[]> {
    if (this.isChecking) {
      console.log('健康检查正在进行中，跳过重复请求')
      return Array.from(this.healthResults.values())
    }

    this.isChecking = true
    const results: MCPHealthCheckResult[] = []

    try {
      const configs = MCPConfigStorage.getAllConfigs()
      console.log(`开始检查 ${configs.length} 个 MCP 配置的健康状态`)

      // 并发检查所有配置
      const checkPromises = configs.map(config => this.checkConfigHealth(config))
      const checkResults = await Promise.allSettled(checkPromises)

      checkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`配置 ${configs[index]?.name} 健康检查失败:`, result.reason)
          // 创建失败结果
          const failedResult: MCPHealthCheckResult = {
            configId: configs[index]?.id || 'unknown',
            serverName: configs[index]?.name || 'unknown',
            url: configs[index]?.url || 'unknown',
            isOnline: false,
            responseTime: 0,
            lastChecked: Date.now(),
            error: result.reason?.message || '检查失败'
          }
          results.push(failedResult)
        }
      })

      console.log(`健康检查完成，共检查 ${results.length} 个配置`)
    } finally {
      this.isChecking = false
    }

    return results
  }

  /**
   * 获取配置的健康状态
   */
  getConfigHealth(configId: string): MCPHealthCheckResult | null {
    return this.healthResults.get(configId) || null
  }

  /**
   * 获取所有健康检查结果
   */
  getAllHealthResults(): MCPHealthCheckResult[] {
    return Array.from(this.healthResults.values())
  }

  /**
   * 获取健康检查统计
   */
  getHealthStats(): MCPHealthCheckStats {
    const results = this.getAllHealthResults()
    const total = results.length
    const online = results.filter(r => r.isOnline).length
    const offline = total - online
    
    let totalResponseTime = 0
    let checkedCount = 0
    let lastCheckTime = 0

    results.forEach(result => {
      if (result.isOnline && result.responseTime > 0) {
        totalResponseTime += result.responseTime
        checkedCount++
      }
      if (result.lastChecked > lastCheckTime) {
        lastCheckTime = result.lastChecked
      }
    })

    const averageResponseTime = checkedCount > 0 ? totalResponseTime / checkedCount : 0

    return {
      total,
      online,
      offline,
      averageResponseTime,
      lastCheckTime
    }
  }

  /**
   * 清除健康检查结果
   */
  clearHealthResults(): void {
    this.healthResults.clear()
    console.log('健康检查结果已清除')
  }

  /**
   * 发送健康检查请求
   */
  private async sendHealthCheckRequest(config: MCPConfig): Promise<any> {
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

    // 发送初始化请求作为健康检查
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'initialize',
      params: {}
    }

    try {
      console.log(`发送健康检查请求到 ${url}`)
      
      const response = await post(url, request, {
        header: headers,
        timeout: 5000 // 5 秒超时
      })

      return response
      
    } catch (error: any) {
      console.error(`健康检查请求失败 (${url}):`, error)
      throw error
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
}
