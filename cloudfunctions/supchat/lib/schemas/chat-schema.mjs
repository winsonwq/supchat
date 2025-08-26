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
export const chatUpdateSchema = chatBaseSchema.partial().extend({
  updatedAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date()).default(new Date()),
})

export { safeParse }

export default {
  chatCreateSchema,
  chatUpdateSchema,
  safeParse
}


