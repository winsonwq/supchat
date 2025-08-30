import { ProfileVO } from '../../types/profile'

// UserState 直接使用 ProfileVO，避免重复定义
export type UserState = ProfileVO

export const initialUserState: UserState = {
  _id: '',
  id: '',
  openid: '',
  nickname: '用户',
  avatar: '',
  phone: '',
  gender: 0,
  country: '',
  province: '',
  city: '',
  language: 'zh_CN',
  isActive: true,
  createdAt: 0,
  updatedAt: 0,
  lastLoginAt: 0,
}

export type UserAction =
  | { type: 'user/setProfile'; payload: ProfileVO }
  | { type: 'user/updateProfile'; payload: Partial<ProfileVO> }
  | { type: 'user/updateProfile/error'; payload: string }
  | { type: 'user/updateProfile/v2/error'; payload: string }

export function userReducer(
  state: UserState = initialUserState,
  action: UserAction,
): UserState {
  switch (action.type) {
    case 'user/setProfile': {
      return action.payload
    }
    case 'user/updateProfile': {
      const { updatedAt } = action.payload
      return {
        ...state,
        ...action.payload,
        updatedAt: updatedAt ?? Date.now(),
      }
    }
    case 'user/updateProfile/error': {
      console.error('用户资料更新失败:', action.payload)
      return state
    }
    default:
      return state
  }
}
