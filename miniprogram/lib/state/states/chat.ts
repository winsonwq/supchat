import { ChatSession } from '../../types/chat-history'
import { Action } from '../types'

export interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  isLoading: boolean
}

export const initialChatState: ChatState = {
  sessions: [],
  currentSessionId: null,
  isLoading: false,
}

export type ChatAction =
  | Action<'chat/setSessions', ChatSession[]>
  | Action<'chat/addSession', ChatSession>
  | Action<'chat/updateSession', { id: string; updates: Partial<ChatSession> }>
  | Action<'chat/deleteSession', string>
  | Action<'chat/setCurrentSession', string | null>
  | Action<'chat/setLoading', boolean>

export function chatReducer(
  state: ChatState = initialChatState,
  action: ChatAction,
): ChatState {
  switch (action.type) {
    case 'chat/setSessions': {
      return {
        ...state,
        sessions: action.payload,
      }
    }
    case 'chat/addSession': {
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      }
    }
    case 'chat/updateSession': {
      const { id, updates } = action.payload
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === id ? { ...session, ...updates } : session,
        ),
      }
    }
    case 'chat/deleteSession': {
      const sessionId = action.payload
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.id !== sessionId),
        currentSessionId:
          state.currentSessionId === sessionId ? null : state.currentSessionId,
      }
    }
    case 'chat/setCurrentSession': {
      return {
        ...state,
        currentSessionId: action.payload,
      }
    }
    case 'chat/setLoading': {
      return {
        ...state,
        isLoading: action.payload,
      }
    }
    default:
      return state
  }
}
