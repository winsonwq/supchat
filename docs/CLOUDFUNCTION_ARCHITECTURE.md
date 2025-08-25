# SupChat 云函数架构说明

> 📚 **文档状态：开发中** 📚
> 
> 本文档描述了 SupChat 项目的云函数架构、支持的功能和API接口。

## 概述

SupChat 云函数采用模块化、路由化的架构设计，提供了灵活的服务端能力扩展。当前主要支持数据存储服务，为小程序提供云端数据持久化能力。

> **⚠️ 重要说明**：当前云函数实现为测试版本，所有路由处理器都返回模拟数据，主要用于验证架构设计和API接口的正确性。在生产环境中需要连接真实的数据库和业务逻辑。

## 架构设计

### 设计理念

SupChat 云函数采用**模拟HTTP API**的架构设计，在微信云函数环境中实现了类似Web框架的路由系统。

#### 核心优势

- **🚀 开发体验**：使用熟悉的HTTP方法定义接口
- **🔧 易于扩展**：模块化的路由系统
- **📖 学习成本低**：对于Web开发者几乎零学习成本

### 核心架构

```
cloudfunctions/supchat/
├── entry.mjs              # 云函数入口文件
├── lib/
│   ├── router.mjs         # 路由系统核心
│   ├── routes.mjs         # 路由注册
│   └── handlers/
│       └── storage.mjs    # 存储服务
└── package.json
```

### 路由系统

云函数采用**模拟HTTP API**的路由系统设计，支持路径参数和查询参数。

#### 设计特色

- **🎯 模拟HTTP定义**：使用 `GET()`, `POST()`, `PUT()`, `DELETE()` 定义路由
- **📝 路径参数**：`/storage/:key` 自动解析到 `params` 对象
- **🔍 查询参数**：支持 `?key=value` 格式，自动解析到 `query` 对象

#### 路由定义示例

```javascript
GET('/storage/:key', async ({ params, query }) => {
  const { key } = params        // 路径参数
  const { type } = query        // 查询参数
  return { data: { key, type } }
})

POST('/storage', async ({ data }) => {
  return { created: true, data }
})
```

### 请求处理流程

1. **请求解析**：解析路由、方法、参数
2. **路由匹配**：根据路径和方法匹配处理器
3. **参数提取**：提取路径参数、查询参数、请求体
4. **处理器执行**：执行业务逻辑
5. **响应返回**：统一格式响应 `{ ok: true, data: result }`

## 当前支持的功能

### 1. 数据存储服务 (Storage Service) ⚠️ 测试实现

> **注意**：当前的数据存储服务仅为测试实现，返回模拟数据，尚未连接真实的数据库。

提供云端数据存储能力，支持基本的CRUD操作。

#### API 接口

| 方法 | 路径 | 描述 | 参数 |
|------|------|------|------|
| GET | `/storage/:key` | 获取数据 | `key`: 数据键名<br>`collection`: 集合名称(可选) |
| POST | `/storage` | 创建数据 | `data`: 要存储的数据<br>`collection`: 集合名称(可选) |
| PUT | `/storage/:key` | 更新数据 | `key`: 数据键名<br>`data`: 更新数据<br>`collection`: 集合名称(可选) |
| DELETE | `/storage/:key` | 删除数据 | `key`: 数据键名<br>`collection`: 集合名称(可选) |

#### 请求示例

```javascript
// 获取数据
const result = await wx.cloud.callFunction({
  name: 'supchat',
  data: {
    route: '/storage/user-profile',
    method: 'GET',
    data: { collection: 'users' }
  }
})

// 创建数据
const result = await wx.cloud.callFunction({
  name: 'supchat',
  data: {
    route: '/storage',
    method: 'POST',
    data: {
      data: { name: '张三', age: 25 },
      collection: 'users'
    }
  }
})
```

#### 响应格式

```javascript
// 成功响应
{
  ok: true,
  data: {
    // 具体的数据内容
  }
}

// 错误响应
{
  ok: false,
  error: "错误信息描述"
}
```

## 客户端集成

### 云函数调用封装

```typescript
import { callCloudFunction } from './lib/services/cloud'

const result = await callCloudFunction({
  route: '/storage/user-data',
  method: 'GET',
  data: { collection: 'users' }
})
```

## 扩展开发

### 添加新的处理器

1. **创建处理器文件**：

```javascript
// lib/handlers/new-service.mjs
import { GET, POST, PUT, DELETE } from '../router.mjs'

export default [
  GET('/new-service/:id', async ({ params }) => {
    return { data: { id: params.id } }
  }),
  
  POST('/new-service', async ({ data }) => {
    return { success: true, data }
  }),
  
  PUT('/new-service/:id', async ({ params, data }) => {
    return { success: true, id: params.id, data }
  }),
  
  DELETE('/new-service/:id', async ({ params }) => {
    return { success: true, id: params.id }
  }),
]
```

2. **注册到路由系统**：

```javascript
// lib/routes.mjs
import storageHandlers from './handlers/storage.mjs'
import newServiceHandlers from './handlers/new-service.mjs'

export default [...storageHandlers, ...newServiceHandlers]
```

### 路由系统特性

#### 路径参数支持

```javascript
GET('/users/:userId/posts/:postId', async ({ params }) => {
  const { userId, postId } = params
  return { userId, postId }
})
```

#### 中间件支持

```javascript
import { withMiddleware } from '../router.mjs'

const authMiddleware = async (context) => {
  if (!context.data.token) {
    return { error: '未授权访问' }
  }
  return null
}

const protectedRoute = withMiddleware(authMiddleware, 
  GET('/protected', async () => ({ message: '受保护的数据' }))
)
```

#### RESTful 资源路由

```javascript
import { resource } from '../router.mjs'

const userResource = resource('/users', {
  index: async () => ({ users: [] }),                    // GET /users
  show: async ({ params }) => ({ user: params.id }),     // GET /users/:id
  create: async ({ data }) => ({ created: true, data }), // POST /users
  update: async ({ params, data }) => ({ updated: true, id: params.id, data }), // PUT /users/:id
  destroy: async ({ params }) => ({ deleted: true, id: params.id })             // DELETE /users/:id
})
```

## 部署和配置

### 环境要求

- 微信云开发环境
- Node.js 18+
- 支持 ES Modules

### 测试环境说明

当前云函数为测试版本，用于验证路由系统、API接口格式和客户端调用。

### 部署步骤

1. **上传云函数**：在微信开发者工具中右键 `cloudfunctions/supchat` 目录，选择"上传并部署"

2. **配置云环境**：确保小程序已开通云开发，配置云环境ID

3. **初始化云能力**：
   ```javascript
   // app.ts
   if (wx.cloud && typeof wx.cloud.init === 'function') {
     wx.cloud.init({ env: 'your-env-id', traceUser: true })
   }
   ```

### 环境变量配置

```javascript
const config = {
  database: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
}
```

## 错误处理

### 统一错误响应

```javascript
// 成功响应
{ ok: true, data: result }

// 错误响应
{ ok: false, error: "错误描述" }
```

## 性能优化

### 冷启动优化

- 使用 ES Modules 减少解析时间
- 模块化设计，按需加载处理器

### 内存管理

- 及时释放大型对象引用
- 避免内存泄漏



## 监控和日志

### 日志记录

```javascript
console.log('Request:', { route, method, pathname, query })
console.error('Handler error:', err)
```

### 云开发监控

- 使用微信云开发控制台监控云函数调用
- 查看错误日志和性能指标

## 相关文档

- [SupChat 主文档](../README.md)
- [MCP 工具架构](./MCP_ARCHITECTURE.md)
- [组件系统说明](./COMPONENT_SYSTEM.md)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

---

**最后更新**：2024年12月

**维护者**：SupChat 开发团队
