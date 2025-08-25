// 路由工具（ESM）：注册、编译、解析与匹配

const routes = []

// 通用路由方法
export const GET = (path, handler) => {
  return { path, method: 'GET', handler }
}

export const POST = (path, handler) => {
  return { path, method: 'POST', handler }
}

export const PUT = (path, handler) => {
  return { path, method: 'PUT', handler }
}

export const DELETE = (path, handler) => {
  return { path, method: 'DELETE', handler }
}

export const PATCH = (path, handler) => {
  return { path, method: 'PATCH', handler }
}

// 路由组功能 - 为多个路由添加共同前缀
export const group = (prefix, routeDefinitions) => {
  return routeDefinitions.map(route => ({
    ...route,
    path: `${prefix}${route.path}`
  }))
}

// 中间件支持
export const withMiddleware = (middleware, routeDefinition) => {
  const originalHandler = routeDefinition.handler
  return {
    ...routeDefinition,
    handler: async (context) => {
      // 执行中间件
      const middlewareResult = await middleware(context)
      if (middlewareResult && middlewareResult.error) {
        return middlewareResult
      }
      // 执行原始处理器
      return await originalHandler(context)
    }
  }
}

// 批量注册路由的便捷方法
export const registerRoutes = (routeDefinitions) => {
  return routeDefinitions.map(def => {
    if (typeof def === 'function') {
      // 如果传入的是函数，假设是路由定义函数
      return def()
    }
    return def
  })
}

// RESTful 资源路由生成器
export const resource = (basePath, handlers) => {
  const routes = []
  
  if (handlers.index) {
    routes.push(GET(basePath, handlers.index))
  }
  
  if (handlers.show) {
    routes.push(GET(`${basePath}/:id`, handlers.show))
  }
  
  if (handlers.create) {
    routes.push(POST(basePath, handlers.create))
  }
  
  if (handlers.update) {
    routes.push(PUT(`${basePath}/:id`, handlers.update))
  }
  
  if (handlers.patch) {
    routes.push(PATCH(`${basePath}/:id`, handlers.patch))
  }
  
  if (handlers.destroy) {
    routes.push(DELETE(`${basePath}/:id`, handlers.destroy))
  }
  
  return routes
}

// 便捷的 CRUD 路由生成器
export const crud = (basePath, controller) => {
  return resource(basePath, {
    index: controller.index || (async ({ query, method }) => ({ message: 'List items', method })),
    show: controller.show || (async ({ params, method }) => ({ id: params.id, method })),
    create: controller.create || (async ({ data, method }) => ({ created: true, data, method })),
    update: controller.update || (async ({ params, data, method }) => ({ id: params.id, updated: true, data, method })),
    destroy: controller.destroy || (async ({ params, method }) => ({ id: params.id, deleted: true, method }))
  })
}

export const register = (pathPattern, handler, method = 'GET') => {
  if (!pathPattern || typeof handler !== 'function') return
  const compiled = compilePath(pathPattern)
  routes.push({ 
    pathPattern, 
    handler, 
    method: method.toUpperCase(),
    ...compiled 
  })
}

export const registerMany = (defs = []) => {
  for (const d of defs) {
    if (!d) continue
    const { path, handler, method = 'GET' } = d
    register(path, handler, method)
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

export const match = (pathname, method = 'GET') => {
  const requestMethod = method.toUpperCase()
  
  for (const r of routes) {
    // 首先检查方法是否匹配
    if (r.method !== requestMethod) continue
    
    const m = pathname.match(r.regex)
    if (m) {
      const params = {}
      r.paramNames.forEach((name, idx) => {
        params[name] = m[idx + 1]
      })
      return { 
        handler: r.handler, 
        params, 
        pathPattern: r.pathPattern,
        method: r.method
      }
    }
  }
  return null
}

// 新增：获取所有注册的路由信息（用于调试）
export const getRoutes = () => {
  return routes.map(r => ({
    path: r.pathPattern,
    method: r.method
  }))
}
