import { POST } from '../router.mjs'
import User from '../models/user.mjs'
import { cloud } from '../database.mjs'

// 简化版微信登录：通过 code2Session 获取 openid，查找或创建用户
export default [
  POST('/auth/wechat', async ({ body }) => {
    try {
      const { code } = body || {}
      if (!code) return { error: '缺少 code' }

      const wxContext = cloud.getWXContext()
      const openid = wxContext.OPENID

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
  ,
  // 绑定手机号
  POST('/auth/phone', async ({ body }) => {
    try {
      const { code, userId } = body || {}
      if (!code) return { error: '缺少 code' }
      if (!userId) return { error: '缺少 userId' }

      const resp = await cloud.openapi.phonenumber.getPhoneNumber({ code })
      const phoneInfo = resp && resp.phoneInfo
      const phoneNumber = phoneInfo && (phoneInfo.purePhoneNumber || phoneInfo.phoneNumber)
      if (!phoneNumber) return { error: '获取手机号失败' }

      const user = await User.findById(userId)
      if (!user) return { error: '用户不存在' }
      await user.update({ phone: phoneNumber })
      return { userId: user._id, phone: user.phone }
    } catch (error) {
      console.error('绑定手机号失败:', error)
      return { error: error.message }
    }
  })
]


