import type { UserAction } from '../states/user'
import type { Thunk, AsyncThunk } from '../types'
import { ensureProfile, updateMyProfile, UserProfile } from '../../services/auth'

// 定义更新用户资料的参数类型
export interface UpdateUserProfileParams {
  nickname?: string
  avatar?: string
}

export const setUserProfile = (payload: {
  id?: string
  name?: string
  avatar?: string
  updatedAt?: number
}): UserAction => ({ type: 'user/setProfile', payload })

// 统一的用户资料更新 action
export const updateUserProfile = (params: UpdateUserProfileParams): AsyncThunk<unknown, UserAction, any> => {
  return async (dispatch) => {
    try {
      // 更新资料到云端，并获取结果
      const result = await updateMyProfile(params)
      
      const updatedAt = Date.now()
      const updates: Partial<{ name: string; avatar: string }> = {}
      
      // 根据传入的参数构建更新对象
      if (params.nickname !== undefined) {
        updates.name = params.nickname.trim()
      }
      
      if (params.avatar !== undefined) {
        updates.avatar = params.avatar.trim()
      }
      
      dispatch({
        type: 'user/updateProfile',
        payload: { ...updates, updatedAt },
      })
      
      // 返回 updateMyProfile 的结果
      return result
    } catch (error) {
      console.error('更新用户资料失败:', error)
      throw error
    }
  }
}

// 异步 Action：拉取云端 Profile 并更新到全局状态
export const fetchProfile = (): Thunk<unknown, UserAction, Promise<UserProfile>> => {
  return async (dispatch) => {
    const profile = await ensureProfile()
    dispatch({
      type: 'user/setProfile',
      payload: {
        id: profile._id,
        name: profile.nickname || '用户',
        avatar: profile.avatar || '',
        updatedAt: Date.now(),
      },
    })

    return profile
  }
}


