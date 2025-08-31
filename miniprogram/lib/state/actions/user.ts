import { UserAction } from '../states/user'
import {
  ensureProfile,
  updateMyProfile,
} from '../../services/auth'
import { ProfileVO } from '../../types/profile'
import { createAsyncThunk } from '../action'

export interface UpdateUserProfileParams {
  nickname?: string
  avatar?: string
}

export const setUserProfile = (payload: ProfileVO): UserAction => ({
  type: 'user/setProfile',
  payload,
})

export const updateUserProfile = createAsyncThunk
('user/updateProfile', async (params: UpdateUserProfileParams) => {
  return await updateMyProfile(params)
})

// 异步 Action：拉取云端 Profile 并更新到全局状态
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async () => {
    const profile = await ensureProfile()
    return profile
  }
)
