import { ProfileVO } from '../../types/profile'
import { UserAction, UserActionType } from '../actions/user'

export type UserState = ProfileVO | undefined

export const initialUserState: UserState = {}

export function userReducer(
  state: UserState = initialUserState,
  action: UserAction,
): UserState {
  switch (action.type) {
    case UserActionType.FETCH_PROFILE: {
      return action.payload
    }
    case UserActionType.UPDATE_PROFILE: {
      return {
        ...state,
        ...action.payload,
      }
    }
    default:
      return state
  }
}
