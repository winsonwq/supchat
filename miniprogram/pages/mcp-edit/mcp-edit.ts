// mcp-edit.ts
import {
  MCPConfig,
  AuthType,
  authTypeOptions,
} from '../../lib/types/mcp-config'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import getSafeArea from '../../lib/utils/safe-area'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configId: '',
    isEdit: false,
    form: {
      name: '',
      url: '',
      authType: AuthType.BEARER_TOKEN,
      authConfig: {
        token: '',
        username: '',
        password: '',
        apiKey: '',
      },
    },
    errors: {
      name: '',
      url: '',
      authType: '',
      authToken: '',
      authUsername: '',
      authPassword: '',
      authApiKey: '',
    },
    authTypeOptions: authTypeOptions,
    canSave: false,
    contentPaddingTop: 0,
    bottomSafeHeight: 0,
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
      bottomSafeHeight: bottomSafeHeight,
    })

    const { id } = options
    if (id) {
      this.setData({
        isEdit: true,
        configId: id,
      })
      this.loadConfig(id)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error',
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
    const config = MCPConfigStorage.getConfigById(configId)
    if (config) {
      this.setData({
        form: {
          name: config.name,
          url: config.url,
          authType: config.authType,
          authConfig: {
            token: config.authConfig.token || '',
            username: config.authConfig.username || '',
            password: config.authConfig.password || '',
            apiKey: config.authConfig.apiKey || '',
          },
        },
      })
      this.validateForm()
    } else {
      wx.showToast({
        title: '配置不存在',
        icon: 'error',
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 输入框变化处理
   */
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail

    this.setData({
      [`form.${field}`]: value,
      [`errors.${field}`]: '',
    })

    this.validateForm()
  },

  /**
   * 认证方式变化处理
   */
  onAuthTypeChange(e: any) {
    const { value } = e.detail

    this.setData({
      'form.authType': value,
      'errors.authType': '',
      // 清空认证配置
      'form.authConfig': {
        token: '',
        username: '',
        password: '',
        apiKey: '',
      },
      // 清空认证相关错误
      'errors.authToken': '',
      'errors.authUsername': '',
      'errors.authPassword': '',
      'errors.authApiKey': '',
    })

    this.validateForm()
  },

  /**
   * 认证信息输入变化处理
   */
  onAuthInputChange(e: any) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail

    this.setData({
      [`form.authConfig.${field}`]: value,
      [`errors.auth${field.charAt(0).toUpperCase() + field.slice(1)}`]: '',
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
      url: '',
      authType: '',
      authToken: '',
      authUsername: '',
      authPassword: '',
      authApiKey: '',
    }

    let isValid = true

    // 验证基本信息
    if (!form.name.trim()) {
      errors.name = '请输入配置名称'
      isValid = false
    }

    if (!form.url.trim()) {
      errors.url = '请输入服务器地址'
      isValid = false
    } else if (!this.isValidUrl(form.url)) {
      errors.url = '请输入有效的 URL 地址'
      isValid = false
    }

    if (!form.authType) {
      errors.authType = '请选择认证方式'
      isValid = false
    }

    // 验证认证配置
    if (form.authType === AuthType.BEARER_TOKEN) {
      if (!form.authConfig.token?.trim()) {
        errors.authToken = '请输入 Bearer Token'
        isValid = false
      }
    } else if (form.authType === AuthType.BASIC_AUTH) {
      if (!form.authConfig.username?.trim()) {
        errors.authUsername = '请输入用户名'
        isValid = false
      }
      if (!form.authConfig.password?.trim()) {
        errors.authPassword = '请输入密码'
        isValid = false
      }
    } else if (form.authType === AuthType.API_KEY) {
      if (!form.authConfig.apiKey?.trim()) {
        errors.authApiKey = '请输入 API Key'
        isValid = false
      }
    }

    this.setData({
      errors,
      canSave: isValid,
    })
  },

  /**
   * 验证 URL 格式
   */
  isValidUrl(url: string): boolean {
    // 移除前后空格
    url = url.trim()
    try {
      // 使用正则表达式简单校验 URL 格式，兼容小程序环境
      const urlPattern = /^(https?):\/\/([^\s/?#]+)([^\s]*)$/i
      const match = url.match(urlPattern)
      if (!match) {
        return false
      }
      // 只检查基本协议
      if (!['http', 'https'].includes(match[1].toLowerCase())) {
        return false
      }
      // 检查主机名是否存在
      const hostname = match[2]
      if (!hostname) {
        return false
      }
      return true
    } catch {
      return false
    }
  },

  /**
   * 保存配置
   */
  onSave() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none',
      })
      return
    }

    const { form, configId } = this.data

    // 获取原有配置
    const originalConfig = MCPConfigStorage.getConfigById(configId)
    if (!originalConfig) {
      wx.showToast({
        title: '配置不存在',
        icon: 'error',
      })
      return
    }

    const config: MCPConfig = {
      id: configId,
      name: form.name.trim(),
      url: form.url.trim(),
      authType: form.authType,
      authConfig: {
        token: form.authConfig.token?.trim(),
        username: form.authConfig.username?.trim(),
        password: form.authConfig.password?.trim(),
        apiKey: form.authConfig.apiKey?.trim(),
      },
      isEnabled: originalConfig.isEnabled,
      isOnline: originalConfig.isOnline,
      tools: originalConfig.tools,
      toolCount: originalConfig.toolCount,
      createdAt: originalConfig.createdAt,
      updatedAt: Date.now(),
    }

    const success = MCPConfigStorage.saveConfig(config)
    if (success) {
      wx.showToast({
        title: '保存成功',
        icon: 'success',
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error',
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
              icon: 'success',
            })

            setTimeout(() => {
              // 返回到列表页面
              wx.reLaunch({
                url: '/pages/mcp-list/mcp-list',
              })
            }, 1500)
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error',
            })
          }
        }
      },
    })
  },
})
