import { createSelector } from '../selector'
import type { UserState } from '../states/user'

export const selectUser = (s: UserState) => s
export const selectUserId = (s: UserState) => s.id || s._id
export const selectUserNickname = (s: UserState) => s.nickname
export const selectUserAvatar = (s: UserState) => s.avatar
export const selectUserProfile = (s: UserState) => s
// removed authorized flag

export const selectUserBrief = createSelector<UserState, string, string, { name: string; avatar: string }>(
  [selectUserNickname, selectUserAvatar],
  (name, avatar) => ({ name, avatar })
)


