// message-input.ts
import { WxEvent } from '../../lib/mcp/types.js'

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
    }
  }
})
