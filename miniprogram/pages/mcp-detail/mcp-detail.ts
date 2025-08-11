// mcp-detail.ts
import { MCPConfig, AuthType, authTypeOptions } from '../../lib/types/mcp-config'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configId: '',
    config: null as MCPConfig | null,
    authTypeLabel: '',
    contentPaddingTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    const paddingTop = getNavigationHeight()
    this.setData({ contentPaddingTop: paddingTop })
    
    const { id } = options
    if (id) {
      this.setData({ configId: id })
      this.loadConfig()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 页面显示时刷新数据
   */
  onShow() {
    if (this.data.configId) {
      this.loadConfig()
    }
  },

  /**
   * 加载配置详情
   */
  loadConfig() {
    const config = MCPConfigStorage.getConfigById(this.data.configId)
    
    if (!config) {
      wx.showToast({
        title: '配置不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 获取认证方式标签
    const authTypeLabel = authTypeOptions.find(
      option => option.value === config.authType
    )?.label || '未知'

    // 处理工具参数结构显示
    const processedConfig = {
      ...config,
      tools: config.tools?.map(tool => ({
        ...tool,
        inputSchemaText: tool.inputSchema 
          ? JSON.stringify(tool.inputSchema, null, 2)
          : undefined
      }))
    }

    this.setData({ 
      config: processedConfig,
      authTypeLabel
    })

    // 刷新状态和工具信息
    this.refreshStatus()
    this.refreshTools()
  },

  /**
   * 刷新在线状态
   */
  async refreshStatus() {
    if (!this.data.config) return

    const isOnline = await this.checkServerOnline(this.data.config.url)
    
    // 更新本地数据
    this.setData({
      'config.isOnline': isOnline
    })

    // 更新存储
    MCPConfigStorage.updateConfigOnlineStatus(this.data.configId, isOnline)
  },

  /**
   * 刷新工具列表
   */
  async refreshTools() {
    if (!this.data.config) return

    wx.showLoading({ title: '刷新工具中...' })

    try {
      const tools = await this.fetchServerTools(this.data.config)
      
      // 处理工具参数结构显示
      const processedTools = tools.map(tool => ({
        ...tool,
        inputSchemaText: tool.inputSchema 
          ? JSON.stringify(tool.inputSchema, null, 2)
          : undefined
      }))

      // 更新本地数据
      this.setData({
        'config.tools': processedTools,
        'config.toolCount': tools.length
      })

      // 更新存储
      MCPConfigStorage.updateConfigTools(this.data.configId, tools)

      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 模拟检查服务器在线状态
   */
  async checkServerOnline(url: string): Promise<boolean> {
    try {
      // 这里应该实际检查服务器状态
      await new Promise(resolve => setTimeout(resolve, 1000))
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
      // 这里应该实际请求 MCP Server 获取工具列表
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockTools = [
        {
          name: 'get_weather',
          description: '获取指定城市的天气信息，支持全球主要城市',
          chineseName: '天气查询',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: '城市名称'
              },
              country: {
                type: 'string',
                description: '国家代码，可选'
              }
            },
            required: ['city']
          }
        },
        {
          name: 'send_email',
          description: '发送邮件到指定邮箱地址',
          chineseName: '发送邮件',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: '收件人邮箱'
              },
              subject: {
                type: 'string',
                description: '邮件主题'
              },
              content: {
                type: 'string',
                description: '邮件内容'
              }
            },
            required: ['to', 'subject', 'content']
          }
        },
        {
          name: 'file_search',
          description: '在指定目录中搜索文件',
          chineseName: '文件搜索',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: '搜索路径'
              },
              pattern: {
                type: 'string',
                description: '文件名模式'
              },
              recursive: {
                type: 'boolean',
                description: '是否递归搜索'
              }
            },
            required: ['path', 'pattern']
          }
        }
      ]
      
      // 随机返回一些工具
      const toolCount = Math.floor(Math.random() * mockTools.length) + 1
      return mockTools.slice(0, toolCount)
    } catch {
      throw new Error('获取工具失败')
    }
  },

  /**
   * 编辑配置
   */
  onEditConfig() {
    wx.navigateTo({
      url: `/pages/mcp-edit/mcp-edit?id=${this.data.configId}`
    })
  },

  /**
   * 切换启用状态
   */
  onToggleEnabled() {
    const success = MCPConfigStorage.toggleConfigEnabled(this.data.configId)
    
    if (success) {
      // 重新加载数据
      this.loadConfig()
      
      wx.showToast({
        title: '状态已更新',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 刷新状态按钮
   */
  onRefreshStatus() {
    this.refreshStatus()
  },

  /**
   * 刷新工具按钮
   */
  onRefreshTools() {
    this.refreshTools()
  },

  /**
   * 测试连接
   */
  async onTestConnection() {
    if (!this.data.config) return

    wx.showLoading({ title: '测试连接中...' })

    try {
      const isOnline = await this.checkServerOnline(this.data.config.url)
      
      wx.hideLoading()
      
      if (isOnline) {
        wx.showModal({
          title: '连接测试',
          content: '连接成功！服务器响应正常。',
          showCancel: false,
          confirmText: '确定'
        })
      } else {
        wx.showModal({
          title: '连接测试',
          content: '连接失败！请检查服务器地址和网络连接。',
          showCancel: false,
          confirmText: '确定'
        })
      }
      
      // 更新在线状态
      this.setData({
        'config.isOnline': isOnline
      })
      MCPConfigStorage.updateConfigOnlineStatus(this.data.configId, isOnline)
      
    } catch (error) {
      wx.hideLoading()
      wx.showModal({
        title: '连接测试',
        content: '测试失败，请稍后重试。',
        showCancel: false,
        confirmText: '确定'
      })
    }
  },

  /**
   * 删除配置
   */
  onDeleteConfig() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个 MCP 配置吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) {
          const success = MCPConfigStorage.deleteConfig(this.data.configId)
          
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  }
})
