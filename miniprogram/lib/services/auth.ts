import storage from './storage'

export interface LoginResult {
  userId: string
  openid?: string
}

export interface UserProfile {
  _id?: string
  openid?: string
  nickname?: string
  avatar?: string
  phone?: string
  gender?: number
  country?: string
  province?: string
  city?: string
  language?: string
}

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
