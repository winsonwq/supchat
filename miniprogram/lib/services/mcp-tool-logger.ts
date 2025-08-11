// MCP 工具调用日志服务
import { MCPConfig } from '../types/mcp-config'

// 工具调用日志条目
export interface MCPToolCallLog {
  id: string
  toolName: string
  serverName: string
  serverUrl: string
  arguments: Record<string, unknown>
  result?: unknown
  error?: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'success' | 'error'
}

/**
 * MCP 工具调用日志服务
 * 用于记录和调试 MCP 工具调用
 */
export class MCPToolLogger {
  private static instance: MCPToolLogger
  private logs: MCPToolCallLog[] = []
  private readonly MAX_LOGS = 100 // 最多保留 100 条日志

  static getInstance(): MCPToolLogger {
    if (!MCPToolLogger.instance) {
      MCPToolLogger.instance = new MCPToolLogger()
    }
    return MCPToolLogger.instance
  }

  /**
   * 记录工具调用开始
   */
  logToolCallStart(
    toolName: string,
    config: MCPConfig,
    arguments_: Record<string, unknown>
  ): string {
    const logId = this.generateLogId()
    
    const log: MCPToolCallLog = {
      id: logId,
      toolName,
      serverName: config.name,
      serverUrl: config.url,
      arguments: arguments_,
      startTime: Date.now(),
      status: 'pending'
    }
    
    this.logs.unshift(log)
    this.trimLogs()
    
    console.log(`[MCP Logger] 开始执行工具 ${toolName} 在服务器 ${config.name}:`, arguments_)
    
    return logId
  }

  /**
   * 记录工具调用成功
   */
  logToolCallSuccess(logId: string, result: unknown): void {
    const log = this.logs.find(l => l.id === logId)
    if (log) {
      log.status = 'success'
      log.result = result
      log.endTime = Date.now()
      log.duration = log.endTime - log.startTime
      
      console.log(`[MCP Logger] 工具 ${log.toolName} 执行成功，耗时 ${log.duration}ms`)
    }
  }

  /**
   * 记录工具调用失败
   */
  logToolCallError(logId: string, error: string): void {
    const log = this.logs.find(l => l.id === logId)
    if (log) {
      log.status = 'error'
      log.error = error
      log.endTime = Date.now()
      log.duration = log.endTime - log.startTime
      
      console.error(`[MCP Logger] 工具 ${log.toolName} 执行失败，耗时 ${log.duration}ms:`, error)
    }
  }

  /**
   * 获取所有日志
   */
  getAllLogs(): MCPToolCallLog[] {
    return [...this.logs]
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 10): MCPToolCallLog[] {
    return this.logs.slice(0, count)
  }

  /**
   * 获取工具调用统计
   */
  getToolCallStats(): {
    total: number
    success: number
    error: number
    pending: number
    averageDuration: number
    byTool: Record<string, { total: number; success: number; error: number; avgDuration: number }>
    byServer: Record<string, { total: number; success: number; error: number; avgDuration: number }>
  } {
    const stats = {
      total: this.logs.length,
      success: 0,
      error: 0,
      pending: 0,
      averageDuration: 0,
      byTool: {} as Record<string, { total: number; success: number; error: number; avgDuration: number }>,
      byServer: {} as Record<string, { total: number; success: number; error: number; avgDuration: number }>
    }

    let totalDuration = 0
    let completedCount = 0

    this.logs.forEach(log => {
      // 统计状态
      stats[log.status]++
      
      // 统计工具
      if (!stats.byTool[log.toolName]) {
        stats.byTool[log.toolName] = { total: 0, success: 0, error: 0, avgDuration: 0 }
      }
      stats.byTool[log.toolName].total++
      if (log.status === 'success') stats.byTool[log.toolName].success++
      if (log.status === 'error') stats.byTool[log.toolName].error++
      
      // 统计服务器
      if (!stats.byServer[log.serverName]) {
        stats.byServer[log.serverName] = { total: 0, success: 0, error: 0, avgDuration: 0 }
      }
      stats.byServer[log.serverName].total++
      if (log.status === 'success') stats.byServer[log.serverName].success++
      if (log.status === 'error') stats.byServer[log.serverName].error++
      
      // 统计耗时
      if (log.duration !== undefined) {
        totalDuration += log.duration
        completedCount++
      }
    })

    // 计算平均耗时
    if (completedCount > 0) {
      stats.averageDuration = totalDuration / completedCount
    }

    // 计算各工具和服务器的平均耗时
    Object.keys(stats.byTool).forEach(toolName => {
      const toolLogs = this.logs.filter(l => l.toolName === toolName && l.duration !== undefined)
      if (toolLogs.length > 0) {
        const toolTotalDuration = toolLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
        stats.byTool[toolName].avgDuration = toolTotalDuration / toolLogs.length
      }
    })

    Object.keys(stats.byServer).forEach(serverName => {
      const serverLogs = this.logs.filter(l => l.serverName === serverName && l.duration !== undefined)
      if (serverLogs.length > 0) {
        const serverTotalDuration = serverLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
        stats.byServer[serverName].avgDuration = serverTotalDuration / serverLogs.length
      }
    })

    return stats
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
    console.log('[MCP Logger] 日志已清空')
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 生成日志 ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 修剪日志数量
   */
  private trimLogs(): void {
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS)
    }
  }
}
