// 路由工具（ESM）：注册、编译、解析与匹配

const routes = []

export const register = (pathPattern, handler) => {
  if (!pathPattern || typeof handler !== 'function') return
  const compiled = compilePath(pathPattern)
  routes.push({ pathPattern, handler, ...compiled })
}

export const registerMany = (defs = []) => {
  for (const d of defs) {
    if (!d) continue
    register(d.path || d.name, d.handler)
  }
}

export const compilePath = (pattern) => {
  const segments = String(pattern).split('/').filter(Boolean)
  const paramNames = []
  const regexParts = segments.map((seg) => {
    if (seg.startsWith(':')) {
      const name = seg.slice(1)
      paramNames.push(name)
      return '([^/]+)'
    }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })
  const regex = new RegExp('^/' + regexParts.join('/') + '$')
  return { regex, paramNames }
}

export const parseUrl = (raw) => {
  const [pathname, search = ''] = String(raw).split('?')
  const query = {}
  if (search) {
    const usp = new URLSearchParams(search)
    for (const [k, v] of usp.entries()) {
      if (query[k] === undefined) query[k] = v
      else if (Array.isArray(query[k])) query[k].push(v)
      else query[k] = [query[k], v]
    }
  }
  return { pathname: pathname || '/', query }
}

export const match = (pathname) => {
  for (const r of routes) {
    const m = pathname.match(r.regex)
    if (m) {
      const params = {}
      r.paramNames.forEach((name, idx) => {
        params[name] = m[idx + 1]
      })
      return { handler: r.handler, params, pathPattern: r.pathPattern }
    }
  }
  return null
}
