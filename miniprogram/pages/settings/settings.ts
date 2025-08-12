// settings.ts
import { getNavigationHeight } from '../../lib/utils/navigation-height'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    contentPaddingTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight() + 16 // 16px = 32rpx
    this.setData({ contentPaddingTop: paddingTop })
  },

  /**
   * AI 设置
   */
  onAISettings() {
    wx.navigateTo({
      url: '/pages/ai-settings/ai-settings'
    })
  },

  /**
   * MCP Servers 设置
   */
  onMCPSettings() {
    wx.navigateTo({
      url: '/pages/mcp-list/mcp-list'
    })
  }
})
