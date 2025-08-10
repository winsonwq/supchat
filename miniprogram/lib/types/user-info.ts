// 用户信息类型定义
export interface UserInfo {
  id: string
  name: string
  avatar: string
  avatarUrl?: string // 微信头像URL
  nickName?: string // 微信昵称
  gender?: number // 性别：0-未知，1-男，2-女
  language?: string // 语言
  city?: string // 城市
  province?: string // 省份
  country?: string // 国家
  isAuthorized: boolean // 是否已授权
  createdAt: number
  updatedAt: number
}

export interface WxUserInfo {
  nickName: string
  avatarUrl: string
  gender: number
  language: string
  city: string
  province: string
  country: string
}
