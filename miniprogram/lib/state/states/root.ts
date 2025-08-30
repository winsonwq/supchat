import { createStore, combineReducers } from '../store'
import {
  userReducer,
  UserState,
  type UserAction,
  initialUserState,
} from './user'

export interface RootState {
  user: UserState
}

const rootReducer = combineReducers<RootState, UserAction>({
  user: userReducer,
})

export const rootStore = createStore<RootState, UserAction>({
  reducer: rootReducer,
  preloadedState: {
    user: initialUserState,
  },
  name: 'root',
})

export const appDispatch = rootStore.dispatch.bind(rootStore)
