import { subscribe, createSelector } from '../../lib/state/index'
import { demoStore, demoActions, DemoState } from '../../lib/state/demo'
import { rootStore } from '../../lib/state/states/root'
import { fetchChats } from '../../lib/state/actions/chat'
import { selectChats, selectChatsLoading } from '../../lib/state/selectors/chat'

Page({
  data: {
    counter: { value: 0 },
    todos: { items: [] as { id: string; text: string; done: boolean }[] },
    summary: { total: 0, done: 0 },
    chats: [] as any[],
    chatsLoading: false,
  },
  onLoad() {
    // 订阅 counter 和 todos
    subscribe(
      demoStore,
      (state: DemoState) => ({
        counter: state.counter,
        todos: state.todos,
      }),
      (result) => {
        this.setData(result)
      },
    )

    // 订阅计算状态
    subscribe(
      demoStore,
      (state: DemoState) => ({
        total: state.todos.items.length,
        done: state.todos.items.filter((i) => i.done).length,
      }),
      (result) => {
        this.setData(result)
      },
    )

    // 使用 selector
    const selectCombined = createSelector(
      [(s: DemoState) => s.todos.items, (s: DemoState) => s.counter.value],
      (items, value) => ({
        message: `共 ${items.length} 项，计数器 ${value}`,
        undone: items.filter((i) => !i.done).length,
      }),
    )
    subscribe(demoStore, selectCombined, (result) => {
      this.setData(result)
    })

    // 订阅聊天数据
    subscribe(
      rootStore,
      (state: any) => ({
        chats: selectChats(state),
        chatsLoading: selectChatsLoading(state),
      }),
      (result) => {
        this.setData(result)
      },
    )
  },
  onInc() {
    demoStore.dispatch(demoActions.increment(1))
  },
  onDec() {
    demoStore.dispatch(demoActions.decrement(1))
  },
  onAdd(e: WechatMiniprogram.CustomEvent) {
    const text = (e.detail?.value?.text ?? '').trim()
    if (!text) return
    const id = `${Date.now()}`
    demoStore.dispatch(demoActions.addTodo(id, text))
  },
  onToggle(e: WechatMiniprogram.BaseEvent) {
    const id = (e.currentTarget?.dataset as any)?.id as string
    if (!id) return
    demoStore.dispatch(demoActions.toggleTodo(id))
  },
  onClear() {
    demoStore.dispatch(demoActions.clearDone())
  },

  // 测试 fetchChats
  async onTestFetchChats() {
    try {
      console.log('开始测试 fetchChats...')
      const result = await rootStore.dispatch(fetchChats())
      console.log('fetchChats 成功:', result)
      wx.showToast({
        title: `获取到 ${result.length} 个聊天`,
        icon: 'success'
      })
    } catch (error) {
      console.error('fetchChats 失败:', error)
      wx.showToast({
        title: '获取聊天失败',
        icon: 'error'
      })
    }
  },
})
