// 聊天历史存储服务接口
// 这个接口定义了聊天历史存储的基本操作，便于未来扩展其他存储方式（如云存储、数据库等）

import { ChatHistoryStorage } from '../types/chat-history'

/**
 * 聊天历史存储服务工厂
 * 用于创建不同类型的存储服务实例
 */
export class ChatHistoryStorageFactory {
  private static instance: ChatHistoryStorage | null = null
  private static storageType: 'local' | 'cloud' | 'database' = 'local'

  /**
   * 设置存储类型
   */
  static setStorageType(type: 'local' | 'cloud' | 'database'): void {
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
      
      case 'cloud':
        // 未来可以扩展云存储服务
        // const { CloudChatHistoryStorage } = require('./cloud-chat-history-storage')
        // return CloudChatHistoryStorage.getInstance()
        throw new Error('云存储服务尚未实现')
      
      case 'database':
        // 未来可以扩展数据库存储服务
        // const { DatabaseChatHistoryStorage } = require('./database-chat-history-storage')
        // return DatabaseChatHistoryStorage.getInstance()
        throw new Error('数据库存储服务尚未实现')
      
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

  /**
   * 迁移数据到新的存储类型
   */
  static async migrateData(
    fromType: 'local' | 'cloud' | 'database',
    toType: 'local' | 'cloud' | 'database'
  ): Promise<boolean> {
    try {
      // 保存当前存储类型
      const currentType = this.storageType
      
      // 切换到源存储类型
      this.setStorageType(fromType)
      const sourceStorage = this.getInstance()
      const sessions = sourceStorage.getAllSessions()
      
      // 切换到目标存储类型
      this.setStorageType(toType)
      const targetStorage = this.getInstance()
      
      // 迁移数据
      for (const session of sessions) {
        // 创建会话
        const newSession = targetStorage.createSession(session.title)
        
        // 迁移消息
        for (const message of session.messages) {
          targetStorage.addMessage(newSession.id, {
            role: message.role,
            content: message.content,
            tool_call_id: message.tool_call_id,
            tool_calls: message.tool_calls
          })
        }
      }
      
      // 恢复原来的存储类型
      this.setStorageType(currentType)
      
      return true
    } catch (error) {
      console.error('数据迁移失败:', error)
      return false
    }
  }
}

// 导出默认的本地存储服务，保持向后兼容
export { LocalChatHistoryStorage } from './chat-history-storage'
