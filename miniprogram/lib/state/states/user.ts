import { createStore } from '../store'

export interface UserState {
  id: string
  name: string
  avatar: string
  updatedAt: number
}

export const initialUserState: UserState = {
  id: '',
  name: '用户',
  avatar: '',
  updatedAt: 0,
}

export type UserAction =
  | { type: 'user/setProfile'; payload: { id?: string; name?: string; avatar?: string; updatedAt?: number } }
  | { type: 'user/updateName'; payload: { name: string } }
  | { type: 'user/updateAvatar'; payload: { avatar: string } }
  | { type: 'user/clear' }

export function userReducer(state: UserState = initialUserState, action: UserAction): UserState {
  switch (action.type) {
    case 'user/setProfile': {
      const p = action.payload ?? {}
      return {
        id: p.id ?? state.id,
        name: (p.name !== undefined && p.name !== '') ? p.name : state.name,
        avatar: (p.avatar !== undefined && p.avatar !== '') ? p.avatar : state.avatar,
        updatedAt: p.updatedAt ?? Date.now(),
      }
    }
    case 'user/updateName': {
      const { name } = action.payload
      return { ...state, name, updatedAt: Date.now() }
    }
    case 'user/updateAvatar': {
      const { avatar } = action.payload
      return { ...state, avatar, updatedAt: Date.now() }
    }
    case 'user/clear':
      return { ...initialUserState, updatedAt: Date.now() }
    default:
      return state
  }
}

export const userStore = createStore<UserState, UserAction>({
  reducer: userReducer,
  preloadedState: initialUserState,
  name: 'user',
})


