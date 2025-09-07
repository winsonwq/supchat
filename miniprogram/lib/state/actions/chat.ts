import { ChatSession } from '../../types/chat-history'
import { RenderMessage } from '../../types/message'
import { RenderNode, ToolCall } from '../../mcp/types'
import { createAsyncThunk } from '../action'
import { Action } from '../types'
import chatService from '../../services/chat'

export interface CreateChatParams {
  title?: string
  firstMessage?: Omit<RenderMessage, 'id' | 'timestamp'>
}

export interface UpdateChatParams {
  id: string
  title?: string
}

export interface AddMessageParams {
  chatId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: RenderNode
  tool_calls?: ToolCall[]
  tool_call_id?: string
  aiconfig?: {
    id: string
    name: string
    model: string
  }
}

export enum ChatActionType {
  CREATE_CHAT = 'chat/createChat',
  FETCH_CHATS = 'chat/fetchChats',
  UPDATE_CHAT = 'chat/updateChat',
  DELETE_CHAT = 'chat/deleteChat',
  ADD_MESSAGE = 'chat/addMessage',
  SET_CURRENT_CHAT = 'chat/setCurrentChat',
  SWITCH_TO_CHAT = 'chat/switchToChat',
  SET_ACTIVE_CHAT = 'chat/setActiveChat',
  SET_LOADING = 'chat/setLoading',
  SET_CHATS = 'chat/setChats',
  ADD_CHAT = 'chat/addChat',
}

export const createChat = createAsyncThunk(
  ChatActionType.CREATE_CHAT,
  async (params: CreateChatParams) => {
    return await chatService.createChat(params)
  },
)

export const fetchChats = createAsyncThunk(
  ChatActionType.FETCH_CHATS,
  async () => {
    return await chatService.getChats()
  },
)

export const updateChat = createAsyncThunk(
  ChatActionType.UPDATE_CHAT,
  async (params: UpdateChatParams) => {
    const { id, title } = params
    return await chatService.updateChat(id, { title })
  },
)

export const deleteChat = createAsyncThunk(
  ChatActionType.DELETE_CHAT,
  async (chatId: string) => {
    await chatService.deleteChat(chatId)
    return chatId
  },
)

export const addMessage = createAsyncThunk(
  ChatActionType.ADD_MESSAGE,
  async (params: AddMessageParams) => {
    const { chatId, role, content, tool_calls, tool_call_id, aiconfig } = params
    const result = await chatService.addMessage({ 
      chatId, 
      role, 
      content, 
      tool_calls, 
      tool_call_id,
      aiconfig
    })

    return {
      chatId,
      message: result.message,
      chat: result.chat,
    }
  },
)

/**
 * 切换聊天（获取聊天数据和消息，用于显示）
 * 这个方法只获取数据，不更新数据库状态
 */
export const switchToChat = createAsyncThunk(
  ChatActionType.SWITCH_TO_CHAT,
  async (chatId: string | null) => {
    if (chatId) {
      const chatWithMessages = await chatService.switchToChat(chatId)
      return { chatId, chatWithMessages }
    }
    return { chatId: null, chatWithMessages: null }
  },
)

/**
 * 设置当前活跃聊天（更新数据库中的 isActive 状态）
 * 这个方法用于业务逻辑，比如记录用户最后活跃的聊天
 */
export const setActiveChat = createAsyncThunk(
  ChatActionType.SET_ACTIVE_CHAT,
  async (chatId: string | null) => {
    if (chatId) {
      await chatService.setActiveChat(chatId)
    }
    return chatId
  },
)

/**
 * 设置当前聊天ID（仅更新前端状态，不获取数据）
 * 这个方法用于简单的状态切换，比如从列表中选择聊天
 */
export const setCurrentChat = createAsyncThunk(
  ChatActionType.SET_CURRENT_CHAT,
  async (chatId: string | null) => {
    return chatId
  },
)

export const setLoading = createAsyncThunk(
  ChatActionType.SET_LOADING,
  async (loading: boolean) => {
    return loading
  },
)

export type ChatAction =
  | Action<ChatActionType.CREATE_CHAT, ChatSession>
  | Action<ChatActionType.FETCH_CHATS, ChatSession[]>
  | Action<
      ChatActionType.UPDATE_CHAT,
      { id: string; updates: Partial<ChatSession> }
    >
  | Action<ChatActionType.DELETE_CHAT, string>
  | Action<
      ChatActionType.ADD_MESSAGE,
      { chatId: string; message: any; chat: ChatSession }
    >
  | Action<ChatActionType.SET_CURRENT_CHAT, string | null>
  | Action<ChatActionType.SWITCH_TO_CHAT, { chatId: string | null; chatWithMessages: any }>
  | Action<ChatActionType.SET_ACTIVE_CHAT, string | null>
  | Action<ChatActionType.SET_LOADING, boolean>
  | Action<ChatActionType.SET_CHATS, ChatSession[]>
  | Action<ChatActionType.ADD_CHAT, ChatSession>
