import { POST } from '../router.mjs'
import User from '../models/user.mjs'
import { cloud } from '../database.mjs'

// 简化版微信登录：通过 code2Session 获取 openid，查找或创建用户
export default [
  POST('/auth/wechat', async ({ body }) => {
    try {
      const { code } = body || {}
      if (!code) return { error: '缺少 code' }

      // 使用云函数 openapi，无需配置 appid/secret
      const data = await cloud.openapi.auth.code2Session({
        js_code: code,
        grant_type: 'authorization_code'
      })
      if (!data || !data.openid) {
        return { error: data && data.errmsg ? data.errmsg : 'code2Session 失败' }
      }

      const openid = data.openid
      let user = await User.findByOpenid(openid)
      if (!user) {
        user = await User.create({ openid })
      } else {
        await user.updateLastLogin()
      }

      // 简易令牌：直接返回 userId，前端先临时使用；后续可替换为 JWT
      return {
        userId: user._id,
        openid: user.openid
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      return { error: error.message }
    }
  })
]


