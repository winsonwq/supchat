import User from '../models/user.mjs'
import { cloud } from '../database.mjs'

export const auth = async (context, next) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    context.profile = await User.findByOpenid(openid)
    context.authUserId = context.profile._id
    return await next()
  } catch (e) {
    return { error: '鉴权失败' }
  }
}

export default auth


