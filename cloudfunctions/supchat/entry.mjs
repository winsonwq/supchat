import { register, registerMany, parseUrl, match, getRoutes } from './lib/router.mjs'
import builtins from './lib/routes.mjs'

registerMany(builtins || [])

export const entry = async (event, context) => {
  const { route, data, method } = event || {}
  
  if (!route) {
    return { ok: false, error: 'Missing route' }
  }

  const { pathname, query } = parseUrl(route)
  const matched = match(pathname, method)

  console.log('Request:', { route, method, pathname, query })
  console.log('Matched:', matched ? { 
    pathPattern: matched.pathPattern, 
    method: matched.method,
    params: matched.params 
  } : null)

  if (!matched) {
    // 提供更详细的错误信息
    const availableRoutes = getRoutes()
    console.log('Available routes:', availableRoutes)
    
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
      data,
      params: matched.params,
      query,
      path: pathname,
      method: matched.method,
    })
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
