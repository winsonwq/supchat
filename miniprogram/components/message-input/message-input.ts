// message-input.ts
import { WxEvent } from '../../lib/mcp/types.js'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import getSafeArea from '../../lib/utils/safe-area'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 输入的消息内容
    inputMessage: {
      type: String,
      value: ''
    },
    // 是否正在加载
    isLoading: {
      type: Boolean,
      value: false
    },
    // 是否正在流式响应
    isStreaming: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    bottomSafeHeight: 0,
    mcpSheetVisible: false,
    mcpConfigs: [] as any[]
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 计算底部安全区域
      const safeArea = getSafeArea()
      this.setData({
        bottomSafeHeight: safeArea.safeAreaBottom
      })
      // 载入 MCP 配置
      this.loadMcpConfigs()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 输入框变化
    onInputChange(e: WxEvent) {
      const value = e.detail.value || ''
      this.setData({
        inputMessage: value
      })
      // 触发输入变化事件
      this.triggerEvent('inputchange', {
        value: value
      })
    },

    // 发送消息
    onSend() {
      const message = this.properties.inputMessage.trim()
      if (!message || this.properties.isLoading) {
        return
      }
      
      // 触发发送事件
      this.triggerEvent('send', {
        message: message
      })
    },

    // 确认发送（键盘发送键）
    onConfirm() {
      this.onSend()
    },

    // 取消请求
    onCancel() {
      // 触发取消事件
      this.triggerEvent('cancel')
    },

    // 清空输入框
    onClear() {
      this.setData({
        inputMessage: ''
      })
      // 触发输入变化事件
      this.triggerEvent('inputchange', {
        value: ''
      })
    },

    // 打开/关闭 MCP 抽屉
    onOpenMcpSheet() {
      this.setData({ mcpSheetVisible: true })
    },
    onCloseMcpSheet() {
      this.setData({ mcpSheetVisible: false })
    },
    loadMcpConfigs() {
      const configs = MCPConfigStorage.getAllConfigs()
      this.setData({ mcpConfigs: configs })
    },
    onToggleMcp(e: WxEvent) {
      const id = e.currentTarget.dataset.id as string
      MCPConfigStorage.toggleConfigEnabled(id)
      this.loadMcpConfigs()
      this.triggerEvent('mcpchange', { id })
    }
  }
})
