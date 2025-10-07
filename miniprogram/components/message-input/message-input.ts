// message-input.ts
import { WxEvent } from '../../lib/mcp/types'
import { MCPConfigStorage } from '../../lib/storage/mcp-config-storage'
import { AIConfigStorage } from '../../lib/storage/ai-config-storage'
import { AgentConfigStorage } from '../../lib/storage/agent-config-storage'
import { AgentModeStorage } from '../../lib/storage/agent-mode-storage'
import { AgentDefinition } from '../../lib/types/agent'
import getSafeArea from '../../lib/utils/safe-area'
import wechatSI, { WechatSIOptions } from '../../lib/mcp/tools/wechat-si'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 输入的消息内容
    inputMessage: {
      type: String,
      value: '',
    },
    // 是否正在加载
    isLoading: {
      type: Boolean,
      value: false,
    },
    // 是否正在流式响应
    isStreaming: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    bottomSafeHeight: 0,
    mcpSheetVisible: false,
    mcpConfigs: [] as any[],
    // AI 配置相关状态
    aiConfigSheetVisible: false,
    aiConfigs: [] as any[],
    // Agent 模式相关状态
    agentSettingSheetVisible: false,
    agentSheetVisible: false,
    agents: [] as AgentDefinition[],
    currentAgent: null as AgentDefinition | null,
    isAgentMode: false, // 是否为Agent模式
    // 新增语音输入相关状态
    isVoiceMode: false, // 是否为语音输入模式
    isRecording: false, // 是否正在录音
    recordingTime: 0, // 录音时长（秒）
    recordingTimer: null as any, // 录音计时器
    recorderManager: null as any, // 录音管理器
    // 控制 textarea 初始高度的标记
    textareaInitialHeight: false,
    // 微信同声传译插件状态
    wechatSIReady: false,
    // 实时语音识别相关
    isRealtimeRecognition: false, // 是否正在进行实时语音识别
    // 是否可发送（基于去空白后的内容与加载状态）
    canSend: false,
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 计算底部安全区域
      const safeArea = getSafeArea()
      this.setData({
        bottomSafeHeight: safeArea.safeAreaBottom,
        // 确保初始状态下 textarea 有正确的高度控制
        textareaInitialHeight: false,
      })
      // 载入 MCP 配置
      this.loadMcpConfigs()
      // 载入 AI 配置
      this.loadAiConfigs()
      // 载入 Agent 配置
      this.loadAgents()
      // 初始化录音管理器
      this.initRecorderManager()
      // 初始化微信同声传译插件
      this.initWechatSI()
      // 从localStorage加载Agent模式状态
      this.loadAgentModeState()

      // 调试信息
    },
    detached() {
      // 清理录音计时器
      if (this.data.recordingTimer) {
        clearInterval(this.data.recordingTimer)
      }
      // 停止微信同声传译语音识别
      wechatSI.stopVoiceRecognition()
    },
  },

  observers: {
    'inputMessage, isLoading, isStreaming': function (_inputMessage: string, _isLoading: boolean, _isStreaming: boolean) {
      // 使用 properties 保证与外部绑定保持一致
      const msg = (this as any).properties.inputMessage || ''
      const canSend = !!(msg && msg.trim()) && !(this as any).properties.isLoading && !(this as any).properties.isStreaming
      ;(this as any).setData({ canSend })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 输入框变化
    onInputChange(e: WxEvent) {
      const value = e.detail.value || ''
      this.setData({
        inputMessage: value,
        canSend: !!value.trim() && !this.properties.isLoading && !this.properties.isStreaming,
      })

      // 如果当前是初始高度状态，且有内容输入，则移除初始高度限制
      if (this.data.textareaInitialHeight && value.trim()) {
        this.setData({
          textareaInitialHeight: false,
        })
      }

      // 触发输入变化事件
      this.triggerEvent('inputchange', {
        value: value,
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
        message: message,
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
      // 每次打开时重新加载配置，确保显示最新的启用状态
      this.loadMcpConfigs()
      this.setData({ mcpSheetVisible: true })
    },
    onCloseMcpSheet() {
      this.setData({ mcpSheetVisible: false })
    },
    loadMcpConfigs() {
      // 只获取全局已启用的 MCP 配置，并添加消息发送状态
      const enabledConfigs = MCPConfigStorage.getEnabledConfigs()
      const configs = enabledConfigs.map(config => ({
        ...config,
        isMessageEnabled: MCPConfigStorage.isMessageEnabled(config.id)
      }))
      
      this.setData({ mcpConfigs: configs })
    },
    onToggleMcp(e: WxEvent) {
      const id = (e.currentTarget as any).dataset.id as string
      
      // 处理内置配置的消息发送状态
      if (id === 'builtin-mcp-tools') {
        const currentMessageEnabled = MCPConfigStorage.isMessageEnabled(id)
        const newMessageEnabled = !currentMessageEnabled
        const success = MCPConfigStorage.setMessageEnabled(id, newMessageEnabled)
        
        if (success) {
          this.loadMcpConfigs()
          this.triggerEvent('mcpchange', { id })
          
          wx.showToast({
            title: newMessageEnabled ? '小程序生态工具包已启用消息发送' : '小程序生态工具包已关闭消息发送',
            icon: 'success',
            duration: 2000
          })
        } else {
          wx.showToast({
            title: '操作失败',
            icon: 'error'
          })
        }
        return
      }
      
      // 切换消息发送状态
      MCPConfigStorage.toggleMessageEnabled(id)
      this.loadMcpConfigs()
      this.triggerEvent('mcpchange', { id })
    },

    // AI 配置相关方法
    onOpenAiConfigSheet() {
      this.setData({ aiConfigSheetVisible: true })
    },
    onCloseAiConfigSheet() {
      this.setData({ aiConfigSheetVisible: false })
    },
    loadAiConfigs() {
      const configs = AIConfigStorage.getAllConfigs()
      this.setData({ aiConfigs: configs })
    },

    // Agent 设置面板相关方法
    onOpenAgentSettingSheet() {
      this.setData({ agentSettingSheetVisible: true })
    },
    onCloseAgentSettingSheet() {
      this.setData({ agentSettingSheetVisible: false })
    },
    loadAgents() {
      const agents = AgentConfigStorage.getAllConfigs()
      this.setData({ agents })
    },
    loadAgentModeState() {
      // 从localStorage加载Agent模式状态
      const agentModeState = AgentModeStorage.getAgentModeState()
      // getCurrentAgent() 会自动从 AgentConfigStorage 获取最新配置
      // 如果 agent 已被删除或配置已更新，会自动获取最新状态
      const currentAgent = agentModeState.currentAgent
      
      this.setData({
        isAgentMode: agentModeState.isAgentMode,
        currentAgent: currentAgent
      })
      
      // 如果agent模式已启用且有有效的agent，通知父组件
      if (agentModeState.isAgentMode && currentAgent) {
        this.triggerEvent('agentchange', { agent: currentAgent, isAgentMode: true })
      }
    },
    onOpenAgentSheet() {
      this.setData({ agentSheetVisible: true })
    },
    onCloseAgentSheet() {
      this.setData({ agentSheetVisible: false })
    },
    onToggleAgentMode(e: WxEvent) {
      const enabled = (e.detail as any).value as boolean
      if (enabled) {
        // 若开启但尚未选择过 Agent，则默认选择第一个
        const agent = this.data.currentAgent || this.data.agents[0] || null
        if (!agent) {
          wx.showToast({ title: '暂无可用的 Agent', icon: 'error' })
          this.setData({ isAgentMode: false })
          AgentModeStorage.setAgentModeEnabled(false)
          return
        }
        this.setData({ currentAgent: agent, isAgentMode: true })
        
        // 只保存 agent ID，不存储整个对象
        AgentModeStorage.setAgentModeEnabled(true)
        AgentModeStorage.setCurrentAgentId(agent.id)
        
        this.triggerEvent('agentchange', { agent, isAgentMode: true })
        wx.showToast({ title: `已开启 ${agent.name} 模式`, icon: 'success', duration: 1200 })
      } else {
        this.setData({ isAgentMode: false })
        
        // 只保存模式开关状态，保留当前 agent ID
        AgentModeStorage.setAgentModeEnabled(false)
        
        this.triggerEvent('agentchange', { agent: this.data.currentAgent, isAgentMode: false })
        wx.showToast({ title: '已关闭 Agent 模式', icon: 'success', duration: 1200 })
      }
    },
    onSelectAgent(e: WxEvent) {
      const id = (e.currentTarget as any).dataset.id as string
      if (!id) return
      const agent = this.data.agents.find(a => a.id === id)
      if (!agent) return
      
      this.setData({ currentAgent: agent, agentSheetVisible: false })
      
      // 只保存 agent ID 到 localStorage，不存储整个对象
      AgentModeStorage.setCurrentAgentId(agent.id)
      
      if (this.data.isAgentMode) {
        this.triggerEvent('agentchange', { agent, isAgentMode: true })
      }
      wx.showToast({ title: `已选择 ${agent.name}`, icon: 'success', duration: 1200 })
    },
    onSelectAiConfig(e: WxEvent) {
      console.log('事件详情:', {
        type: e.type,
        currentTarget: e.currentTarget,
        target: e.target,
        dataset: (e.currentTarget as any).dataset
      })
      
      const id = (e.currentTarget as any).dataset.id as string
      if (!id) {
        console.error('❌ 未获取到配置ID')
        wx.showToast({
          title: '配置ID无效',
          icon: 'error',
        })
        return
      }
      
      // 先显示一个测试提示
      wx.showToast({
        title: `点击了配置: ${id}`,
        icon: 'none',
        duration: 2000,
      })
      
      // 设置激活配置
      const success = AIConfigStorage.setActiveConfig(id)
      if (success) {
        // 重新加载配置以更新UI状态
        this.loadAiConfigs()
        // 触发配置变化事件
        this.triggerEvent('aiconfigchange', { id })
        
        setTimeout(() => {
          wx.showToast({
            title: 'AI配置已切换',
            icon: 'success',
            duration: 1500,
          })
        }, 2000)
      } else {
        console.error('❌ AI配置切换失败:', id)
        wx.showToast({
          title: '配置切换失败',
          icon: 'error',
        })
      }
    },

    // 新增语音输入相关方法

    /**
     * 初始化微信同声传译插件
     */
    async initWechatSI() {
      try {
        const success = await wechatSI.getService().initialize()
        
        if (success) {
          this.setData({ wechatSIReady: true })
        } else {
          console.warn('⚠️ 微信同声传译插件初始化失败，将使用模拟语音识别')
        }
      } catch (error) {
        console.error('❌ 初始化微信同声传译插件异常:', error)
      }
    },

    /**
     * 初始化录音管理器
     */
    initRecorderManager() {
      const recorderManager = wx.getRecorderManager()

      // 录音开始事件
      recorderManager.onStart(() => {
        this.setData({ isRecording: true })
        this.startRecordingTimer()
      })

      // 录音结束事件
      recorderManager.onStop((res) => {
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
          icon: 'error',
        })
      })

      this.setData({ recorderManager })
    },

    /**
     * 切换输入模式
     */
    toggleInputMode() {
      const newMode = !this.data.isVoiceMode

      if (newMode) {
        // 切换到语音模式
        this.setData({
          isVoiceMode: newMode,
          inputMessage: '', // 切换模式时清空输入
        })
      } else {
        this.setData({
          isVoiceMode: newMode,
          inputMessage: '',
          textareaInitialHeight: true,
        })

        setTimeout(() => {
          this.setData({
            textareaInitialHeight: false,
          })
        }, 100)
      }

      this.triggerEvent('modechange', {
        mode: newMode ? 'voice' : 'text',
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
          if (this.data.wechatSIReady) {
            // 使用微信同声传译插件的实时语音识别
            this.startWechatSIRecognition()
          } else {
            // 使用传统录音方式
            this.startTraditionalRecording()
          }
        },
        fail: () => {
          wx.showModal({
            title: '需要录音权限',
            content: '请在设置中开启录音权限',
            showCancel: false,
          })
        },
      })
    },

    /**
     * 使用微信同声传译插件的实时语音识别
     */
    async startWechatSIRecognition() {
      try {
        this.setData({ 
          isRecording: true,
          isRealtimeRecognition: true 
        })
        
        this.startRecordingTimer()

        const options: WechatSIOptions = {
          lang: 'zh_CN',
          duration: 30000,
        }

        const result = await wechatSI.startRealtimeRecognition(options)
        if (result.success && result.text) {
          // 设置识别后的文字到输入框
          this.setData({ inputMessage: result.text })
          
          // 自动发送识别后的消息
          setTimeout(() => {
            this.onSend()
          }, 800)
        } else {
          console.warn('⚠️ 语音识别失败:', result.error)
          wx.showToast({
            title: '语音识别失败，请重试',
            icon: 'error',
          })
        }
        } catch (error) {
          console.error('语音识别异常:', error)
        wx.showToast({
          title: '语音识别失败，请重试',
          icon: 'error',
        })
      } finally {
        this.setData({ 
          isRecording: false,
          isRealtimeRecognition: false 
        })
        this.stopRecordingTimer()
      }
    },

    /**
     * 使用传统录音方式
     */
    startTraditionalRecording() {
      this.data.recorderManager.start({
        duration: 30000, // 最长录音30秒
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3',
      })
    },

    /**
     * 停止录音
     */
    stopRecording() {
      if (!this.data.isRecording) {
        return
      }

      if (this.data.isRealtimeRecognition) {
        // 停止微信同声传译实时识别
        wechatSI.stopVoiceRecognition()
      } else {
        // 停止传统录音
        this.data.recorderManager.stop()
      }
    },

    /**
     * 开始录音计时器
     */
    startRecordingTimer() {
      this.setData({ recordingTime: 0 })
      const timer = setInterval(() => {
        this.setData({
          recordingTime: this.data.recordingTime + 1,
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
        let recognizedText = ''

        if (this.data.wechatSIReady) {
          // 使用微信同声传译插件进行语音识别
          const options: WechatSIOptions = {
            lang: 'zh_CN',
            duration: 30000,
          }

          const result = await wechatSI.recognizeVoiceFromFile(tempFilePath, options)
          
          if (result.success && result.text) {
            recognizedText = result.text
          } else {
            console.warn('⚠️ 微信同声传译识别失败:', result.error)
            wx.showToast({
              title: '语音识别失败，请重试',
              icon: 'error',
            })
            return
          }
        } else {
          // 微信同声传译插件未就绪
          wx.showToast({
            title: '语音识别插件未就绪',
            icon: 'error',
          })
          return
        }

        wx.hideLoading()

        if (recognizedText) {
          // 显示识别结果
          wx.showToast({
            title: '语音识别成功',
            icon: 'success',
            duration: 1500,
          })

          // 设置识别后的文字到输入框
          this.setData({ inputMessage: recognizedText })

          // 延迟一下再自动发送，让用户看到识别结果
          setTimeout(() => {
            // 自动发送识别后的消息
            this.onSend()
          }, 800)
        }
      } catch (error) {
        wx.hideLoading()
        console.error('❌ 语音识别处理失败:', error)
        wx.showToast({
          title: '语音识别失败，请重试',
          icon: 'error',
        })
      }
    },

    /**
     * 格式化录音时间显示
     */
    formatRecordingTime(seconds: number): string {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`
    },
  },
})
