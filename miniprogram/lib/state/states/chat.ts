import { ChatSession } from '../../types/chat-history'
import { ChatActionType, ChatAction } from '../actions/chat'

export interface ChatState {
  chats: ChatSession[]
  currentChatId: string | null
  currentChatWithMessages: any | null // 当前聊天的完整数据（包括消息）
  isLoading: boolean
}

export const initialChatState: ChatState = {
  chats: [],
  currentChatId: null,
  currentChatWithMessages: null,
  isLoading: false,
}

export function chatReducer(
  state: ChatState = initialChatState,
  action: ChatAction,
): ChatState {
  switch (action.type) {
    case ChatActionType.SET_CHATS: {
      return {
        ...state,
        chats: action.payload,
      }
    }
    case ChatActionType.ADD_CHAT: {
      return {
        ...state,
        chats: [action.payload, ...state.chats],
      }
    }
    case ChatActionType.UPDATE_CHAT: {
      const { id, updates } = action.payload
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === id ? { ...chat, ...updates } : chat,
        ),
        // 如果更新的是当前聊天，也要更新当前聊天数据
        currentChatWithMessages: 
          state.currentChatWithMessages?.id === id 
            ? { ...state.currentChatWithMessages, ...updates }
            : state.currentChatWithMessages,
      }
    }
    case ChatActionType.DELETE_CHAT: {
      const chatId = action.payload
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== chatId),
        currentChatId:
          state.currentChatId === chatId ? null : state.currentChatId,
        currentChatWithMessages:
          state.currentChatWithMessages?.id === chatId ? null : state.currentChatWithMessages,
      }
    }
    case ChatActionType.SET_CURRENT_CHAT: {
      return {
        ...state,
        currentChatId: action.payload,
        // 如果设置为 null，清空当前聊天数据
        currentChatWithMessages: action.payload ? state.currentChatWithMessages : null,
      }
    }
    case ChatActionType.SWITCH_TO_CHAT: {
      const { chatId, chatWithMessages } = action.payload
      return {
        ...state,
        currentChatId: chatId,
        currentChatWithMessages: chatWithMessages,
      }
    }
    case ChatActionType.SET_ACTIVE_CHAT: {
      // 这个方法只更新数据库中的 isActive 状态，不影响前端显示
      // 如果需要更新前端状态，可以在成功后调用 fetchChats
      return state
    }
    case ChatActionType.SET_LOADING: {
      return {
        ...state,
        isLoading: action.payload,
      }
    }
    case ChatActionType.FETCH_CHATS: {
      return {
        ...state,
        chats: action.payload,
        isLoading: false,
      }
    }
    case ChatActionType.ADD_MESSAGE: {
      const { chatId, chat } = action.payload
      return {
        ...state,
        chats: state.chats.map((c) => (c.id === chatId ? chat : c)),
        // 如果消息添加到当前聊天，也要更新当前聊天数据
        currentChatWithMessages:
          state.currentChatWithMessages?.id === chatId
            ? { ...state.currentChatWithMessages, messages: [...(state.currentChatWithMessages.messages || []), chat] }
            : state.currentChatWithMessages,
      }
    }
    default:
      return state
  }
}
