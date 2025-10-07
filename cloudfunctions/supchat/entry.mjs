import { register, registerMany, parseUrl, match, getRoutes } from './lib/router.mjs'
import builtins from './lib/routes.mjs'

registerMany(builtins || [])

export const entry = async (event, context) => {
  const { route, body, method } = event || {}
  
  if (!route) {
    return { ok: false, error: 'Missing route' }
  }

  const { pathname, query } = parseUrl(route)
  const matched = match(pathname, method)

  if (!matched) {
    // 提供更详细的错误信息
    const availableRoutes = getRoutes()
    return { 
      ok: false, 
      error: `Route not found: ${method} ${pathname}`,
      availableRoutes: availableRoutes.filter(r => r.path === pathname)
    }
  }

  try {
    const result = await matched.handler({
      event,
      context,
      body,
      params: matched.params,
      query,
      path: pathname,
      method: matched.method,
    })
    
    // 检查handler返回的结果是否包含错误信息
    if (result && typeof result === 'object' && result.error) {
      return { ok: false, error: result.error }
    }
    
    return { ok: true, data: result }
  } catch (err) {
    console.error('Handler error:', err)
    return { 
      ok: false, 
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack : undefined
    }
  }
}

export const __register = register
