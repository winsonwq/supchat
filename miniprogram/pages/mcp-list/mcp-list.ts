// mcp-list.ts
import { MCPConfig, AuthType } from '../../lib/types/mcp-config'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import { MCPServerService, MCPTool } from '../../lib/services/mcp-server'

interface ConfigWithShowTools extends MCPConfig {
  showTools?: boolean
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configs: [] as ConfigWithShowTools[],
    contentPaddingTop: 0,
    refreshing: {} as Record<string, boolean>, // 记录每个配置的刷新状态
    // 工具详情对话框相关状态
    toolDialogVisible: false,
    selectedTool: null as MCPTool | null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log('MCP列表页面加载')
    
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight()
    this.setData({ contentPaddingTop: paddingTop })
    
    console.log('设置contentPaddingTop:', paddingTop)
    this.loadConfigs()
  },

  /**
   * 页面显示时刷新数据
   */
  onShow() {
    this.loadConfigs()
  },

  /**
   * 加载配置列表
   */
  loadConfigs() {
    let configs = MCPConfigStorage.getAllConfigs()
    
    // 如果没有配置，添加一些示例数据用于测试
    if (configs.length === 0) {
      console.log('没有找到MCP配置，添加示例数据')
      this.addSampleData()
      configs = MCPConfigStorage.getAllConfigs()
    }
    
    // 为每个配置添加展开状态标记
    const configsWithShowTools = configs.map(config => ({
      ...config,
      showTools: false
    }))
    
    console.log('加载的MCP配置:', configsWithShowTools)
    this.setData({ configs: configsWithShowTools })
    
    // 检查在线状态和工具信息
    this.checkConfigsStatus()
  },

  /**
   * 添加示例数据（用于测试）
   */
  addSampleData() {
    const sampleConfigs = [
      {
        id: MCPConfigStorage.generateConfigId(),
        name: '文件系统 MCP',
        url: 'http://0.0.0.0:3001/api/servers/filesystem/mcp',
        authType: AuthType.NONE,
        authConfig: {},
        isEnabled: true,
        isOnline: false,
        tools: [],
        toolCount: 0,
        createdAt: Date.now() - 86400000, // 1天前
        updatedAt: Date.now()
      }
    ]
    
    sampleConfigs.forEach(config => {
      MCPConfigStorage.saveConfig(config)
    })
  },

  /**
   * 检查配置状态（使用真正的 MCP 服务）
   */
  async checkConfigsStatus() {
    const { configs } = this.data
    
    console.log('开始检查 MCP 配置状态...')
    
    // 检查每个配置的状态
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      
      try {
        console.log(`检查配置 ${config.name} (${config.url})`)
        
        // 检查在线状态
        const isOnline = await MCPServerService.checkServerOnline(config)
        
        // 获取工具列表
        let tools: MCPTool[] = []
        if (isOnline) {
          tools = await MCPServerService.getServerTools(config)
        } else {
          console.log(`MCP 服务器 ${config.name} 离线，跳过工具获取`)
        }
        
        // 保持现有的工具状态
        const toolsWithState = this.mergeToolsWithExistingState(config.tools || [], tools)
        
        // 更新数据
        const updatedConfigs = [...this.data.configs]
        updatedConfigs[i] = {
          ...updatedConfigs[i],
          isOnline,
          tools: toolsWithState,
          toolCount: toolsWithState.length
        }
        
        this.setData({ configs: updatedConfigs })
        
        // 同时更新存储
        MCPConfigStorage.updateConfigOnlineStatus(config.id, isOnline)
        MCPConfigStorage.updateConfigTools(config.id, toolsWithState)
        
        console.log(`配置 ${config.name} 状态更新完成: 在线=${isOnline}, 工具数量=${toolsWithState.length}`)
        
      } catch (error) {
        console.error(`检查配置 ${config.name} 状态失败:`, error)
        
        // 更新为离线状态
        const updatedConfigs = [...this.data.configs]
        updatedConfigs[i] = {
          ...updatedConfigs[i],
          isOnline: false,
          tools: [],
          toolCount: 0
        }
        
        this.setData({ configs: updatedConfigs })
        
        // 更新存储
        MCPConfigStorage.updateConfigOnlineStatus(config.id, false)
        MCPConfigStorage.updateConfigTools(config.id, [])
        
        // 显示用户友好的错误提示
        if (config.url.includes('example.com')) {
          wx.showToast({
            title: `${config.name} 是示例配置，无法连接`,
            icon: 'none',
            duration: 3000
          })
        } else {
          wx.showToast({
            title: `${config.name} 连接失败`,
            icon: 'none',
            duration: 3000
          })
        }
      }
    }
    
    console.log('MCP 配置状态检查完成')
  },

  /**
   * 合并新工具列表与现有状态，保持开启/关闭状态
   */
  mergeToolsWithExistingState(existingTools: MCPTool[], newTools: MCPTool[]): MCPTool[] {
    return newTools.map(newTool => {
      // 查找现有工具，保持其状态
      const existingTool = existingTools.find(tool => tool.name === newTool.name)
      
      return {
        ...newTool,
        isEnabled: existingTool ? existingTool.isEnabled : true // 新工具默认为开启状态
      }
    })
  },

  /**
   * 刷新指定配置的工具列表
   */
  async refreshTools(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    // 设置刷新状态
    this.setData({
      [`refreshing.${id}`]: true
    })

    try {
      const config = this.data.configs.find(c => c.id === id)
      if (!config) return

      // 获取最新工具列表
      const newTools = await MCPServerService.getServerTools(config)
      
      // 保持现有的工具状态
      const toolsWithState = this.mergeToolsWithExistingState(config.tools || [], newTools)
      
      // 更新配置
      const updatedConfigs = this.data.configs.map(c => {
        if (c.id === id) {
          return {
            ...c,
            tools: toolsWithState,
            toolCount: toolsWithState.length
          }
        }
        return c
      })
      
      this.setData({ configs: updatedConfigs })
      
      // 更新存储
      MCPConfigStorage.updateConfigTools(id, toolsWithState)
      
      wx.showToast({
        title: '工具列表已刷新',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('刷新工具列表失败:', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      // 清除刷新状态
      this.setData({
        [`refreshing.${id}`]: false
      })
    }
  },

  /**
   * 查看配置详情
   */
  onViewConfig(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/mcp-detail/mcp-detail?id=${id}`
    })
  },

  /**
   * 编辑配置
   */
  onEditConfig(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/mcp-edit/mcp-edit?id=${id}`
    })
  },

  /**
   * 添加新配置
   */
  onAddConfig() {
    wx.navigateTo({
      url: '/pages/mcp-add/mcp-add'
    })
  },

  /**
   * 切换启用状态
   */
  onToggleEnabled(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    if (!id) {
      wx.showToast({
        title: '配置ID不存在',
        icon: 'error'
      })
      return
    }
    
    const success = MCPConfigStorage.toggleConfigEnabled(id)
    
    if (success) {
      // 重新加载数据
      this.loadConfigs()
      
      wx.showToast({
        title: '状态已更新',
        icon: 'success',
        duration: 1500
      })
    } else {
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 切换工具列表显示
   */
  onToggleTools(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    const { configs } = this.data
    
    const updatedConfigs = configs.map(config => {
      if (config.id === id) {
        return { ...config, showTools: !config.showTools }
      }
      return config
    })
    
    this.setData({ configs: updatedConfigs })
  },

  /**
   * 显示工具详情对话框
   */
  onShowToolDetail(e: WxEvent) {
    const { configId, toolName } = e.currentTarget.dataset
    if (!configId || !toolName) return
    const targetConfig = this.data.configs.find(c => c.id === configId)
    const targetTool = targetConfig?.tools?.find(t => t.name === toolName) || null
    this.setData({
      toolDialogVisible: true,
      selectedTool: targetTool
    })
  },

  /**
   * 关闭工具详情对话框
   */
  onCloseToolDialog() {
    this.setData({
      toolDialogVisible: false,
      selectedTool: null
    })
  },

  /**
   * 切换工具启用状态
   */
  onToggleTool(e: WxEvent) {
    const { configId, toolName } = e.currentTarget.dataset
    const { configs } = this.data
    
    if (!configId || !toolName) {
      wx.showToast({
        title: '参数不完整',
        icon: 'error'
      })
      return
    }
    
    // 检查 MCP 服务器是否启用
    const targetConfig = configs.find(config => config.id === configId)
    if (!targetConfig?.isEnabled) {
      wx.showToast({
        title: 'MCP 服务器未启用',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    try {
      this.toggleToolById(configId, toolName)
    } catch (error) {
      console.error('切换工具状态失败:', error)
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 按配置与工具名切换工具启用状态
   */
  toggleToolById(configId: string, toolName: string) {
    const { configs } = this.data
    const updatedConfigs = configs.map(config => {
      if (config.id === configId) {
        const updatedTools = config.tools?.map(tool => {
          if (tool.name === toolName) {
            const currentEnabled = tool.isEnabled !== false
            const newIsEnabled = !currentEnabled
            console.log(`切换工具 ${toolName} 状态: ${currentEnabled} -> ${newIsEnabled}`)
            return { ...tool, isEnabled: newIsEnabled }
          }
          return tool
        })
        return { ...config, tools: updatedTools }
      }
      return config
    })
    
    this.setData({ configs: updatedConfigs })
    const targetConfig = updatedConfigs.find(c => c.id === configId)
    if (targetConfig) {
      MCPConfigStorage.updateConfigTools(configId, targetConfig.tools || [])
    }
    wx.showToast({
      title: '工具状态已更新',
      icon: 'success',
      duration: 1500
    })
  },

  /**
   * 验证 MCP 服务器配置
   */
  async validateMCPConfig(url: string, authType: AuthType, authConfig: any): Promise<{ isValid: boolean; message: string }> {
    try {
      console.log(`验证 MCP 服务器配置: ${url}`)
      
      // 创建临时配置进行测试
      const tempConfig: MCPConfig = {
        id: 'temp',
        name: '临时配置',
        url,
        authType,
        authConfig,
        isEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      // 测试连接
      const isOnline = await MCPServerService.checkServerOnline(tempConfig)
      
      if (!isOnline) {
        return {
          isValid: false,
          message: '无法连接到 MCP 服务器，请检查地址和认证信息'
        }
      }
      
      // 测试获取工具列表
      const tools = await MCPServerService.getServerTools(tempConfig)
      
      if (tools.length === 0) {
        return {
          isValid: false,
          message: 'MCP 服务器连接成功，但未发现可用工具'
        }
      }
      
      return {
        isValid: true,
        message: `验证成功！发现 ${tools.length} 个可用工具`
      }
      
    } catch (error: any) {
      console.error('验证 MCP 配置失败:', error)
      
      let message = '验证失败'
      if (error.message?.includes('timeout')) {
        message = '连接超时，请检查服务器地址是否正确'
      } else if (error.message?.includes('fail')) {
        message = '网络请求失败，请检查网络连接'
      } else if (error.message?.includes('无效的 MCP 服务器 URL')) {
        message = '无效的服务器地址，请使用 http:// 或 https:// 开头'
      } else {
        message = error.message || '未知错误'
      }
      
      return {
        isValid: false,
        message
      }
    }
  }
})

// 定义事件类型
interface WxEvent {
  currentTarget: {
    dataset: {
      id?: string
      configId?: string
      toolName?: string
      [key: string]: any
    }
  }
  detail?: any
}
