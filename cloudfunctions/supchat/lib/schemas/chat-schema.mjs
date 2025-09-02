import { z } from 'zod'
import { safeParse } from './user-schema.mjs'

// Chat 基础字段
export const chatBaseSchema = z.object({
  userId: z.string().min(1, 'userId 必填'),
  title: z.string().default(''),
  isDeleted: z.boolean().default(false),
  lastMessageAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date()),
  messageCount: z.number().int().nonnegative().default(0),
  lastMessagePreview: z.string().default(''),
  messagesRecent: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']).default('user'),
        content: z.string().default(''),
        createdAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date())
      })
    )
    .default([])
})

// 创建 Chat 允许字段
export const chatCreateSchema = chatBaseSchema.extend({
  createdAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date()).default(new Date()),
  updatedAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date()).default(new Date()),
})

// 更新 Chat 全部可选
// 注意：更新时不应应用默认值，否则会把未提供的字段（如 title）重置为空字符串。
// 因此，这里显式定义一个“无默认值”的可选字段对象作为更新 Schema。
export const chatUpdateSchema = z.object({
  userId: z.string().min(1, 'userId 必填').optional(),
  title: z.string().optional(),
  isDeleted: z.boolean().optional(),
  lastMessageAt: z.preprocess((v) => (v ? new Date(v) : undefined), z.date()).optional(),
  messageCount: z.number().int().nonnegative().optional(),
  lastMessagePreview: z.string().optional(),
  messagesRecent: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']).optional(),
        content: z.string().optional(),
        createdAt: z.preprocess((v) => (v ? new Date(v) : undefined), z.date()).optional()
      })
    )
    .optional(),
  updatedAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date()).optional(),
})

export { safeParse }

export default {
  chatCreateSchema,
  chatUpdateSchema,
  safeParse
}


