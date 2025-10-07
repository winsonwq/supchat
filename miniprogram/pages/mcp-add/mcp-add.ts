// mcp-add.ts
import { MCPConfig, AuthType, authTypeOptions } from '../../lib/types/mcp-config'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import getSafeArea from '../../lib/utils/safe-area'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    form: {
      name: '',
      url: '',
      authType: AuthType.BEARER_TOKEN,
      authConfig: {
        token: '',
        username: '',
        password: '',
        apiKey: ''
      },
      isEnabled: true
    },
    errors: {
      name: '',
      url: '',
      authType: '',
      authToken: '',
      authUsername: '',
      authPassword: '',
      authApiKey: ''
    },
    authTypeOptions: authTypeOptions,
    canSave: false,
    contentPaddingTop: 0,
    bottomSafeHeight: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight()
    
    // 计算底部安全区域高度
    const safeArea = getSafeArea()
    const bottomSafeHeight = safeArea.safeAreaBottom
    
    this.setData({ 
      contentPaddingTop: paddingTop,
      bottomSafeHeight: bottomSafeHeight
    })
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
        apiKey: ''
      },
      // 清空认证相关错误
      'errors.authToken': '',
      'errors.authUsername': '',
      'errors.authPassword': '',
      'errors.authApiKey': ''
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
      [`errors.auth${field.charAt(0).toUpperCase() + field.slice(1)}`]: ''
    })
    
    this.validateForm()
  },

  /**
   * 开关变化处理
   */
  onSwitchChange(e: any) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`form.${field}`]: value
    })
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
      authApiKey: ''
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
      canSave: isValid
    })
  },

  /**
   * 验证 URL 格式
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch(e) {
      return false
    }
  },

  /**
   * 测试连接
   */
  async onTestConnection() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善配置信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '测试连接中...' })

    try {
      // 模拟测试连接
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 随机成功/失败
      const isSuccess = Math.random() > 0.3
      
      wx.hideLoading()
      
      if (isSuccess) {
        wx.showModal({
          title: '连接测试',
          content: '连接成功！服务器响应正常，可以正常创建配置。',
          showCancel: false,
          confirmText: '确定'
        })
      } else {
        wx.showModal({
          title: '连接测试',
          content: '连接失败！请检查服务器地址和认证配置。',
          showCancel: false,
          confirmText: '确定'
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showModal({
        title: '连接测试',
        content: '测试失败，请检查网络连接。',
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

    const { form } = this.data

    // 检查配置名称是否重复
    const existingConfigs = MCPConfigStorage.getAllConfigs()
    const nameExists = existingConfigs.some(config => 
      config.name.toLowerCase() === form.name.trim().toLowerCase()
    )

    if (nameExists) {
      this.setData({
        'errors.name': '配置名称已存在，请使用其他名称'
      })
      return
    }

    wx.showLoading({ title: '创建配置中...' })

    try {
      const config: MCPConfig = {
        id: MCPConfigStorage.generateConfigId(),
        name: form.name.trim(),
        url: form.url.trim(),
        authType: form.authType,
        authConfig: {
          token: form.authConfig.token?.trim(),
          username: form.authConfig.username?.trim(),
          password: form.authConfig.password?.trim(),
          apiKey: form.authConfig.apiKey?.trim()
        },
        isEnabled: form.isEnabled,
        isOnline: false,
        tools: [],
        toolCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const success = MCPConfigStorage.saveConfig(config)
      
      wx.hideLoading()
      
      if (success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        })
        
        // 延迟后跳转到配置详情页面
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/mcp-detail/mcp-detail?id=${config.id}`
          })
        }, 1500)
      } else {
        wx.showToast({
          title: '创建失败',
          icon: 'error'
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '创建失败',
        icon: 'error'
      })
    }
  }
})
