// MCP Server 配置存储管理
import { MCPConfig, AuthType } from '../types/mcp-config'

const STORAGE_KEY = 'mcp_configs'

export class MCPConfigStorage {
  
  /**
   * 获取所有 MCP 配置
   */
  static getAllConfigs(): MCPConfig[] {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取 MCP 配置失败:', error)
      return []
    }
  }

  /**
   * 保存 MCP 配置
   */
  static saveConfig(config: MCPConfig): boolean {
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
      console.error('保存 MCP 配置失败:', error)
      return false
    }
  }

  /**
   * 删除 MCP 配置
   */
  static deleteConfig(configId: string): boolean {
    try {
      const configs = this.getAllConfigs()
      const filteredConfigs = configs.filter(c => c.id !== configId)
      
      wx.setStorageSync(STORAGE_KEY, JSON.stringify(filteredConfigs))
      return true
    } catch (error) {
      console.error('删除 MCP 配置失败:', error)
      return false
    }
  }

  /**
   * 根据ID获取配置
   */
  static getConfigById(configId: string): MCPConfig | null {
    const configs = this.getAllConfigs()
    return configs.find(c => c.id === configId) || null
  }

  /**
   * 获取已启用的配置
   */
  static getEnabledConfigs(): MCPConfig[] {
    return this.getAllConfigs().filter(config => config.isEnabled)
  }

  /**
   * 切换配置启用状态
   */
  static toggleConfigEnabled(configId: string): boolean {
    try {
      const configs = this.getAllConfigs()
      const configIndex = configs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        configs[configIndex].isEnabled = !configs[configIndex].isEnabled
        configs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(configs))
        return true
      }
      
      return false
    } catch (error) {
      console.error('切换 MCP 配置状态失败:', error)
      return false
    }
  }

  /**
   * 更新配置在线状态
   */
  static updateConfigOnlineStatus(configId: string, isOnline: boolean): boolean {
    try {
      const configs = this.getAllConfigs()
      const configIndex = configs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        configs[configIndex].isOnline = isOnline
        configs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(configs))
        return true
      }
      
      return false
    } catch (error) {
      console.error('更新 MCP 配置在线状态失败:', error)
      return false
    }
  }

  /**
   * 更新配置工具信息
   */
  static updateConfigTools(configId: string, tools: any[]): boolean {
    try {
      const configs = this.getAllConfigs()
      const configIndex = configs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        configs[configIndex].tools = tools
        configs[configIndex].toolCount = tools.length
        configs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(configs))
        return true
      }
      
      return false
    } catch (error) {
      console.error('更新 MCP 配置工具信息失败:', error)
      return false
    }
  }

  /**
   * 生成新的配置ID
   */
  static generateConfigId(): string {
    return `mcp_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证配置是否有效
   */
  static validateConfig(config: Partial<MCPConfig>): { isValid: boolean; message?: string } {
    if (!config.name?.trim()) {
      return { isValid: false, message: '请输入配置名称' }
    }
    
    if (!config.url?.trim()) {
      return { isValid: false, message: '请输入 MCP Server URL' }
    }
    
    if (!config.authType) {
      return { isValid: false, message: '请选择认证方式' }
    }

    // 验证认证配置
    if (config.authType === AuthType.BEARER_TOKEN) {
      if (!config.authConfig?.token?.trim()) {
        return { isValid: false, message: '请输入 Bearer Token' }
      }
    } else if (config.authType === AuthType.BASIC_AUTH) {
      if (!config.authConfig?.username?.trim() || !config.authConfig?.password?.trim()) {
        return { isValid: false, message: '请输入用户名和密码' }
      }
    } else if (config.authType === AuthType.API_KEY) {
      if (!config.authConfig?.apiKey?.trim()) {
        return { isValid: false, message: '请输入 API Key' }
      }
    }

    return { isValid: true }
  }
}
