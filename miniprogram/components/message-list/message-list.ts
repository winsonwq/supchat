// message-list.ts
import { Message } from '../../lib/types/message.js'

Component({
  options: {
    styleIsolation: 'apply-shared',
    virtualHost: true,
  },

  properties: {
    // 消息列表
    messages: {
      type: Array,
      value: [] as Message[],
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
    // 空消息对象，用于加载状态
    emptyMessage: {
      type: Object,
      value: {} as Message,
    },
    // 聊天区域高度
    scrollViewHeight: {
      type: Number,
      value: 0,
    },
    // 聊天区域顶部间距
    chatScrollTopPadding: {
      type: Number,
      value: 0,
    },
    // 是否正在加载更多消息
    isLoadingMore: {
      type: Boolean,
      value: false,
    },
    // 是否还有更多消息
    hasMoreMessages: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    scrollTop: 0,
    scrollIntoView: '',
  },

  lifetimes: {
    attached() {
      // 组件初始化
    },
    detached() {
      // 组件销毁时的清理工作
    },
  },

  methods: {
    // 滚动到最新消息
    scrollToLatestMessage() {
      // 触发父组件的滚动事件
      this.triggerEvent('scrollToLatest')
    },

    // 消息点击事件
    onMessageTap(e: any) {
      const { messageIndex } = e.currentTarget.dataset
      this.triggerEvent('messageTap', { messageIndex })
    },

    // 滚动到顶部时触发加载更多
    onScrollToUpper() {
      const { isLoadingMore, hasMoreMessages } = this.properties
      if (!isLoadingMore && hasMoreMessages) {
        this.triggerEvent('loadMore')
      }
    },

    // 滚动到底部时触发滚动到最新消息
    onScrollToLower() {
      this.triggerEvent('scrollToLatest')
    },

    // 滚动到指定位置
    scrollToPosition(scrollTop: number) {
      this.setData({ scrollTop })
    },

    // 滚动到指定元素
    scrollIntoView(viewId: string) {
      this.setData({ scrollIntoView: viewId })
    },

    // 处理工具确认
    onToolConfirm(event: any) {
      const { confirmId } = event.detail
      this.triggerEvent('toolConfirm', { confirmId })
    },

    // 处理工具取消
    onToolCancel(event: any) {
      const { confirmId } = event.detail
      this.triggerEvent('toolCancel', { confirmId })
    },
  },
})
