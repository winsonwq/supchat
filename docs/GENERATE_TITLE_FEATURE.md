# 聊天标题生成功能

## 功能概述

在编辑模式下，用户可以为聊天会话生成智能标题。该功能会分析聊天内容并生成简洁、准确的标题。

## 功能实现

### 前端实现

1. **UI组件** (`miniprogram/components/sidebar/`)
   - 在编辑模式下，每个聊天项右侧显示生成标题按钮（工具图标）
   - 按钮位于删除按钮左侧
   - 使用 `btn-icon` 样式类

2. **事件处理** (`miniprogram/pages/index/index.ts`)
   - `generateChatTitle()` 方法处理按钮点击事件
   - 调用云函数生成标题
   - 更新本地聊天会话列表
   - 显示加载状态和结果提示

### 后端实现

1. **云函数路由** (`cloudfunctions/supchat/lib/handlers/chat.mjs`)
   - 新增 `POST /chats/:id/generate-title` 路由
   - 获取聊天消息内容
   - 分析消息生成标题
   - 更新数据库中的聊天标题

2. **标题生成逻辑**
   - 提取前10条用户和助手消息
   - 基于第一条用户消息生成标题
   - 清理特殊字符，限制20个字符以内
   - 如果无法生成，使用"新对话"作为默认标题

## 使用方法

1. 打开侧边栏
2. 点击编辑按钮进入编辑模式
3. 在要生成标题的聊天项右侧点击工具图标
4. 等待标题生成完成
5. 查看生成的标题

## 技术细节

### 前端调用流程

```typescript
// 1. 用户点击生成标题按钮
generateChatTitle(e: WXEvent<{ sessionId: string }>)

// 2. 调用云函数
wx.cloud.callFunction({
  name: 'supchat',
  data: {
    route: `/chats/${sessionId}/generate-title`,
    method: 'POST'
  }
})

// 3. 处理结果并更新UI
if (result.result && result.result.ok && result.result.data) {
  const newTitle = result.result.data.title
  // 更新本地状态
}
```

### 后端处理流程

```javascript
// 1. 接收请求
POST('/chats/:id/generate-title', auth, async ({ params, authUserId }) => {
  // 2. 验证权限和会话存在性
  const chat = await Chat.findById(id)
  
  // 3. 获取消息内容
  const messages = await Message.findByChat(id, { limit: 50, order: 'asc' })
  
  // 4. 生成标题
  const generatedTitle = generateTitleFromMessages(messages)
  
  // 5. 更新数据库
  await chat.update({ title: generatedTitle })
  
  // 6. 返回结果
  return { success: true, title: generatedTitle }
})
```

## 错误处理

- 会话ID为空：显示错误提示
- 会话不存在：返回错误信息
- 无消息内容：返回"会话中没有消息，无法生成标题"
- 网络错误：显示"生成标题失败"提示
- 云函数错误：显示具体错误信息

## 未来改进

1. **AI集成**：集成真正的AI服务生成更智能的标题
2. **多语言支持**：支持不同语言的标题生成
3. **自定义规则**：允许用户自定义标题生成规则
4. **批量生成**：支持批量生成多个聊天的标题
5. **标题编辑**：允许用户手动编辑生成的标题

## 相关文件

- `miniprogram/components/sidebar/sidebar.wxml` - UI模板
- `miniprogram/components/sidebar/sidebar.ts` - 组件逻辑
- `miniprogram/components/sidebar/sidebar.scss` - 样式定义
- `miniprogram/pages/index/index.ts` - 主页面事件处理
- `cloudfunctions/supchat/lib/handlers/chat.mjs` - 云函数路由处理
