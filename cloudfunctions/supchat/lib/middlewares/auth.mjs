// 简易鉴权中间件：
// - 从 body/query 中提取 userId（后续可替换为 token 解析）
// - 将 userId 注入到 context.authUserId
// - 缺少 userId 时直接拒绝

export const auth = async (context, next) => {
  try {
    const { body, query } = context || {}
    const userId = (body && body.userId) || (query && query.userId)
    if (!userId) {
      return { error: '未授权：缺少 userId' }
    }
    context.authUserId = userId
    return await next()
  } catch (e) {
    return { error: '鉴权失败' }
  }
}

export default auth


