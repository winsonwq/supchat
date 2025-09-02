import { z } from 'zod'
import { safeParse } from './user-schema.mjs'

// Message 基础字段
export const messageBaseSchema = z.object({
  chatId: z.string().min(1, 'chatId 必填'),
  userId: z.string().min(1, 'userId 必填'),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.union([z.string(), z.object({}).passthrough(), z.array(z.any())]).default(''),
  toolCalls: z.any().optional(),
  toolCallId: z.string().optional(),
  toolResult: z.any().optional(),
  isDeleted: z.boolean().default(false),
})

export const messageCreateSchema = messageBaseSchema.extend({
  createdAt: z.preprocess((v) => (v ? new Date(v) : new Date()), z.date()).default(new Date()),
})

export const messageUpdateSchema = messageBaseSchema.partial()

export { safeParse }

export default {
  messageCreateSchema,
  messageUpdateSchema,
  safeParse
}


