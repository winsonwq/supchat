// mcp-list.ts
import { MCPConfig, AuthType } from '../../lib/types/mcp-config'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'

interface ConfigWithShowTools extends MCPConfig {
  showTools?: boolean
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configs: [] as ConfigWithShowTools[],
    contentPaddingTop: 0
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
    
    // 检查在线状态和工具信息（模拟异步操作）
    this.checkConfigsStatus()
  },

  /**
   * 添加示例数据（用于测试）
   */
  addSampleData() {
    const sampleConfigs = [
      {
        id: MCPConfigStorage.generateConfigId(),
        name: '天气服务 MCP',
        url: 'https://weather.example.com/mcp',
        authType: AuthType.BEARER_TOKEN,
        authConfig: { token: 'sample_token_123' },
        isEnabled: true,
        isOnline: false,
        tools: [],
        toolCount: 0,
        createdAt: Date.now() - 86400000, // 1天前
        updatedAt: Date.now()
      },
      {
        id: MCPConfigStorage.generateConfigId(),
        name: '文件管理 MCP',
        url: 'https://files.example.com/mcp',
        authType: AuthType.API_KEY,
        authConfig: { apiKey: 'sample_api_key_456' },
        isEnabled: false,
        isOnline: false,
        tools: [],
        toolCount: 0,
        createdAt: Date.now() - 172800000, // 2天前
        updatedAt: Date.now()
      }
    ]
    
    sampleConfigs.forEach(config => {
      MCPConfigStorage.saveConfig(config)
    })
  },

  /**
   * 检查配置状态（模拟检查在线状态和获取工具信息）
   */
  async checkConfigsStatus() {
    const { configs } = this.data
    
    // 模拟检查每个配置的状态
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      
      // 模拟检查在线状态
      const isOnline = await this.checkServerOnline(config.url)
      
      // 模拟获取工具列表
      const tools = await this.fetchServerTools(config)
      
      // 更新数据
      const updatedConfigs = [...this.data.configs]
      updatedConfigs[i] = {
        ...updatedConfigs[i],
        isOnline,
        tools,
        toolCount: tools.length
      }
      
      this.setData({ configs: updatedConfigs })
      
      // 同时更新存储
      MCPConfigStorage.updateConfigOnlineStatus(config.id, isOnline)
      MCPConfigStorage.updateConfigTools(config.id, tools)
    }
  },

  /**
   * 模拟检查服务器在线状态
   */
  async checkServerOnline(url: string): Promise<boolean> {
    try {
      // 这里应该实际检查服务器状态，现在模拟随机结果
      await new Promise(resolve => setTimeout(resolve, 500))
      return Math.random() > 0.3 // 70% 概率在线
    } catch {
      return false
    }
  },

  /**
   * 模拟获取服务器工具列表
   */
  async fetchServerTools(config: MCPConfig): Promise<any[]> {
    try {
      // 这里应该实际请求 MCP Server 获取工具列表，现在返回模拟数据
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockTools = [
        {
          name: 'get_weather',
          description: '获取指定城市的天气信息',
          chineseName: '天气查询'
        },
        {
          name: 'send_email',
          description: '发送邮件到指定邮箱',
          chineseName: '发送邮件'
        },
        {
          name: 'file_search',
          description: '在文件系统中搜索文件',
          chineseName: '文件搜索'
        }
      ]
      
      // 随机返回一些工具
      const toolCount = Math.floor(Math.random() * mockTools.length) + 1
      return mockTools.slice(0, toolCount)
    } catch {
      return []
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
      const updatedConfigs = configs.map(config => {
        if (config.id === configId) {
          const updatedTools = config.tools?.map(tool => {
            if (tool.name === toolName) {
              // 如果 isEnabled 为 undefined 或 true，则设为 false；如果为 false，则设为 true
              const currentEnabled = tool.isEnabled !== false // 默认为 true
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
      
      // 这里可以添加保存到存储的逻辑
      // MCPConfigStorage.updateConfigTools(configId, updatedTools)
      
      wx.showToast({
        title: '工具状态已更新',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('切换工具状态失败:', error)
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 工具项点击事件（阻止冒泡）
   */
  onToolItemTap() {
    // 空方法，仅用于阻止事件冒泡
    // 防止点击工具项时触发父级的 onEditConfig 事件
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
