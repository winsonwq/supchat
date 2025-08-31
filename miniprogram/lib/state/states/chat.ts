import { ChatSession } from '../../types/chat-history'
import { ChatActionType, ChatAction } from '../actions/chat'

export interface ChatState {
  chats: ChatSession[]
  currentChatId: string | null
  isLoading: boolean
}

export const initialChatState: ChatState = {
  chats: [],
  currentChatId: null,
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
      }
    }
    case ChatActionType.DELETE_CHAT: {
      const chatId = action.payload
      return {
        ...state,
        chats: state.chats.filter((chat) => chat.id !== chatId),
        currentChatId:
          state.currentChatId === chatId ? null : state.currentChatId,
      }
    }
    case ChatActionType.SET_CURRENT_CHAT: {
      return {
        ...state,
        currentChatId: action.payload,
      }
    }
    case ChatActionType.SET_LOADING: {
      return {
        ...state,
        isLoading: action.payload,
      }
    }
    case ChatActionType.ADD_MESSAGE: {
      const { chatId, chat } = action.payload
      return {
        ...state,
        chats: state.chats.map((c) => (c.id === chatId ? chat : c)),
      }
    }
    default:
      return state
  }
}
