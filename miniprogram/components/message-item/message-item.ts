// message-item.ts
import { Message } from '../../lib/services/ai.js'
import { ComponentEventManager } from '../../lib/mcp/components/component-event-manager.js'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 消息数据
    message: {
      type: Object,
      value: {} as Message
    },
    // 消息索引
    messageIndex: {
      type: Number,
      value: 0
    },
    // 是否为最后一条消息
    isLast: {
      type: Boolean,
      value: false
    },
    // 是否正在流式响应
    isStreaming: {
      type: Boolean,
      value: false
    },
    // 是否为加载状态
    isLoading: {
      type: Boolean,
      value: false
    },
    // 聊天区域高度
    scrollViewHeight: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  lifetimes: {
    attached() {
      // 组件初始化
      this.setupComponentEvents()
    },
    detached() {
      // 组件销毁时清理事件
      this.cleanupComponentEvents()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 设置组件事件
     */
    setupComponentEvents() {
      const { message } = this.data
      if (!message.content) return

      // 检查消息内容是否包含组件
      this.processContentForComponents(message.content)
    },

    /**
     * 处理消息内容中的组件
     */
    processContentForComponents(content: any) {
      if (typeof content === 'string') {
        // 检查字符串中是否包含组件标记
        this.setupStringContentEvents(content)
      } else if (typeof content === 'object' && content !== null) {
        if (Array.isArray(content)) {
          content.forEach(item => this.processContentForComponents(item))
        } else if (content.getMetaData) {
          // 这是一个组件实例
          this.setupComponentInstance(content)
        }
      }
    },

    /**
     * 设置字符串内容中的组件事件
     */
    setupStringContentEvents(content: string) {
      // 检查是否包含天气组件的HTML
      if (content.includes('data-component-type="weather"')) {
        // 延迟设置事件，确保DOM已经渲染
        setTimeout(() => {
          this.setupWeatherComponentEvents()
        }, 100)
      }
    },

    /**
     * 设置组件实例的事件
     */
    setupComponentInstance(component: any) {
      const metadata = component.getMetaData()
      if (metadata && metadata.type === 'weather') {
        this.setupWeatherComponentInstance(component)
      }
    },

    /**
     * 设置天气组件实例的事件
     */
    setupWeatherComponentInstance(weatherComponent: any) {
      const metadata = weatherComponent.getMetaData()
      const eventManager = ComponentEventManager.getInstance()

      eventManager.registerComponent(metadata.componentId, 'weather', {
        refresh: () => weatherComponent.refresh(),
        share: () => weatherComponent.share(),
        detail: () => weatherComponent.detail()
      })
    },

    /**
     * 设置天气组件HTML的事件
     */
    setupWeatherComponentEvents() {
      // 在微信小程序中，我们需要使用选择器API来查找元素
      // 由于微信小程序的限制，我们使用事件委托的方式
      // 在WXML中直接绑定事件
      console.log('设置天气组件事件')
    },

    /**
     * 处理天气组件的操作 - 通过WXML事件绑定调用
     */
    handleWeatherAction(componentId: string, action: string, event: any) {
      const eventManager = ComponentEventManager.getInstance()
      
      if (eventManager.hasComponent(componentId)) {
        // 如果组件已注册，直接调用事件处理器
        eventManager.handleComponentEvent(componentId, action, event)
      } else {
        // 如果组件未注册，创建默认处理器
        this.createDefaultWeatherHandlers(componentId, action)
      }
    },

    /**
     * 创建默认的天气组件处理器
     */
    createDefaultWeatherHandlers(componentId: string, action: string) {
      const eventManager = ComponentEventManager.getInstance()
      
      eventManager.registerComponent(componentId, 'weather', {
        refresh: () => {
          console.log(`刷新天气数据: ${componentId}`)
          wx.showToast({ title: '正在刷新天气数据...', icon: 'loading' })
        },
        share: () => {
          console.log(`分享天气数据: ${componentId}`)
          wx.showShareMenu({ withShareTicket: true })
        },
        detail: () => {
          console.log(`查看天气详情: ${componentId}`)
          wx.showToast({ title: '查看天气详情', icon: 'none' })
        }
      })

      // 执行当前操作
      eventManager.handleComponentEvent(componentId, action, {})
    },

    /**
     * 刷新天气数据
     */
    onWeatherRefresh(event: any) {
      const { componentId } = event.currentTarget.dataset
      this.handleWeatherAction(componentId, 'refresh', event)
    },

    /**
     * 分享天气数据
     */
    onWeatherShare(event: any) {
      const { componentId } = event.currentTarget.dataset
      this.handleWeatherAction(componentId, 'share', event)
    },

    /**
     * 查看天气详情
     */
    onWeatherDetail(event: any) {
      const { componentId } = event.currentTarget.dataset
      this.handleWeatherAction(componentId, 'detail', event)
    },

    /**
     * 清理组件事件
     */
    cleanupComponentEvents() {
      // 清理当前消息相关的组件事件
      const { message } = this.data
      if (message.content) {
        this.cleanupContentComponents(message.content)
      }
    },

    /**
     * 清理内容中的组件事件
     */
    cleanupContentComponents(content: any) {
      if (typeof content === 'object' && content !== null) {
        if (Array.isArray(content)) {
          content.forEach(item => this.cleanupContentComponents(item))
        } else if (content.getMetaData) {
          const metadata = content.getMetaData()
          if (metadata && metadata.componentId) {
            ComponentEventManager.getInstance().unregisterComponent(metadata.componentId)
          }
        }
      }
    },

    /**
     * 获取消息角色显示文本
     */
    getRoleText(): string {
      const { message } = this.data
      switch (message.role) {
        case 'user':
          return '用户'
        case 'tool':
          return '工具'
        case 'assistant':
        default:
          return 'AI助手'
      }
    },

    /**
     * 获取消息卡片的样式类名
     */
    getCardClasses(): string {
      const { message } = this.data
      const baseClasses = 'message-card mb-2 mx-5'
      
      switch (message.role) {
        case 'user':
          return `${baseClasses} user-card bg-white text-gray-800 rounded-lg overflow-hidden shadow-md`
        case 'tool':
          return `${baseClasses} tool-card rounded-lg overflow-hidden shadow-md border-l-4 border-blue-500`
        case 'assistant':
        default:
          return `${baseClasses} ai-card text-gray-800`
      }
    },

    /**
     * 判断是否显示流式响应指示器
     */
    shouldShowStreamingIndicator(): boolean {
      const { message, isStreaming, isLast } = this.data
      return message.role === 'assistant' && isStreaming && isLast && !message.content
    },

    /**
     * 判断是否显示流式输入光标
     */
    shouldShowStreamingCursor(): boolean {
      const { message, isStreaming, isLast } = this.data
      return message.role === 'assistant' && isStreaming && isLast && !!message.content
    },

    /**
     * 判断是否有工具调用
     */
    hasToolCalls(): boolean {
      const { message } = this.data
      return !!(message.tool_calls && message.tool_calls.length > 0)
    },


  }
})
