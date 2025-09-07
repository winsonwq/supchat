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
          toolCalls: firstMessage.tool_calls,
          toolCallId: firstMessage.tool_call_id,
        })

        // 生成预览内容
        let previewContent = ''
        if (typeof firstMessage.content === 'string') {
          previewContent = firstMessage.content
        } else if (Array.isArray(firstMessage.content)) {
          previewContent = firstMessage.content.map(item => 
            typeof item === 'string' ? item : JSON.stringify(item)
          ).join(' ')
        } else if (typeof firstMessage.content === 'object' && firstMessage.content !== null) {
          if (firstMessage.content.text) previewContent = firstMessage.content.text
          else if (firstMessage.content.content) previewContent = firstMessage.content.content
          else if (firstMessage.content.message) previewContent = firstMessage.content.message
          else previewContent = JSON.stringify(firstMessage.content)
        }

        // 更新 Chat 聚合字段
        const recent = (chat.messagesRecent || []).concat([
          { role: m.role, content: previewContent, createdAt: m.createdAt }
        ])
        const messagesRecent = recent.slice(-20)
        await chat.update({
          messageCount: (chat.messageCount || 0) + 1,
          lastMessageAt: m.createdAt,
          lastMessagePreview: previewContent.slice(0, 100),
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
  }),

  // 生成聊天标题
  POST('/chats/:id/generate-title', auth, async ({ params, authUserId }) => {
    try {
      const { id } = params || {}
      if (!id) return { error: '缺少会话 ID' }
      
      const chat = await Chat.findById(id)
      if (!chat || chat.isDeleted) return { error: '会话不存在' }
      if (chat.userId !== authUserId) return { error: '未授权访问该会话' }

      // 获取会话的消息
      const messages = await Message.findByChat(id, { limit: 50, order: 'asc' })
      
      if (!messages || messages.length === 0) {
        return { error: '会话中没有消息，无法生成标题' }
      }

      // 构建消息内容用于AI分析
      const messageTexts = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(0, 10) // 只取前10条消息
        .map(msg => {
          let content = ''
          if (typeof msg.content === 'string') {
            content = msg.content
          } else if (Array.isArray(msg.content)) {
            content = msg.content.map(item => 
              typeof item === 'string' ? item : JSON.stringify(item)
            ).join(' ')
          } else if (typeof msg.content === 'object' && msg.content !== null) {
            if (msg.content.text) content = msg.content.text
            else if (msg.content.content) content = msg.content.content
            else content = JSON.stringify(msg.content)
          }
          return `${msg.role}: ${content}`
        })
        .join('\n')

      // 调用AI生成标题
      const titlePrompt = `请根据以下对话内容生成一个简洁、准确的标题（不超过20个字符）：

${messageTexts}

请只返回标题内容，不要包含其他解释或格式。`

      // 这里需要调用AI服务，暂时使用简单的规则生成标题
      let generatedTitle = '新对话'
      
      if (messageTexts.length > 0) {
        // 提取第一条用户消息的前20个字符作为标题
        const firstUserMessage = messages.find(msg => msg.role === 'user')
        if (firstUserMessage) {
          let content = ''
          if (typeof firstUserMessage.content === 'string') {
            content = firstUserMessage.content
          } else if (Array.isArray(firstUserMessage.content)) {
            content = firstUserMessage.content.map(item => 
              typeof item === 'string' ? item : JSON.stringify(item)
            ).join(' ')
          } else if (typeof firstUserMessage.content === 'object' && firstUserMessage.content !== null) {
            if (firstUserMessage.content.text) content = firstUserMessage.content.text
            else if (firstUserMessage.content.content) content = firstUserMessage.content.content
            else content = JSON.stringify(firstUserMessage.content)
          }
          
          // 清理内容并截取
          generatedTitle = content
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 只保留中文、英文、数字和空格
            .trim()
            .substring(0, 20)
          
          if (!generatedTitle) {
            generatedTitle = '新对话'
          }
        }
      }

      // 更新聊天会话的标题
      await chat.update({ title: generatedTitle })

      return { 
        success: true, 
        title: generatedTitle,
        message: '标题生成成功' 
      }
    } catch (error) {
      console.error('生成标题失败:', error)
      return { error: error.message }
    }
  })
]


