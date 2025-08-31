import { RootState } from '../states/root'

export const selectChats = (state: RootState) => state.chat.chats

export const selectCurrentChatId = (state: RootState) => state.chat.currentChatId

export const selectCurrentChat = (state: RootState) => {
  const currentId = state.chat.currentChatId
  return currentId ? state.chat.chats.find(chat => chat.id === currentId) : null
}

export const selectCurrentChatWithMessages = (state: RootState) => {
  return state.chat.currentChatWithMessages
}

export const selectChatById = (state: RootState, chatId: string) => {
  return state.chat.chats.find(chat => chat.id === chatId)
}

export const selectChatsLoading = (state: RootState) => state.chat.isLoading

export const selectActiveChat = (state: RootState) => {
  return state.chat.chats.find(chat => chat.isActive)
}

// 获取当前聊天的消息列表
export const selectCurrentChatMessages = (state: RootState) => {
  return state.chat.currentChatWithMessages?.messages || []
}

// 检查是否有当前聊天
export const selectHasCurrentChat = (state: RootState) => {
  return !!state.chat.currentChatWithMessages
}
