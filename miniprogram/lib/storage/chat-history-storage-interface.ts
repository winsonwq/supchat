// 聊天历史存储服务接口
// 这个接口定义了聊天历史存储的基本操作，便于未来扩展其他存储方式

import { ChatHistoryStorage } from '../types/chat-history'

/**
 * 聊天历史存储服务工厂
 * 用于创建不同类型的存储服务实例
 */
export class ChatHistoryStorageFactory {
  private static instance: ChatHistoryStorage | null = null
  private static storageType: 'local' = 'local'

  /**
   * 设置存储类型
   */
  static setStorageType(type: 'local'): void {
    this.storageType = type
    this.instance = null // 重置实例，下次获取时会创建新实例
  }

  /**
   * 获取存储服务实例
   */
  static getInstance(): ChatHistoryStorage {
    if (!this.instance) {
      this.instance = this.createStorageService()
    }
    return this.instance
  }

  /**
   * 创建存储服务实例
   */
  private static createStorageService(): ChatHistoryStorage {
    switch (this.storageType) {
      case 'local':
        // 动态导入本地存储服务
        const { LocalChatHistoryStorage } = require('./chat-history-storage')
        return LocalChatHistoryStorage.getInstance()
      
      default:
        throw new Error(`不支持的存储类型: ${this.storageType}`)
    }
  }

  /**
   * 获取当前存储类型
   */
  static getCurrentStorageType(): string {
    return this.storageType
  }

  /**
   * 检查存储服务是否可用
   */
  static async isStorageAvailable(): Promise<boolean> {
    try {
      const storage = this.getInstance()
      // 尝试执行一个简单的操作来测试存储服务
      const count = storage.getSessionCount()
      return true
    } catch (error) {
      console.error('存储服务不可用:', error)
      return false
    }
  }
}

// 导出默认的本地存储服务，保持向后兼容
export { LocalChatHistoryStorage } from './chat-history-storage'
