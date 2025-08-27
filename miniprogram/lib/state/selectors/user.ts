import { createSelector } from '../selector'
import type { UserState } from '../states/user'

export const selectUser = (s: UserState) => s
export const selectUserName = (s: UserState) => s.name
export const selectUserAvatar = (s: UserState) => s.avatar
// removed authorized flag

export const selectUserBrief = createSelector<UserState, string, string, { name: string; avatar: string }>(
  [selectUserName, selectUserAvatar],
  (name, avatar) => ({ name, avatar })
)


