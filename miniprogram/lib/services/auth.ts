import storage from './storage'
import { UserInfo } from '../types/user-info'

export interface LoginResult {
  userId: string
  openid?: string
}

// UserProfile 现在与 UserInfo 保持一致，使用类型别名保持向后兼容
export type UserProfile = UserInfo

export async function bindPhone(
  userId: string,
  eventCode: string,
): Promise<{ userId: string; phone: string }> {
  const res = await storage.create<any>('/auth/phone', {
    userId,
    code: eventCode,
  })
  if (!res.ok || !res.data) throw new Error(res.error || '绑定手机号失败')
  return res.data as { userId: string; phone: string }
}

export async function ensureProfile(): Promise<UserProfile> {
  const res = await storage.create<any>('/profile/ensure-get', {})
  if (!res.ok || !res.data) throw new Error(res.error || '确保用户资料失败')
  return res.data as UserProfile
}

export async function getMyProfile(): Promise<UserProfile> {
  const res = await storage.get<any>(`/profile`)
  if (!res.ok || !res.data) throw new Error(res.error || '获取资料失败')
  return res.data as UserProfile
}

export async function updateMyProfile(
  profile: Partial<UserProfile>,
): Promise<UserProfile> {
  const res = await storage.update<any>('/profile', profile)
  if (!res.ok || !res.data) throw new Error(res.error || '更新资料失败')
  return res.data as UserProfile
}

export function needProfileGuide(profile?: UserProfile | null): boolean {
  if (!profile) return true
  const hasNickname = !!(profile.nickname && profile.nickname.trim())
  const hasAvatar = !!(profile.avatar && profile.avatar.trim())
  return !(hasNickname && hasAvatar)
}
