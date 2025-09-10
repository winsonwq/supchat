import { ToolCall, RenderNode, TowxmlNode } from '../mcp/types'

// AI 配置信息（不包含敏感信息）
export interface AIConfigInfo {
  id: string
  name: string
  model: string
}

// AI 通信标准消息格式
export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_call_id?: string
  tool_calls?: ToolCall[]
  name?: string
  aiconfig?: AIConfigInfo // 消息对应的AI配置信息
}

export type AIMessageHistory = AIMessage[]

// 内部渲染消息格式
export interface RenderMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: RenderNode
  plainContent?: string
  towxmlNodes?: TowxmlNode
  tool_call_id?: string
  tool_calls?: ToolCall[]
  toolConfirmData?: any // 工具确认数据
  aiconfig?: AIConfigInfo // 消息对应的AI配置信息
  createdAt: string
}

export type RenderMessageHistory = RenderMessage[]

// 消息转换器
export class MessageConverter {
  static renderToAI(renderMessage: RenderMessage): AIMessage {
    const content = this.extractPlainText(renderMessage.content) || renderMessage.plainContent || null
    
    return {
      role: renderMessage.role,
      content,
      tool_call_id: renderMessage.tool_call_id,
      tool_calls: renderMessage.tool_calls,
      aiconfig: renderMessage.aiconfig,
    }
  }

  static renderToAIHistory(renderMessages: RenderMessageHistory): AIMessageHistory {
    return renderMessages.map(msg => this.renderToAI(msg))
  }

  static aiToRender(aiMessage: AIMessage, messageId?: string): RenderMessage {
    const content: RenderNode = aiMessage.content || ''
    
    return {
      id: messageId || this.generateMessageId(),
      role: aiMessage.role,
      content,
      plainContent: typeof content === 'string' ? content : this.extractPlainText(content),
      tool_call_id: aiMessage.tool_call_id,
      tool_calls: aiMessage.tool_calls,
      aiconfig: aiMessage.aiconfig,
      createdAt: new Date().toISOString(),
    }
  }

  static aiToRenderHistory(aiMessages: AIMessageHistory): RenderMessageHistory {
    return aiMessages.map(msg => this.aiToRender(msg))
  }

  static extractPlainText(content: RenderNode): string {
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      return content.map(item => this.extractPlainText(item)).join('')
    }

    if (typeof content === 'object' && content !== null) {
      if ('data' in content && typeof (content as any).data === 'object') {
        const data = (content as any).data
        if (data.text) return data.text
        if (data.content) return data.content
        if (data.message) return data.message
        if (data.description) return data.description
      }
      
      if ('render' in content && typeof (content as any).render === 'function') {
        try {
          const rendered = (content as any).render()
          if (typeof rendered === 'string') {
            return rendered.replace(/<[^>]*>/g, '').trim()
          }
        } catch (error) {
          console.warn('提取组件文本内容失败:', error)
        }
      }
      
      try {
        return JSON.stringify(content)
      } catch {
        return '[复杂内容]'
      }
    }

    return String(content)
  }

  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 消息构建器
export class MessageBuilder {
  static createUserMessage(content: string, aiconfig?: AIConfigInfo): RenderMessage {
    return {
      id: MessageConverter.generateMessageId(),
      role: 'user',
      content,
      plainContent: content,
      aiconfig,
      createdAt: new Date().toISOString(),
    }
  }

  static createAssistantMessage(content: RenderNode, toolCalls?: ToolCall[], aiconfig?: AIConfigInfo): RenderMessage {
    return {
      id: MessageConverter.generateMessageId(),
      role: 'assistant',
      content,
      plainContent: MessageConverter.extractPlainText(content),
      tool_calls: toolCalls,
      aiconfig,
      createdAt: new Date().toISOString(),
    }
  }

  static createToolMessage(content: RenderNode, toolCallId: string, aiconfig?: AIConfigInfo): RenderMessage {
    return {
      id: MessageConverter.generateMessageId(),
      role: 'tool',
      content,
      plainContent: MessageConverter.extractPlainText(content),
      tool_call_id: toolCallId,
      aiconfig,
      createdAt: new Date().toISOString(),
    }
  }

  static createSystemMessage(content: string, aiconfig?: AIConfigInfo): RenderMessage {
    return {
      id: MessageConverter.generateMessageId(),
      role: 'system',
      content,
      plainContent: content,
      aiconfig,
      createdAt: new Date().toISOString(),
    }
  }
}

// 向后兼容
/** @deprecated 使用 RenderMessage 替代 */
export interface Message extends RenderMessage {
  towxmlNodes?: TowxmlNode
}

/** @deprecated 使用 MessageConverter.renderToAI 替代 */
export function convertMessageForAI(message: Message): AIMessage {
  return MessageConverter.renderToAI(message)
}
