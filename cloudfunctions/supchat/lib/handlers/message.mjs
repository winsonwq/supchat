import Chat from '../models/chat.mjs'
import Message from '../models/message.mjs'
import { GET, POST, DELETE } from '../router.mjs'
import auth from '../middlewares/auth.mjs'

// Message 路由处理器
export default [
  // 分页获取会话消息
  GET('/chats/:id/messages', auth, async ({ params, query, authUserId }) => {
    try {
      const { id } = params || {}
      if (!id) return { error: '缺少会话 ID' }
      const chat = await Chat.findById(id)
      if (!chat || chat.isDeleted) return { error: '会话不存在' }
      if (chat.userId !== authUserId) return { error: '未授权访问该会话' }
      const { limit, cursor, order } = query || {}
      const size = Number(limit) > 0 ? Number(limit) : 20
      const list = await Message.findByChat(id, { limit: size, cursor, order })
      return list
    } catch (error) {
      console.error('获取消息列表失败:', error)
      return { error: error.message }
    }
  }),

  // 发送消息（并维护 Chat 聚合字段）
  POST('/chats/:id/messages', auth, async ({ params, body, authUserId }) => {
    try {
      const { id } = params || {}
      if (!id) return { error: '缺少会话 ID' }
      const { userId = authUserId, role = 'user', content, toolCalls, toolCallId, aiconfig } = body || {}
      if (!userId || userId !== authUserId) return { error: '未授权或 userId 不匹配' }
      // 允许在存在 toolCalls 时 content 为空
      if (!Message.isContentOrToolCallsProvided(content, toolCalls)) {
        return { error: '缺少 content' }
      }

      const chat = await Chat.findById(id)
      if (!chat || chat.isDeleted) return { error: '会话不存在' }
      if (chat.userId !== authUserId) return { error: '未授权访问该会话' }

      const msg = await Message.create({ 
        chatId: id, 
        userId, 
        role, 
        content,
        toolCalls,
        toolCallId,
        aiconfig
      })

      // 生成预览内容（处理复杂内容类型）
      let previewContent = ''
      if (typeof content === 'string') {
        previewContent = content
      } else if (Array.isArray(content)) {
        previewContent = content.map(item => 
          typeof item === 'string' ? item : JSON.stringify(item)
        ).join(' ')
      } else if (typeof content === 'object' && content !== null) {
        // 尝试提取文本内容
        if (content.text) previewContent = content.text
        else if (content.content) previewContent = content.content
        else if (content.message) previewContent = content.message
        else previewContent = JSON.stringify(content)
      }

      const recent = (chat.messagesRecent || []).concat([
        { role: msg.role, content: previewContent, createdAt: msg.createdAt }
      ])
      const messagesRecent = recent.slice(-20)
      await chat.update({
        messageCount: (chat.messageCount || 0) + 1,
        lastMessageAt: msg.createdAt,
        lastMessagePreview: previewContent.slice(0, 100),
        messagesRecent
      })

      return msg
    } catch (error) {
      console.error('发送消息失败:', error)
      return { error: error.message }
    }
  }),

  // 软删除消息
  DELETE('/messages/:mid', auth, async ({ params, authUserId }) => {
    try {
      const { mid } = params || {}
      if (!mid) return { error: '缺少消息 ID' }
      const mDoc = await Message.getCollection().doc(mid).get()
      const data = mDoc && mDoc.data ? mDoc.data : null
      if (!data) return { error: '消息不存在' }

      const msg = new Message({ _id: mid, ...data })
      if (msg.userId !== authUserId) return { error: '未授权删除该消息' }
      await msg.softDelete()

      // 同步 Chat 统计（简单处理：messageCount 不减，仅防止负数；如需真实计数可改为聚合查询）
      const chat = await Chat.findById(msg.chatId)
      if (chat) {
        await chat.update({ messageCount: Math.max((chat.messageCount || 1) - 1, 0) })
      }

      return { message: '消息删除成功', id: mid }
    } catch (error) {
      console.error('删除消息失败:', error)
      return { error: error.message }
    }
  })
]


