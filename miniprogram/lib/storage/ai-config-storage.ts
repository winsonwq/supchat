// AI配置存储管理
import { AIConfig } from '../types/ai-config'

const STORAGE_KEY = 'ai_configs'
const ACTIVE_CONFIG_KEY = 'active_ai_config_id'

export class AIConfigStorage {
  
  /**
   * 获取所有AI配置
   */
  static getAllConfigs(): AIConfig[] {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      const configs = data ? JSON.parse(data) : []
      
      // 确保 isActive 状态与当前激活的配置ID同步
      const activeConfigId = this.getActiveConfigId()
      return configs.map(config => ({
        ...config,
        isActive: config.id === activeConfigId
      }))
    } catch (error) {
      console.error('获取AI配置失败:', error)
      return []
    }
  }

  /**
   * 保存AI配置
   */
  static saveConfig(config: AIConfig): boolean {
    try {
      const configs = this.getAllConfigs()
      const existingIndex = configs.findIndex(c => c.id === config.id)
      
      if (existingIndex >= 0) {
        // 更新现有配置
        configs[existingIndex] = { ...config, updatedAt: Date.now() }
      } else {
        // 添加新配置
        config.createdAt = Date.now()
        config.updatedAt = Date.now()
        configs.push(config)
      }

      wx.setStorageSync(STORAGE_KEY, JSON.stringify(configs))
      return true
    } catch (error) {
      console.error('保存AI配置失败:', error)
      return false
    }
  }

  /**
   * 删除AI配置
   */
  static deleteConfig(configId: string): boolean {
    try {
      const configs = this.getAllConfigs()
      const filteredConfigs = configs.filter(c => c.id !== configId)
      
      // 如果删除的是当前激活的配置，需要清除激活状态
      const activeConfigId = this.getActiveConfigId()
      if (activeConfigId === configId) {
        this.setActiveConfig('')
      }

      wx.setStorageSync(STORAGE_KEY, JSON.stringify(filteredConfigs))
      return true
    } catch (error) {
      console.error('删除AI配置失败:', error)
      return false
    }
  }

  /**
   * 根据ID获取配置
   */
  static getConfigById(configId: string): AIConfig | null {
    const configs = this.getAllConfigs()
    return configs.find(c => c.id === configId) || null
  }

  /**
   * 设置激活的配置
   */
  static setActiveConfig(configId: string): boolean {
    try {
      // 先更新所有配置的激活状态
      const configs = this.getAllConfigs()
      const updatedConfigs = configs.map(config => ({
        ...config,
        isActive: config.id === configId
      }))
      
      wx.setStorageSync(STORAGE_KEY, JSON.stringify(updatedConfigs))
      wx.setStorageSync(ACTIVE_CONFIG_KEY, configId)
      return true
    } catch (error) {
      console.error('设置激活配置失败:', error)
      return false
    }
  }

  /**
   * 获取激活的配置ID
   */
  static getActiveConfigId(): string {
    try {
      return wx.getStorageSync(ACTIVE_CONFIG_KEY) || ''
    } catch (error) {
      console.error('获取激活配置ID失败:', error)
      return ''
    }
  }

  /**
   * 获取激活的配置
   */
  static getActiveConfig(): AIConfig | null {
    const activeId = this.getActiveConfigId()
    if (!activeId) return null
    
    return this.getConfigById(activeId)
  }

  /**
   * 生成新的配置ID
   */
  static generateConfigId(): string {
    return `ai_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证配置是否有效
   */
  static validateConfig(config: Partial<AIConfig>): { isValid: boolean; message?: string } {
    if (!config.name?.trim()) {
      return { isValid: false, message: '请输入配置名称' }
    }
    
    if (!config.apiKey?.trim()) {
      return { isValid: false, message: '请输入API密钥' }
    }
    
    if (!config.apiHost?.trim()) {
      return { isValid: false, message: '请输入API地址' }
    }
    
    if (!config.model?.trim()) {
      return { isValid: false, message: '请输入模型名称' }
    }

    return { isValid: true }
  }
}
