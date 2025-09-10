// 工具确认管理器
import { ToolConfirmData, StreamContent, StreamContentType } from '../mcp/types'
import { createStreamContent } from '../utils/util.js'

type ConfirmCallback = (confirmed: boolean) => void

/**
 * 工具确认管理器
 * 负责管理工具确认的 Promise 回调
 */
export class ToolConfirmManager {
  private static instance: ToolConfirmManager
  private confirmCallbacks: Map<string, ConfirmCallback> = new Map()
  private onStreamCallback: ((content: StreamContent) => void) | null = null

  static getInstance(): ToolConfirmManager {
    if (!ToolConfirmManager.instance) {
      ToolConfirmManager.instance = new ToolConfirmManager()
    }
    return ToolConfirmManager.instance
  }

  /**
   * 设置流回调
   */
  setStreamCallback(callback: (content: StreamContent) => void): void {
    this.onStreamCallback = callback
  }

  /**
   * 创建工具确认请求
   */
  createConfirmRequest(
    toolName: string,
    toolCall: any,
    arguments_: Record<string, unknown>,
    onStreamCallback?: (content: StreamContent) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmId = this.generateConfirmId()
      
      // 保存回调
      this.confirmCallbacks.set(confirmId, resolve)
      
      // 创建确认数据
      const confirmData: ToolConfirmData = {
        toolName,
        toolCall,
        arguments: arguments_,
        confirmId
      }
      
      // 通过流式内容发送确认请求
      const callback = onStreamCallback || this.onStreamCallback
      if (callback) {
        const streamContent = createStreamContent(
          '',
          StreamContentType.TOOL_CONFIRM,
          false,
          undefined,
          undefined,
          confirmData
        )
        callback(streamContent)
      }
    })
  }

  /**
   * 处理用户确认
   */
  handleConfirm(confirmId: string): void {
    const callback = this.confirmCallbacks.get(confirmId)
    if (callback) {
      callback(true)
      this.confirmCallbacks.delete(confirmId)
    }
  }

  /**
   * 处理用户取消
   */
  handleCancel(confirmId: string): void {
    const callback = this.confirmCallbacks.get(confirmId)
    if (callback) {
      callback(false)
      this.confirmCallbacks.delete(confirmId)
    }
  }

  /**
   * 生成确认ID
   */
  private generateConfirmId(): string {
    return 'confirm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 清理所有待确认的回调
   */
  clearAll(): void {
    // 取消所有待确认的操作
    for (const callback of this.confirmCallbacks.values()) {
      callback(false)
    }
    this.confirmCallbacks.clear()
  }
}
