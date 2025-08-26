import { GET, PUT } from '../router.mjs'
import auth from '../middlewares/auth.mjs'
import User from '../models/user.mjs'
import { safeParse, userUpdateSchema } from '../schemas/user-schema.mjs'

export default [
  // 获取当前用户资料
  GET('/users/me', auth, async ({ authUserId }) => {
    try {
      const user = await User.findById(authUserId)
      if (!user) return { error: '用户不存在' }
      return user
    } catch (e) {
      return { error: e.message }
    }
  }),

  // 更新当前用户资料（头像/昵称等）
  PUT('/users/profile', auth, async ({ body, authUserId }) => {
    try {
      const user = await User.findById(authUserId)
      if (!user) return { error: '用户不存在' }
      const allowed = ['nickname', 'avatar', 'gender', 'country', 'province', 'city', 'language']
      const payload = {}
      for (const k of allowed) {
        if (body && body[k] !== undefined) payload[k] = body[k]
      }
      const parsed = safeParse(userUpdateSchema, payload)
      if (!parsed.ok) return { error: parsed.error }
      await user.update(parsed.data)
      return user
    } catch (e) {
      return { error: e.message }
    }
  })
]


