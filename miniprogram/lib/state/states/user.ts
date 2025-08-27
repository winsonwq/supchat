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
  | { type: 'user/updateProfile'; payload: { name?: string; avatar?: string; updatedAt?: number } }

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
    case 'user/updateProfile': {
      const { name, avatar, updatedAt } = action.payload
      return {
        ...state,
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        updatedAt: updatedAt ?? Date.now(),
      }
    }
    default:
      return state
  }
}