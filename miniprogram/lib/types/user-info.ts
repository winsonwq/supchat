// 用户信息类型定义 - 与云函数用户模型保持一致
export interface UserInfo {
  _id?: string
  id?: string // _id的别名，保持兼容性
  openid?: string
  nickname: string
  avatar: string
  phone?: string
  gender: number // 性别：0-未知，1-男，2-女
  country?: string
  province?: string
  city?: string
  language?: string
  isActive?: boolean
  createdAt?: number
  updatedAt?: number
  lastLoginAt?: number
}

// 微信用户信息（用于获取用户授权信息）
export interface WxUserInfo {
  nickName: string
  avatarUrl: string
  gender: number
  language: string
  city: string
  province: string
  country: string
}
