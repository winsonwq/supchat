import type { UserAction } from '../states/user'
import type { Thunk } from '../types'
import {
  ensureProfile,
  updateMyProfile,
  UserProfile,
} from '../../services/auth'
import { UserInfo } from '../../types/user-info'
import { createAsyncThunk } from '../action'

export interface UpdateUserProfileParams {
  nickname?: string
  avatar?: string
}

export const setUserProfile = (payload: UserInfo): UserAction => ({
  type: 'user/setProfile',
  payload,
})

export const updateUserProfile = createAsyncThunk<
  UpdateUserProfileParams,
  UserProfile
>('user/updateProfile', async (params: UpdateUserProfileParams) => {
  const result = await updateMyProfile(params)
  return result
})

// 异步 Action：拉取云端 Profile 并更新到全局状态
export const fetchProfile = (): Thunk<
  unknown,
  UserAction,
  Promise<UserProfile>
> => {
  return async (dispatch) => {
    const profile = await ensureProfile()
    dispatch({
      type: 'user/setProfile',
      payload: {
        _id: profile._id,
        id: profile._id,
        openid: profile.openid,
        nickname: profile.nickname || '用户',
        avatar: profile.avatar || '',
        phone: profile.phone,
        gender: profile.gender || 0,
        country: profile.country,
        province: profile.province,
        city: profile.city,
        language: profile.language,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
        updatedAt: Date.now(),
        lastLoginAt: profile.lastLoginAt,
      },
    })

    return profile
  }
}
