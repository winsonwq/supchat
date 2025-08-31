import { ensureProfile, updateMyProfile } from '../../services/auth'
import { ProfileVO } from '../../types/profile'
import { createAsyncThunk } from '../action'
import { Action } from '../types'

export interface UpdateUserProfileParams {
  nickname?: string
  avatar?: string
}

export enum UserActionType {
  UPDATE_PROFILE = 'user/updateProfile',
  FETCH_PROFILE = 'user/fetchProfile',
}

export const updateUserProfile = createAsyncThunk(
  UserActionType.UPDATE_PROFILE,
  async (params: UpdateUserProfileParams) => {
    return (await updateMyProfile(params)) as Partial<ProfileVO>
  },
)

export const fetchProfile = createAsyncThunk(
  UserActionType.FETCH_PROFILE,
  async () => {
    const profile = await ensureProfile()
    return profile
  },
)

export type UserAction =
  | Action<UserActionType.UPDATE_PROFILE, Partial<ProfileVO>>
  | Action<UserActionType.FETCH_PROFILE, ProfileVO>
