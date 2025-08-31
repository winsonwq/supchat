import { createStore, combineReducers } from '../store'
import {
  userReducer,
  UserState,
  initialUserState
} from './user'
import {
  chatReducer,
  ChatState,
  type ChatAction,
  initialChatState,
} from './chat'
import { UserAction } from '../actions/user'

export interface RootState {
  user: UserState
  chat: ChatState
}

export type RootAction = UserAction | ChatAction
const rootReducer = combineReducers({
  user: userReducer,
  chat: chatReducer,
})

export const rootStore = createStore({
  reducer: rootReducer,
  preloadedState: {
    user: initialUserState,
    chat: initialChatState,
  },
  name: 'root',
})

export const appDispatch = rootStore.dispatch.bind(rootStore)
