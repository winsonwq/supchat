# 聊天切换功能重构说明

## 重构目标

修复原有的聊天切换实现，分离数据获取和状态更新的逻辑，避免不必要的数据库操作。

## 主要变更

### 1. ChatService 重构

#### 新增方法
- `getChatWithMessages(chatId)`: 获取聊天及其消息数据
- `switchToChat(chatId)`: 切换聊天（只获取数据，不更新数据库状态）

#### 保留方法
- `setActiveChat(chatId)`: 设置活跃聊天（更新数据库中的 isActive 状态）

### 2. 状态管理重构

#### 新增动作类型
- `SWITCH_TO_CHAT`: 切换聊天（获取数据并更新前端状态）
- `SET_ACTIVE_CHAT`: 设置活跃聊天（更新数据库状态）

#### 状态字段扩展
- `currentChatWithMessages`: 存储当前聊天的完整数据（包括消息）

### 3. 选择器更新

#### 新增选择器
- `selectCurrentChatWithMessages`: 获取当前聊天的完整数据
- `selectCurrentChatMessages`: 获取当前聊天的消息列表
- `selectHasCurrentChat`: 检查是否有当前聊天

## 使用方式

### 推荐用法：切换聊天显示

```typescript
// 在组件中切换聊天时
dispatch(switchToChat(chatId))

// 这会：
// 1. 获取聊天数据和消息
// 2. 更新前端状态
// 3. 不会更新数据库中的 isActive 字段
```

### 业务逻辑：设置活跃状态

```typescript
// 当需要更新数据库状态时（比如用户离开页面）
dispatch(setActiveChat(chatId))

// 这会：
// 1. 更新数据库中的 isActive 状态
// 2. 不影响前端显示
```

### 简单状态切换

```typescript
// 仅更新前端状态，不获取数据
dispatch(setCurrentChat(chatId))

// 这会：
// 1. 只更新 currentChatId
// 2. 不获取数据
// 3. 不更新数据库
```

## 架构优势

### 1. 职责分离
- **数据获取**: `switchToChat` 负责获取聊天数据和消息
- **状态管理**: `setActiveChat` 负责维护业务状态
- **UI 状态**: `setCurrentChat` 负责前端状态切换

### 2. 性能优化
- 避免不必要的数据库更新操作
- 切换聊天时只获取需要的数据
- 减少网络请求和数据库操作

### 3. 代码清晰
- 方法命名更明确
- 逻辑流程更清晰
- 便于维护和扩展

## 迁移指南

### 原有代码
```typescript
// 旧的方式：混合了数据获取和状态更新
dispatch(setCurrentChat(chatId)) // 这会调用 setActiveChat
```

### 新的代码
```typescript
// 新的方式：分离关注点
// 切换聊天显示
dispatch(switchToChat(chatId))

// 更新业务状态（可选）
dispatch(setActiveChat(chatId))
```

## 注意事项

1. **`isActive` 字段**: 这是业务状态字段，用于标识用户最后活跃的聊天，不是简单的 UI 状态
2. **数据一致性**: 前端状态和数据库状态可能不同步，这是正常的设计
3. **性能考虑**: 只在必要时调用 `setActiveChat`，避免频繁的数据库更新

## 总结

重构后的实现更加清晰、高效，符合单一职责原则。切换聊天时使用 `switchToChat`，需要更新业务状态时使用 `setActiveChat`，两者各司其职，互不干扰。
