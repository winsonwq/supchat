import { register, registerMany, parseUrl, match } from './lib/router.mjs'
import builtins from './lib/routes.mjs'

registerMany(builtins || [])

export const entry = async (event, context) => {
  const { route, data } = event || {}
  if (!route) {
    return { ok: false, error: 'Missing route' }
  }

  const { pathname, query } = parseUrl(route)
  const matched = match(pathname)

  if (!matched) {
    return { ok: false, error: `Route not found: ${pathname}` }
  }

  try {
    const result = await matched.handler({
      event,
      context,
      data: data,
      params: matched.params,
      query,
      path: pathname,
    })
    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) }
  }
}

export const __register = register
