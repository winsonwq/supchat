import getSafeArea from './lib/utils/safe-area'
// 确保组件注册模块被加载
import './lib/mcp/components/component-registry.js'
// 确保 ComponentManager 在应用启动时初始化
import { ComponentManager } from './lib/mcp/components/component-manager.js'

const safeAreaData = getSafeArea()

// app.ts
App<IAppOption>({
  globalData: {
    safeAreaTop: safeAreaData.safeAreaTop,
  },
  towxml: require('/towxml/index'),
  onLaunch() {
    // 初始化云能力（若可用）
    if (wx.cloud && typeof wx.cloud.init === 'function') {
      try {
        wx.cloud.init({
          // 按需设置 env
          traceUser: true,
        })
      } catch (e) {
        console.warn('wx.cloud.init 失败或不可用:', e)
      }
    }
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
    
    // 确保组件注册完成
    console.log('应用启动完成，组件注册状态:', (globalThis as any).__componentRegistry__)
    
    // 初始化 ComponentManager
    try {
      const componentManager = ComponentManager.getInstance()
      console.log('✅ ComponentManager 在应用启动时初始化成功')
    } catch (error) {
      console.error('❌ ComponentManager 初始化失败:', error)
    }
  },
})