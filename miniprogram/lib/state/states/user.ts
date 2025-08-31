import { ProfileVO } from '../../types/profile'

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
  | { type: 'user/fetchProfile'; payload: ProfileVO }

export function userReducer(
  state: UserState = initialUserState,
  action: UserAction,
): UserState {
  switch (action.type) {
    case 'user/setProfile':
    case 'user/fetchProfile': {
      return action.payload
    }
    case 'user/updateProfile': {
      return {
        ...state,
        ...action.payload,
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
