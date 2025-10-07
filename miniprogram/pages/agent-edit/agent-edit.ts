// agent-edit.ts
import { AgentDefinition, AgentInput, MCPConfig } from '../../lib/types/agent'
import { AgentConfigStorage } from '../../lib/storage/agent-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import getSafeArea from '../../lib/utils/safe-area'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configId: '',
    form: {
      name: '',
      description: '',
      systemPrompt: '',
      mcpServersJson: ''
    },
    errors: {
      name: '',
      description: '',
      systemPrompt: '',
      mcpServersJson: ''
    },
    canSave: false,
    contentPaddingTop: 0,
    bottomSafeHeight: 0,
    configInfo: {
      createdAtText: '',
      updatedAtText: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight()
    
    // 计算底部安全区域高度
    const safeArea = getSafeArea()
    const bottomSafeHeight = safeArea.safeAreaBottom
    
    this.setData({ 
      contentPaddingTop: paddingTop,
      bottomSafeHeight: bottomSafeHeight
    })
    
    const { id } = options
    if (id) {
      this.setData({ configId: id })
      this.loadConfig(id)
    } else {
      wx.showToast({
        title: '配置ID不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 加载配置数据
   */
  loadConfig(configId: string) {
    const config = AgentConfigStorage.getConfigById(configId)
    if (config) {
      // 将MCP服务器配置转换为JSON字符串
      const mcpServersJson = JSON.stringify(config.mcpServers, null, 2)
      
      this.setData({
        form: {
          name: config.name,
          description: config.description || '',
          systemPrompt: config.systemPrompt,
          mcpServersJson: mcpServersJson
        },
        configInfo: {
          createdAtText: this.formatDate(config.createdAt || Date.now()),
          updatedAtText: this.formatDate(config.updatedAt || Date.now())
        }
      })
      this.validateForm()
    } else {
      wx.showToast({
        title: '配置不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 格式化日期
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleString()
  },

  /**
   * 输入框变化处理
   */
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`form.${field}`]: value,
      [`errors.${field}`]: ''
    })
    
    this.validateForm()
  },

  /**
   * 文本域变化处理
   */
  onTextareaChange(e: any) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail

    this.setData({
      [`form.${field}`]: value,
      [`errors.${field}`]: ''
    })
    
    this.validateForm()
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { form } = this.data
    const errors = {
      name: '',
      description: '',
      systemPrompt: '',
      mcpServersJson: ''
    }

    let isValid = true

    // 验证基本信息
    if (!form.name.trim()) {
      errors.name = '请输入配置名称'
      isValid = false
    }

    if (!form.systemPrompt.trim()) {
      errors.systemPrompt = '请输入系统提示词'
      isValid = false
    }

    // 验证MCP服务器配置JSON
    if (form.mcpServersJson.trim()) {
      try {
        const mcpServers = JSON.parse(form.mcpServersJson)
        if (!Array.isArray(mcpServers)) {
          errors.mcpServersJson = 'MCP服务器配置必须是数组格式'
          isValid = false
        } else {
          // 验证每个服务器配置的基本字段
          for (let i = 0; i < mcpServers.length; i++) {
            const server = mcpServers[i]
            if (!server.name || !server.url) {
              errors.mcpServersJson = `第${i + 1}个服务器配置缺少必要字段（name, url）`
              isValid = false
              break
            }
          }
        }
      } catch (error) {
        errors.mcpServersJson = 'JSON格式不正确，请检查语法'
        isValid = false
      }
    }

    this.setData({
      errors,
      canSave: isValid
    })
  },

  /**
   * 解析MCP服务器配置
   */
  parseMCPServers(): MCPConfig[] {
    const { form } = this.data
    
    if (!form.mcpServersJson.trim()) {
      return []
    }

    try {
      const mcpServers = JSON.parse(form.mcpServersJson)
      return mcpServers.map((server: any, index: number) => ({
        id: server.id || `server_${index}`,
        name: server.name || `服务器${index + 1}`,
        url: server.url || '',
        authType: server.authType || 'none',
        authConfig: server.authConfig || {},
        isEnabled: server.isEnabled !== false,
        tools: server.tools || [],
        toolCount: server.toolCount || 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }))
    } catch (error) {
      console.error('解析MCP服务器配置失败:', error)
      return []
    }
  },

  /**
   * 测试配置
   */
  onTestConfig() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善配置信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '测试配置中...' })

    try {
      // 解析MCP服务器配置
      const mcpServers = this.parseMCPServers()
      
      wx.hideLoading()
      
      wx.showModal({
        title: '配置测试',
        content: `配置验证成功！\n\n配置名称：${this.data.form.name}\nMCP服务器：${mcpServers.length}个\n系统提示词长度：${this.data.form.systemPrompt.length}字符`,
        showCancel: false,
        confirmText: '确定'
      })
    } catch (error) {
      wx.hideLoading()
      wx.showModal({
        title: '配置测试',
        content: '配置验证失败，请检查JSON格式是否正确。',
        showCancel: false,
        confirmText: '确定'
      })
    }
  },

  /**
   * 保存配置
   */
  async onSave() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      })
      return
    }

    const { form, configId } = this.data

    // 检查配置名称是否重复（排除当前配置）
    const existingConfigs = AgentConfigStorage.getAllConfigs()
    const nameExists = existingConfigs.some(config => 
      config.id !== configId && 
      config.name.toLowerCase() === form.name.trim().toLowerCase()
    )

    if (nameExists) {
      this.setData({
        'errors.name': '配置名称已存在，请使用其他名称'
      })
      return
    }

    wx.showLoading({ title: '保存配置中...' })

    try {
      // 解析MCP服务器配置
      const mcpServers = this.parseMCPServers()

      // 创建Agent输入数据
      const agentInput: AgentInput = {
        name: form.name.trim(),
        description: form.description.trim(),
        systemPrompt: form.systemPrompt.trim(),
        mcpServers: mcpServers
      }

      // 更新配置
      const config = AgentConfigStorage.updateConfigFromInput(configId, agentInput)
      if (!config) {
        throw new Error('配置不存在')
      }
      
      const success = AgentConfigStorage.saveConfig(config)
      
      wx.hideLoading()
      
      if (success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        // 延迟后返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('保存配置失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }
})
