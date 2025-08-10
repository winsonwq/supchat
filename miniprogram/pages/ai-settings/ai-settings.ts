// ai-settings.ts
import { AIConfig } from '../../lib/types/ai-config'
import { AIConfigStorage } from '../../lib/storage/ai-config-storage'
import { refreshEnvConfig } from '../../lib/config/env'
import { getNavigationHeight } from '../../lib/utils/navigation-height'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configs: [] as AIConfig[],
    activeConfig: null as AIConfig | null,
    contentPaddingTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight() + 16 // 16px = 32rpx
    this.setData({ contentPaddingTop: paddingTop })
    
    this.loadConfigs()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadConfigs()
  },

  /**
   * 加载配置列表
   */
  loadConfigs() {
    const configs = AIConfigStorage.getAllConfigs()
    const activeConfig = AIConfigStorage.getActiveConfig()
    
    this.setData({
      configs,
      activeConfig
    })
  },

  /**
   * 添加新配置
   */
  onAddConfig() {
    wx.navigateTo({
      url: '/pages/ai-config/ai-config'
    })
  },

  /**
   * 编辑配置
   */
  onEditConfig(e: any) {
    const configId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/ai-config/ai-config?id=${configId}`
    })
  },

  /**
   * 选择配置作为激活配置
   */
  onSelectConfig(e: any) {
    const configId = e.currentTarget.dataset.id
    const config = this.data.configs.find(c => c.id === configId)
    
    if (!config) return

    // 如果当前配置已经是激活状态，则不做任何操作
    if (config.isActive) {
      return
    }

    wx.showModal({
      title: '确认激活',
      content: `是否将 "${config.name}" 设为当前激活的AI配置？`,
      success: (res) => {
        if (res.confirm) {
          const success = AIConfigStorage.setActiveConfig(configId)
          if (success) {
            // 刷新环境配置，使新的AI设置立即生效
            refreshEnvConfig()
            wx.showToast({
              title: '设置成功',
              icon: 'success'
            })
            this.loadConfigs()
          } else {
            wx.showToast({
              title: '设置失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  /**
   * 删除配置
   */
  onDeleteConfig(e: any) {
    const configId = e.currentTarget.dataset.id
    const config = this.data.configs.find(c => c.id === configId)
    
    if (!config) {
      wx.showToast({
        title: '配置不存在',
        icon: 'error'
      })
      return
    }

    // 如果要删除的是当前激活的配置，给出更明确的提示
    const warningContent = config.isActive 
      ? `"${config.name}" 是当前使用的配置，删除后将无激活配置。确定要删除吗？`
      : `是否删除配置 "${config.name}"？删除后无法恢复。`

    wx.showModal({
      title: '确认删除',
      content: warningContent,
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          const success = AIConfigStorage.deleteConfig(configId)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            // 如果删除的是激活配置，刷新环境配置
            if (config.isActive) {
              refreshEnvConfig()
            }
            this.loadConfigs()
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
