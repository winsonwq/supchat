import UserService from '../services/user-service.mjs'
import { userCreateSchema, userUpdateSchema, safeParse } from '../schemas/user-schema.mjs'
import { GET, POST, PUT, DELETE } from '../router.mjs'

// 用户相关路由处理器
export default [
  // 根据 ID 查询用户
  GET('/users/:id', async ({ params, method }) => {
    try {
      const { id } = params
      
      if (!id) {
        return { error: '缺少用户 ID 参数' }
      }
      
      const user = await UserService.getUserById(id)
      
      if (!user) {
        return { error: '用户不存在' }
      }
      
      return user
    } catch (error) {
      console.error('查询用户失败:', error)
      return { error: error.message }
    }
  }),

  // 创建用户
  POST('/users', async ({ body, method }) => {
    try {
      const raw = body
      if (!raw) {
        return { error: '缺少用户数据' }
      }
      const parsed = safeParse(userCreateSchema, raw)
      if (!parsed.ok) {
        return { error: parsed.error }
      }
      const user = await UserService.createUser(parsed.data)
      
      return user
    } catch (error) {
      console.error('创建用户失败:', error)
      return { error: error.message }
    }
  }),

  // 更新用户
  PUT('/users/:id', async ({ params, body, method }) => {
    try {
      const { id } = params
      const raw = body
      
      if (!id) {
        return { error: '缺少用户 ID 参数' }
      }
      
      if (!raw) {
        return { error: '缺少更新数据' }
      }
      const parsed = safeParse(userUpdateSchema, raw)
      if (!parsed.ok) {
        return { error: parsed.error }
      }
      
      const user = await UserService.updateUser(id, parsed.data)
      
      if (!user) {
        return { error: '用户不存在或更新失败' }
      }
      
      return user
    } catch (error) {
      console.error('更新用户失败:', error)
      return { error: error.message }
    }
  }),

  // 删除用户
  DELETE('/users/:id', async ({ params, method }) => {
    try {
      const { id } = params
      
      if (!id) {
        return { error: '缺少用户 ID 参数' }
      }
      
      const result = await UserService.deleteUser(id)
      
      if (!result) {
        return { error: '用户不存在或删除失败' }
      }
      
      return { message: '用户删除成功', id }
    } catch (error) {
      console.error('删除用户失败:', error)
      return { error: error.message }
    }
  })
]
