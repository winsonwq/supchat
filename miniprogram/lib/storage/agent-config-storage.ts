// Agent 配置存储管理
import { AgentDefinition, AgentInput } from '../types/agent'

const STORAGE_KEY = 'agent_configs'

export class AgentConfigStorage {
  
  /**
   * 获取所有 Agent 配置
   */
  static getAllConfigs(): AgentDefinition[] {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取 Agent 配置失败:', error)
      return []
    }
  }

  /**
   * 保存 Agent 配置
   */
  static saveConfig(config: AgentDefinition): boolean {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      const configs = data ? JSON.parse(data) : []
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
      console.error('保存 Agent 配置失败:', error)
      return false
    }
  }

  /**
   * 删除 Agent 配置
   */
  static deleteConfig(configId: string): boolean {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      const configs = data ? JSON.parse(data) : []
      const filteredConfigs = configs.filter(c => c.id !== configId)
      
      wx.setStorageSync(STORAGE_KEY, JSON.stringify(filteredConfigs))
      return true
    } catch (error) {
      console.error('删除 Agent 配置失败:', error)
      return false
    }
  }

  /**
   * 根据ID获取配置
   */
  static getConfigById(configId: string): AgentDefinition | null {
    const configs = this.getAllConfigs()
    return configs.find(c => c.id === configId) || null
  }

  /**
   * 获取已启用的配置
   */
  static getEnabledConfigs(): AgentDefinition[] {
    return this.getAllConfigs().filter(config => config.isEnabled !== false)
  }

  /**
   * 切换配置启用状态
   */
  static toggleConfigEnabled(configId: string): boolean {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      const configs = data ? JSON.parse(data) : []
      const configIndex = configs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        configs[configIndex].isEnabled = !configs[configIndex].isEnabled
        configs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(configs))
        return true
      }
      
      return false
    } catch (error) {
      console.error('切换 Agent 配置状态失败:', error)
      return false
    }
  }

  /**
   * 设置默认配置
   */
  static setDefaultConfig(configId: string): boolean {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      const configs = data ? JSON.parse(data) : []
      
      // 先清除所有配置的默认状态
      configs.forEach((config: AgentDefinition) => {
        config.isDefault = false
      })
      
      // 设置指定配置为默认
      const configIndex = configs.findIndex(c => c.id === configId)
      if (configIndex >= 0) {
        configs[configIndex].isDefault = true
        configs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(configs))
        return true
      }
      
      return false
    } catch (error) {
      console.error('设置默认 Agent 配置失败:', error)
      return false
    }
  }

  /**
   * 获取默认配置
   */
  static getDefaultConfig(): AgentDefinition | null {
    const configs = this.getAllConfigs()
    return configs.find(c => c.isDefault === true) || null
  }

  /**
   * 生成新的配置ID
   */
  static generateConfigId(): string {
    return `agent_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证配置是否有效
   */
  static validateConfig(config: Partial<AgentDefinition>): { isValid: boolean; message?: string } {
    if (!config.name?.trim()) {
      return { isValid: false, message: '请输入配置名称' }
    }
    
    if (!config.systemPrompt?.trim()) {
      return { isValid: false, message: '请输入系统提示词' }
    }

    return { isValid: true }
  }

  /**
   * 创建配置（从输入数据）
   */
  static createConfigFromInput(input: AgentInput): AgentDefinition {
    return {
      id: this.generateConfigId(),
      name: input.name.trim(),
      description: input.description?.trim(),
      systemPrompt: input.systemPrompt.trim(),
      mcpServers: input.mcpServers || [],
      isEnabled: true,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * 更新配置（从输入数据）
   */
  static updateConfigFromInput(configId: string, input: AgentInput): AgentDefinition | null {
    const existingConfig = this.getConfigById(configId)
    if (!existingConfig) {
      return null
    }

    return {
      ...existingConfig,
      name: input.name.trim(),
      description: input.description?.trim(),
      systemPrompt: input.systemPrompt.trim(),
      mcpServers: input.mcpServers || [],
      updatedAt: Date.now()
    }
  }
}
