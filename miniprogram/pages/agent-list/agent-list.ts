// agent-list.ts
import { AgentDefinition } from '../../lib/types/agent'
import { AgentConfigStorage } from '../../lib/storage/agent-config-storage'
import { getNavigationHeight } from '../../lib/utils/navigation-height'

interface AgentWithDetail extends AgentDefinition {
  createdAtText?: string
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    agents: [] as AgentWithDetail[],
    contentPaddingTop: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log('Agent列表页面加载')
    
    // 计算内容顶部间距
    const paddingTop = getNavigationHeight()
    
    this.setData({ 
      contentPaddingTop: paddingTop
    })
    
    console.log('设置contentPaddingTop:', paddingTop)
    this.loadAgents()
  },

  /**
   * 页面显示时刷新数据
   */
  onShow() {
    this.loadAgents()
  },

  /**
   * 加载Agent列表
   */
  loadAgents() {
    const agents = AgentConfigStorage.getAllConfigs()
    
    // 为每个配置添加格式化时间
    const agentsWithDetail = agents.map(agent => ({
      ...agent,
      createdAtText: this.formatDate(agent.createdAt || Date.now())
    }))
    
    this.setData({ agents: agentsWithDetail })
  },

  /**
   * 格式化日期
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return date.toLocaleDateString()
    }
  },


  /**
   * 编辑配置
   */
  onEditConfig(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/agent-edit/agent-edit?id=${id}`
    })
  },

  /**
   * 添加新配置
   */
  onAddConfig() {
    wx.navigateTo({
      url: '/pages/agent-add/agent-add'
    })
  },


  /**
   * 设为默认配置
   */
  onSetDefault(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    if (!id) {
      wx.showToast({
        title: '配置ID不存在',
        icon: 'error'
      })
      return
    }
    
    wx.showModal({
      title: '设为默认',
      content: '确定要将此配置设为默认AI助手吗？',
      success: (res) => {
        if (res.confirm) {
          const success = AgentConfigStorage.setDefaultConfig(id)
          
          if (success) {
            // 重新加载数据
            this.loadAgents()
            
            wx.showToast({
              title: '已设为默认',
              icon: 'success',
              duration: 1500
            })
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
  onDeleteConfig(e: WxEvent) {
    const { id } = e.currentTarget.dataset
    if (!id) {
      wx.showToast({
        title: '配置ID不存在',
        icon: 'error'
      })
      return
    }
    
    wx.showModal({
      title: '删除配置',
      content: '确定要删除此AI助手配置吗？此操作不可恢复。',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          const success = AgentConfigStorage.deleteConfig(id)
          
          if (success) {
            // 重新加载数据
            this.loadAgents()
            
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1500
            })
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

// 定义事件类型
interface WxEvent {
  currentTarget: {
    dataset: {
      id?: string
      [key: string]: any
    }
  }
  detail?: any
}
