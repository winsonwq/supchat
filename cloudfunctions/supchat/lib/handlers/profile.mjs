import { GET, PUT, POST } from '../router.mjs'
import auth from '../middlewares/auth.mjs'
import { safeParse, userUpdateSchema } from '../schemas/user-schema.mjs'
import { cloud } from '../database.mjs'
import User from '../models/user.mjs'

export default [
  // 确保用户资料存在，不存在则创建
  POST('/profile/ensure-get', async ({ body }) => {
    try {
      const wxContext = cloud.getWXContext()
      const openid = wxContext.OPENID
      
      if (!openid) {
        return { error: '无法获取微信用户信息' }
      }
      
      // 查找用户，如果不存在则创建
      let user = await User.findByOpenid(openid)
      if (!user) {
        user = await User.create({ openid })
      }
      
      return user
    } catch (e) {
      return { error: e.message }
    }
  }),

  // 获取当前用户资料
  GET('/profile', auth, async ({ profile }) => {
    try {
      if (!profile) return { error: '用户不存在' }
      return profile
    } catch (e) {
      return { error: e.message }
    }
  }),

  // 更新当前用户资料（头像/昵称等）
  PUT('/profile', auth, async ({ body, profile }) => {
    try {
      const user = profile
      if (!user) return { error: '用户不存在' }
      const allowed = ['nickname', 'avatar', 'gender', 'country', 'province', 'city', 'language']
      const payload = {}
      for (const k of allowed) {
        if (body && body[k] !== undefined) payload[k] = body[k]
      }
      // 直接使用 payload，不做 schema 验证
      await user.update(payload)
      return user
    } catch (e) {
      return { error: e.message }
    }
  })
]


