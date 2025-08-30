import { UserInfo } from "../../types/user-info"

export interface UserState {
  _id?: string
  id?: string
  openid?: string
  nickname: string
  avatar: string
  phone?: string
  gender: number
  country?: string
  province?: string
  city?: string
  language?: string
  isActive?: boolean
  createdAt?: number
  updatedAt: number
  lastLoginAt?: number
}

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
  | { type: 'user/setProfile'; payload: UserInfo }
  | { type: 'user/updateProfile'; payload: Partial<UserInfo> }
  | { type: 'user/updateProfile/v2'; payload: Partial<UserInfo> }
  | { type: 'user/updateProfile/error'; payload: string }
  | { type: 'user/updateProfile/v2/error'; payload: string }

export function userReducer(state: UserState = initialUserState, action: UserAction): UserState {
  switch (action.type) {
    case 'user/setProfile': {
      const p = action.payload ?? {}
      return {
        _id: p._id ?? p.id ?? state._id,
        id: p.id ?? p._id ?? state.id,
        openid: p.openid ?? state.openid,
        nickname: (p.nickname !== undefined && p.nickname !== '') ? p.nickname : state.nickname,
        avatar: (p.avatar !== undefined && p.avatar !== '') ? p.avatar : state.avatar,
        phone: p.phone ?? state.phone,
        gender: p.gender ?? state.gender,
        country: p.country ?? state.country,
        province: p.province ?? state.province,
        city: p.city ?? state.city,
        language: p.language ?? state.language,
        isActive: p.isActive ?? state.isActive,
        createdAt: p.createdAt ?? state.createdAt,
        updatedAt: p.updatedAt ?? Date.now(),
        lastLoginAt: p.lastLoginAt ?? state.lastLoginAt,
      }
    }
    case 'user/updateProfile':
    case 'user/updateProfile/v2': {
      const { 
        nickname, 
        avatar, 
        phone,
        gender,
        country,
        province,
        city,
        language,
        isActive,
        updatedAt 
      } = action.payload
      return {
        ...state,
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
        ...(gender !== undefined && { gender }),
        ...(country !== undefined && { country }),
        ...(province !== undefined && { province }),
        ...(city !== undefined && { city }),
        ...(language !== undefined && { language }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: updatedAt ?? Date.now(),
      }
    }
    case 'user/updateProfile/error': {
      // 处理错误状态，可以在这里添加错误处理逻辑
      // 比如设置错误状态、记录日志等
      console.error('用户资料更新失败:', action.payload)
      return state
    }
    default:
      return state
  }
}