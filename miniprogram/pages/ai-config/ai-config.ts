// ai-config.ts
import { AIConfig, AI_PROVIDERS, AIProvider } from '../../lib/types/ai-config'
import { AIConfigStorage } from '../../lib/storage/ai-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    configId: '',
    form: {
      name: '',
      provider: '',
      apiKey: '',
      apiHost: '',
      model: '',
      customModel: ''
    },
    errors: {
      name: '',
      provider: '',
      apiKey: '',
      apiHost: '',
      model: '',
      customModel: ''
    },
    providers: AI_PROVIDERS,
    selectedProvider: null as AIProvider | null,
    availableModels: [] as string[],
    showCustomModel: false,
    canSave: false,
    contentPaddingTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight()
    this.setData({ contentPaddingTop: paddingTop })
    
    const { id } = options
    if (id) {
      this.setData({ isEdit: true, configId: id })
      this.loadConfig(id)
    } else {
      this.setData({ isEdit: false })
    }
  },

  /**
   * 加载配置数据（编辑模式）
   */
  loadConfig(configId: string) {
    const config = AIConfigStorage.getConfigById(configId)
    if (config) {
      this.setData({
        form: {
          name: config.name,
          provider: config.provider,
          apiKey: config.apiKey,
          apiHost: config.apiHost,
          model: config.model,
          customModel: ''
        }
      })
      
      this.updateProviderSelection(config.provider)
      this.validateForm()
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
      [`errors.${field}`]: ''
    })
    
    this.validateForm()
  },

  /**
   * 服务提供商选择变化
   */
  onProviderChange(e: any) {
    const { value } = e.detail
    this.setData({
      'form.provider': value,
      'errors.provider': ''
    })
    
    this.updateProviderSelection(value)
    this.validateForm()
  },

  /**
   * 更新服务提供商相关信息
   */
  updateProviderSelection(providerId: string) {
    const provider = AI_PROVIDERS.find(p => p.id === providerId)
    if (provider) {
      const models = [...provider.models]
      if (provider.id !== 'custom') {
        models.push('自定义')
      }
      
      this.setData({
        selectedProvider: provider,
        availableModels: models,
        'form.apiHost': provider.defaultHost,
        'form.model': '',
        showCustomModel: false
      })
    }
  },

  /**
   * 模型选择变化
   */
  onModelChange(e: any) {
    const { value } = e.detail
    const showCustomModel = value === '自定义'
    
    this.setData({
      'form.model': showCustomModel ? '' : value,
      'errors.model': '',
      showCustomModel,
      'form.customModel': '',
      'errors.customModel': ''
    })
    
    this.validateForm()
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { form, showCustomModel } = this.data
    const errors = {
      name: '',
      provider: '',
      apiKey: '',
      apiHost: '',
      model: '',
      customModel: ''
    }

    let isValid = true

    if (!form.name.trim()) {
      errors.name = '请输入配置名称'
      isValid = false
    }

    if (!form.provider.trim()) {
      errors.provider = '请选择服务提供商'
      isValid = false
    }

    if (!form.apiKey.trim()) {
      errors.apiKey = '请输入API密钥'
      isValid = false
    }

    if (!form.apiHost.trim()) {
      errors.apiHost = '请输入API地址'
      isValid = false
    }

    if (showCustomModel) {
      if (!form.customModel.trim()) {
        errors.customModel = '请输入自定义模型名称'
        isValid = false
      }
    } else if (!form.model.trim()) {
      errors.model = '请选择模型'
      isValid = false
    }

    this.setData({
      errors,
      canSave: isValid
    })
  },

  /**
   * 保存配置
   */
  onSave() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      })
      return
    }

    const { form, isEdit, configId, showCustomModel } = this.data
    const model = showCustomModel ? form.customModel : form.model

    const config: AIConfig = {
      id: isEdit ? configId : AIConfigStorage.generateConfigId(),
      name: form.name.trim(),
      provider: form.provider,
      apiKey: form.apiKey.trim(),
      apiHost: form.apiHost.trim(),
      model: model.trim(),
      isActive: false,
      createdAt: isEdit ? 0 : Date.now(), // 编辑时保持原创建时间
      updatedAt: Date.now()
    }

    const success = AIConfigStorage.saveConfig(config)
    if (success) {
      wx.showToast({
        title: isEdit ? '保存成功' : '创建成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: isEdit ? '保存失败' : '创建失败',
        icon: 'error'
      })
    }
  },

  /**
   * 取消操作
   */
  onCancel() {
    wx.navigateBack()
  }
})
