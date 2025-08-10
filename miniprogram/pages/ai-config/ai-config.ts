// ai-config.ts
import { AIConfig } from '../../lib/types/ai-config'
import { AIConfigStorage } from '../../lib/storage/ai-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'
import getSafeArea from '../../lib/utils/safe-area'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    configId: '',
    form: {
      name: '',
      apiKey: '',
      apiHost: '',
      model: ''
    },
    errors: {
      name: '',
      apiKey: '',
      apiHost: '',
      model: ''
    },
    canSave: false,
    contentPaddingTop: 0,
    bottomSafeHeight: 0
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
          apiKey: config.apiKey,
          apiHost: config.apiHost,
          model: config.model
        }
      })
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
   * 表单验证
   */
  validateForm() {
    const { form } = this.data
    const errors = {
      name: '',
      apiKey: '',
      apiHost: '',
      model: ''
    }

    let isValid = true

    if (!form.name.trim()) {
      errors.name = '请输入配置名称'
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

    if (!form.model.trim()) {
      errors.model = '请输入模型名称'
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

    const { form, isEdit, configId } = this.data

    let config: AIConfig
    
    if (isEdit) {
      // 编辑模式：保持原有配置的创建时间和激活状态
      const originalConfig = AIConfigStorage.getConfigById(configId)
      config = {
        id: configId,
        name: form.name.trim(),
        apiKey: form.apiKey.trim(),
        apiHost: form.apiHost.trim(),
        model: form.model.trim(),
        isActive: originalConfig ? originalConfig.isActive : false,
        createdAt: originalConfig ? originalConfig.createdAt : Date.now(),
        updatedAt: Date.now()
      }
    } else {
      // 创建模式：新配置默认不激活
      config = {
        id: AIConfigStorage.generateConfigId(),
        name: form.name.trim(),
        apiKey: form.apiKey.trim(),
        apiHost: form.apiHost.trim(),
        model: form.model.trim(),
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
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




})
