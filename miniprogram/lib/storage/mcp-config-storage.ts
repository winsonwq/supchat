// MCP Server 配置存储管理
import { MCPConfig, AuthType } from '../types/mcp-config'
import { getBuiltinMCPConfig, isBuiltinMCP } from '../mcp/builtin-tools'

const STORAGE_KEY = 'mcp_configs'

export class MCPConfigStorage {
  
  /**
   * 获取所有 MCP 配置（包含内置配置）
   */
  static getAllConfigs(): MCPConfig[] {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      const userConfigs = data ? JSON.parse(data) : []
      
      // 添加内置配置到列表开头
      const builtinConfig = getBuiltinMCPConfig()
      return [builtinConfig, ...userConfigs]
    } catch (error) {
      console.error('获取 MCP 配置失败:', error)
      // 即使出错也返回内置配置
      return [getBuiltinMCPConfig()]
    }
  }

  /**
   * 保存 MCP 配置
   */
  static saveConfig(config: MCPConfig): boolean {
    // 不允许修改内置配置
    if (isBuiltinMCP(config.id)) {
      console.warn('不允许修改内置 MCP 配置')
      return false
    }

    try {
      // 只获取用户配置，不包含内置配置
      const data = wx.getStorageSync(STORAGE_KEY)
      const userConfigs = data ? JSON.parse(data) : []
      const existingIndex = userConfigs.findIndex(c => c.id === config.id)
      
      if (existingIndex >= 0) {
        // 更新现有配置
        userConfigs[existingIndex] = { ...config, updatedAt: Date.now() }
      } else {
        // 添加新配置
        config.createdAt = Date.now()
        config.updatedAt = Date.now()
        userConfigs.push(config)
      }

      wx.setStorageSync(STORAGE_KEY, JSON.stringify(userConfigs))
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
    // 不允许删除内置配置
    if (isBuiltinMCP(configId)) {
      console.warn('不允许删除内置 MCP 配置')
      return false
    }

    try {
      // 只操作用户配置
      const data = wx.getStorageSync(STORAGE_KEY)
      const userConfigs = data ? JSON.parse(data) : []
      const filteredConfigs = userConfigs.filter(c => c.id !== configId)
      
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
   * 获取已启用的配置（全局启用）
   */
  static getEnabledConfigs(): MCPConfig[] {
    return this.getAllConfigs().filter(config => config.isEnabled)
  }

  /**
   * 获取可用于消息发送的 MCP 配置（全局启用且消息发送开启）
   */
  static getMessageEnabledConfigs(): MCPConfig[] {
    const enabledConfigs = this.getEnabledConfigs()
    return enabledConfigs.filter(config => this.isMessageEnabled(config.id))
  }

  /**
   * 切换配置启用状态
   */
  static toggleConfigEnabled(configId: string): boolean {
    // 不允许切换内置配置的启用状态
    if (isBuiltinMCP(configId)) {
      console.warn('不允许切换内置 MCP 配置的启用状态')
      return false
    }

    try {
      // 只操作用户配置
      const data = wx.getStorageSync(STORAGE_KEY)
      const userConfigs = data ? JSON.parse(data) : []
      const configIndex = userConfigs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        userConfigs[configIndex].isEnabled = !userConfigs[configIndex].isEnabled
        userConfigs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(userConfigs))
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
    // 不允许更新内置配置的在线状态
    if (isBuiltinMCP(configId)) {
      console.warn('不允许更新内置 MCP 配置的在线状态')
      return false
    }

    try {
      // 只操作用户配置
      const data = wx.getStorageSync(STORAGE_KEY)
      const userConfigs = data ? JSON.parse(data) : []
      const configIndex = userConfigs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        userConfigs[configIndex].isOnline = isOnline
        userConfigs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(userConfigs))
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
    // 如果是内置配置，不允许更新工具列表
    if (isBuiltinMCP(configId)) {
      console.warn('不允许更新内置 MCP 配置的工具列表')
      return false
    }

    try {
      // 只操作用户配置
      const data = wx.getStorageSync(STORAGE_KEY)
      const userConfigs = data ? JSON.parse(data) : []
      const configIndex = userConfigs.findIndex(c => c.id === configId)
      
      if (configIndex >= 0) {
        userConfigs[configIndex].tools = tools
        userConfigs[configIndex].toolCount = tools.length
        userConfigs[configIndex].updatedAt = Date.now()
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(userConfigs))
        return true
      }
      
      return false
    } catch (error) {
      console.error('更新 MCP 配置工具信息失败:', error)
      return false
    }
  }

  /**
   * 更新内置配置的工具状态（仅限工具启用/禁用状态）
   */
  static updateBuiltinToolState(toolName: string, isEnabled: boolean, needConfirm: boolean): boolean {
    try {
      // 这里可以添加一个专门存储内置工具状态的键
      const storageKey = 'builtin_tool_states'
      const data = wx.getStorageSync(storageKey)
      const toolStates = data ? JSON.parse(data) : {}
      
      toolStates[toolName] = {
        isEnabled,
        needConfirm,
        updatedAt: Date.now()
      }
      
      wx.setStorageSync(storageKey, JSON.stringify(toolStates))
      return true
    } catch (error) {
      console.error('更新内置工具状态失败:', error)
      return false
    }
  }

  /**
   * 获取内置工具状态
   */
  static getBuiltinToolStates(): Record<string, { isEnabled: boolean; needConfirm: boolean }> {
    try {
      const storageKey = 'builtin_tool_states'
      const data = wx.getStorageSync(storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('获取内置工具状态失败:', error)
      return {}
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

  /**
   * 获取内置工具全局启用状态
   */
  static getBuiltinGlobalEnabled(): boolean {
    try {
      const storageKey = 'builtin_global_enabled'
      const data = wx.getStorageSync(storageKey)
      const enabled = data ? JSON.parse(data) : true // 默认为启用
      return enabled
    } catch (error) {
      console.error('获取内置工具全局启用状态失败:', error)
      return true
    }
  }

  /**
   * 设置内置工具全局启用状态
   */
  static setBuiltinGlobalEnabled(enabled: boolean): boolean {
    try {
      const storageKey = 'builtin_global_enabled'
      wx.setStorageSync(storageKey, JSON.stringify(enabled))
      return true
    } catch (error) {
      console.error('设置内置工具全局启用状态失败:', error)
      return false
    }
  }

  /**
   * 检查 MCP 是否启用消息发送
   */
  static isMessageEnabled(configId: string): boolean {
    try {
      const storageKey = 'mcp_message_enabled'
      const data = wx.getStorageSync(storageKey)
      const messageEnabled = data ? JSON.parse(data) : {}
      return messageEnabled[configId] !== false // 默认为 true
    } catch (error) {
      console.error('获取 MCP 消息发送状态失败:', error)
      return true
    }
  }

  /**
   * 设置 MCP 消息发送状态
   */
  static setMessageEnabled(configId: string, enabled: boolean): boolean {
    try {
      const storageKey = 'mcp_message_enabled'
      const data = wx.getStorageSync(storageKey)
      const messageEnabled = data ? JSON.parse(data) : {}
      messageEnabled[configId] = enabled
      wx.setStorageSync(storageKey, JSON.stringify(messageEnabled))
      return true
    } catch (error) {
      console.error('设置 MCP 消息发送状态失败:', error)
      return false
    }
  }

  /**
   * 切换 MCP 消息发送状态
   */
  static toggleMessageEnabled(configId: string): boolean {
    const currentState = this.isMessageEnabled(configId)
    return this.setMessageEnabled(configId, !currentState)
  }
}
