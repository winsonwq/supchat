// message-input.ts
import { WxEvent } from '../../lib/mcp/types.js'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import getSafeArea from '../../lib/utils/safe-area'
import voiceRecognition, { VoiceRecognitionOptions } from '../../lib/mcp/tools/voice'

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
    mcpConfigs: [] as any[],
    // 新增语音输入相关状态
    isVoiceMode: false, // 是否为语音输入模式
    isRecording: false, // 是否正在录音
    recordingTime: 0, // 录音时长（秒）
    recordingTimer: null as any, // 录音计时器
    recorderManager: null as any // 录音管理器
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
      // 初始化录音管理器
      this.initRecorderManager()
    },
    detached() {
      // 清理录音计时器
      if (this.data.recordingTimer) {
        clearInterval(this.data.recordingTimer)
      }
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
        console.log('⚠️ 发送消息失败:', { message, isLoading: this.properties.isLoading })
        return
      }
      
      console.log('📤 发送消息:', message)
      
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
    },

    // 新增语音输入相关方法
    
    /**
     * 初始化录音管理器
     */
    initRecorderManager() {
      const recorderManager = wx.getRecorderManager()
      
      // 录音开始事件
      recorderManager.onStart(() => {
        console.log('🎙️ 录音开始')
        this.setData({ isRecording: true })
        this.startRecordingTimer()
      })
      
      // 录音结束事件
      recorderManager.onStop((res) => {
        console.log('🛑 录音结束', res)
        this.setData({ isRecording: false })
        this.stopRecordingTimer()
        this.handleVoiceResult(res)
      })
      
      // 录音错误事件
      recorderManager.onError((res) => {
        console.error('❌ 录音错误', res)
        this.setData({ isRecording: false })
        this.stopRecordingTimer()
        wx.showToast({
          title: '录音失败，请重试',
          icon: 'error'
        })
      })
      
      this.setData({ recorderManager })
    },

    /**
     * 切换输入模式
     */
    toggleInputMode() {
      const newMode = !this.data.isVoiceMode
      this.setData({ 
        isVoiceMode: newMode,
        inputMessage: '' // 切换模式时清空输入
      })
      
      // 触发模式切换事件
      this.triggerEvent('modechange', {
        mode: newMode ? 'voice' : 'text'
      })
    },

    /**
     * 开始录音
     */
    startRecording() {
      if (this.data.isRecording || this.properties.isLoading) {
        return
      }
      
      // 检查录音权限
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          this.data.recorderManager.start({
            duration: 30000, // 最长录音30秒
            sampleRate: 16000,
            numberOfChannels: 1,
            encodeBitRate: 48000,
            format: 'mp3'
          })
        },
        fail: () => {
          wx.showModal({
            title: '需要录音权限',
            content: '请在设置中开启录音权限',
            showCancel: false
          })
        }
      })
    },

    /**
     * 停止录音
     */
    stopRecording() {
      if (!this.data.isRecording) {
        return
      }
      
      this.data.recorderManager.stop()
    },

    /**
     * 开始录音计时器
     */
    startRecordingTimer() {
      this.setData({ recordingTime: 0 })
      const timer = setInterval(() => {
        this.setData({
          recordingTime: this.data.recordingTime + 1
        })
      }, 1000)
      this.setData({ recordingTimer: timer })
    },

    /**
     * 停止录音计时器
     */
    stopRecordingTimer() {
      if (this.data.recordingTimer) {
        clearInterval(this.data.recordingTimer)
        this.setData({ recordingTimer: null })
      }
    },

    /**
     * 处理语音识别结果
     */
    async handleVoiceResult(res: any) {
      const { tempFilePath } = res
      
      wx.showLoading({ title: '正在识别语音...' })
      
      try {
        // 调用真实的语音识别服务
        const options: VoiceRecognitionOptions = {
          audioPath: tempFilePath,
          language: 'zh-CN',
          format: 'mp3'
        }
        
        const result = await voiceRecognition.recognize(options)
        
        wx.hideLoading()
        
        if (result.success && result.text) {
          // 在控制台输出识别的文字
          console.log('🎤 语音识别结果:', result.text)
          
          // 显示识别结果
          wx.showToast({
            title: '语音识别成功',
            icon: 'success',
            duration: 1500
          })
          
          // 设置识别后的文字到输入框
          this.setData({ inputMessage: result.text })
          
          // 延迟一下再自动发送，让用户看到识别结果
          setTimeout(() => {
            console.log('📤 自动发送语音识别消息:', result.text)
            // 自动发送识别后的消息
            this.onSend()
          }, 800)
          
        } else {
          console.error('❌ 语音识别失败:', result.error)
          wx.showToast({
            title: result.error || '语音识别失败',
            icon: 'error'
          })
        }
      } catch (error) {
        wx.hideLoading()
        console.error('❌ 语音识别处理失败:', error)
        wx.showToast({
          title: '语音识别失败，请重试',
          icon: 'error'
        })
      }
    },

    /**
     * 格式化录音时间显示
     */
    formatRecordingTime(seconds: number): string {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }
})
