import Chat from '../models/chat.mjs'
import Message from '../models/message.mjs'
import { GET, POST, PUT, DELETE } from '../router.mjs'
import auth from '../middlewares/auth.mjs'

// Chat 路由处理器
export default [
  // 创建会话（可选携带首条消息）
  POST('/chats', auth, async ({ body, authUserId }) => {
    try {
      const { userId = authUserId, title = '', firstMessage } = body || {}
      if (!userId || userId !== authUserId) return { error: '未授权或 userId 不匹配' }

      // 创建 Chat
      const chat = await Chat.create({ userId, title })

      // 可选首条消息
      if (firstMessage && firstMessage.content) {
        const m = await Message.create({
          chatId: chat._id,
          userId,
          role: firstMessage.role || 'user',
          content: firstMessage.content,
        })

        // 更新 Chat 聚合字段
        const recent = (chat.messagesRecent || []).concat([
          { role: m.role, content: m.content, createdAt: m.createdAt }
        ])
        const messagesRecent = recent.slice(-20)
        await chat.update({
          messageCount: (chat.messageCount || 0) + 1,
          lastMessageAt: m.createdAt,
          lastMessagePreview: m.content.slice(0, 100),
          messagesRecent
        })
      }

      return chat
    } catch (error) {
      console.error('创建会话失败:', error)
      return { error: error.message }
    }
  }),

  // 获取用户会话列表（分页）
  GET('/chats', auth, async ({ query, authUserId }) => {
    try {
      const { userId = authUserId, limit, cursor } = query || {}
      if (!userId || userId !== authUserId) return { error: '未授权或 userId 不匹配' }
      const size = Number(limit) > 0 ? Number(limit) : 20
      const chats = await Chat.findByUser(userId, { limit: size, cursor })
      return chats
    } catch (error) {
      console.error('获取会话列表失败:', error)
      return { error: error.message }
    }
  }),

  // 获取会话详情
  GET('/chats/:id', auth, async ({ params, authUserId }) => {
    try {
      const { id } = params || {}
      if (!id) return { error: '缺少会话 ID' }
      const chat = await Chat.findById(id)
      if (!chat || chat.isDeleted) return { error: '会话不存在' }
      if (chat.userId !== authUserId) return { error: '未授权访问该会话' }
      return chat
    } catch (error) {
      console.error('获取会话详情失败:', error)
      return { error: error.message }
    }
  }),

  // 更新会话（目前允许更新标题）
  PUT('/chats/:id', auth, async ({ params, body, authUserId }) => {
    try {
      const { id } = params || {}
      const { title } = body || {}
      if (!id) return { error: '缺少会话 ID' }
      const chat = await Chat.findById(id)
      if (!chat || chat.isDeleted) return { error: '会话不存在' }
      if (chat.userId !== authUserId) return { error: '未授权访问该会话' }
      const payload = {}
      if (typeof title === 'string') payload.title = title
      await chat.update(payload)
      return chat
    } catch (error) {
      console.error('更新会话失败:', error)
      return { error: error.message }
    }
  }),

  // 软删除会话
  DELETE('/chats/:id', auth, async ({ params, authUserId }) => {
    try {
      const { id } = params || {}
      if (!id) return { error: '缺少会话 ID' }
      const chat = await Chat.findById(id)
      if (!chat) return { error: '会话不存在' }
      if (chat.userId !== authUserId) return { error: '未授权访问该会话' }
      await chat.softDelete()
      return { message: '会话删除成功', id }
    } catch (error) {
      console.error('删除会话失败:', error)
      return { error: error.message }
    }
  })
]


