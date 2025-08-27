import type { UserAction } from '../states/user'
import type { Thunk } from '../types'
import { ensureProfile } from '../../services/auth'

export const setUserProfile = (payload: {
  id?: string
  name?: string
  avatar?: string
  updatedAt?: number
}): UserAction => ({ type: 'user/setProfile', payload })

export const updateUserName = (name: string): UserAction => ({
  type: 'user/updateName',
  payload: { name },
})

export const updateUserAvatar = (avatar: string): UserAction => ({
  type: 'user/updateAvatar',
  payload: { avatar },
})

export const clearUser = (): UserAction => ({ type: 'user/clear' })

// 异步 Action：拉取云端 Profile 并更新到全局状态
export const fetchProfile = (): Thunk<unknown, UserAction, Promise<void>> => {
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
  }
}


