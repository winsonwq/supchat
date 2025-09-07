// ai-settings.ts
import { AIConfig } from '../../lib/types/ai-config'
import { AIConfigStorage } from '../../lib/storage/ai-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    configs: [] as AIConfig[],
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
    
    this.setData({
      configs
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

    // 删除配置的提示
    const warningContent = `是否删除配置 "${config.name}"？删除后无法恢复。`

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
