# fetchChats 集成说明

## 概述

`fetchChats` 是一个 Redux action，用于从云端获取聊天记录列表。它已经完成了基本的集成，包括：

1. ✅ Action 定义 (`miniprogram/lib/state/actions/chat.ts`)
2. ✅ Reducer 处理 (`miniprogram/lib/state/states/chat.ts`)
3. ✅ Selector 选择器 (`miniprogram/lib/state/selectors/chat.ts`)
4. ✅ Service 实现 (`miniprogram/lib/services/chat.ts`)
5. ✅ 主页面集成 (`miniprogram/pages/index/index.ts`)
6. ✅ 测试页面 (`miniprogram/pages/state-test/state-test.ts`)

## 使用方法

### 1. 在组件中调用

```typescript
import { rootStore } from '../../lib/state/states/root'
import { fetchChats } from '../../lib/state/actions/chat'

// 调用 fetchChats
const chats = await rootStore.dispatch(fetchChats())
```

### 2. 订阅聊天数据变化

```typescript
import { subscribe } from '../../lib/state/bind'
import { selectChats } from '../../lib/state/selectors/chat'

// 订阅聊天数据
const unsub = subscribe(rootStore, (s) => selectChats(s), (chats) => {
  // 处理聊天数据更新
  console.log('聊天数据已更新:', chats)
})

// 取消订阅
unsub()
```

### 3. 使用选择器获取数据

```typescript
import { selectChats, selectCurrentChat, selectChatsLoading } from '../../lib/state/selectors/chat'

// 获取所有聊天
const chats = selectChats(state)

// 获取当前聊天
const currentChat = selectCurrentChat(state)

// 获取加载状态
const isLoading = selectChatsLoading(state)
```

## 测试

可以通过访问 `pages/state-test/state-test` 页面来测试 `fetchChats` 功能：

1. 点击"测试 fetchChats"按钮
2. 查看控制台日志
3. 观察页面上的聊天数据更新

## 数据流

```
用户操作 → fetchChats action → chatService.getChats() → 云函数 → 数据库
    ↓
Redux store 更新 → 订阅者收到通知 → 组件重新渲染
```

## 注意事项

1. `fetchChats` 是异步操作，需要使用 `await` 或 `.then()` 处理
2. 如果云函数调用失败，会抛出错误，需要适当的错误处理
3. 聊天数据会自动同步到页面状态，无需手动更新
4. AIService 仍然用于 AI 消息处理、流式响应等核心功能，这是必要的

## 架构说明

### 职责分离

- **Redux Store + fetchChats**: 负责聊天会话的管理（创建、删除、切换、列表等）
- **AIService**: 负责 AI 消息处理、流式响应、工具调用等 AI 核心功能

### 数据流

```
聊天会话管理:
用户操作 → Redux Action → Chat Service → 云函数 → 数据库
    ↓
Redux Store 更新 → 订阅者收到通知 → 组件重新渲染

AI 消息处理:
用户输入 → AIService → AI 模型 → 流式响应 → 界面更新
```

## 未来改进

1. 添加分页支持
2. 添加缓存机制
3. 添加实时更新（WebSocket）
4. 添加离线支持
