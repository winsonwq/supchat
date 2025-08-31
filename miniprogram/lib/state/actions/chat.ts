import { ChatSession } from '../../types/chat-history'
import { RenderMessage } from '../../types/message'
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
  role: 'user' | 'assistant'
  content: string
}

export enum ChatActionType {
  CREATE_CHAT = 'chat/createChat',
  FETCH_CHATS = 'chat/fetchChats',
  UPDATE_CHAT = 'chat/updateChat',
  DELETE_CHAT = 'chat/deleteChat',
  ADD_MESSAGE = 'chat/addMessage',
  SET_CURRENT_CHAT = 'chat/setCurrentChat',
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
    const { chatId, role, content } = params
    const result = await chatService.addMessage({ chatId, role, content })

    return {
      chatId,
      message: result.message,
      chat: result.chat,
    }
  },
)

export const setCurrentChat = createAsyncThunk(
  ChatActionType.SET_CURRENT_CHAT,
  async (chatId: string | null) => {
    if (chatId) {
      await chatService.setActiveChat(chatId)
    }
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
  | Action<ChatActionType.SET_LOADING, boolean>
  | Action<ChatActionType.SET_CHATS, ChatSession[]>
  | Action<ChatActionType.ADD_CHAT, ChatSession>
