import { z } from 'zod'

// 性别：0 未知，1 男，2 女
export const userBaseSchema = z.object({
  openid: z.string().min(1, 'openid 必填'),
  nickname: z.string().default(''),
  avatar: z.string().default(''),
  phone: z.string().default(''),
  gender: z.number().int().min(0).max(2).default(0),
  country: z.string().default(''),
  province: z.string().default(''),
  city: z.string().default(''),
  language: z.string().default('zh_CN'),
  isActive: z.boolean().default(true)
})

// 创建用户时允许的字段（由默认值填充缺省）
export const userCreateSchema = userBaseSchema

// 更新用户时不做 schema 验证，直接使用传入的值
export const userUpdateSchema = z.any()

export function safeParse(schema, data) {
  const result = schema.safeParse(data || {})
  if (!result.success) {
    const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    return { ok: false, error: message }
  }
  return { ok: true, data: result.data }
}

export default {
  userCreateSchema,
  userUpdateSchema,
  safeParse
}


