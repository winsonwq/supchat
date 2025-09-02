import { db } from '../database.mjs'
import { messageCreateSchema, messageUpdateSchema, safeParse } from '../schemas/message-schema.mjs'

const COLLECTION_NAME = 'messages'

export class Message {
  constructor(data = {}) {
    this._id = data._id || null
    this.id = data._id || data.id || null
    this.chatId = data.chatId || ''
    this.userId = data.userId || ''
    this.role = data.role || 'user'
    this.content = data.content || ''
    this.toolCalls = data.toolCalls
    this.toolCallId = data.toolCallId
    this.toolResult = data.toolResult
    this.isDeleted = data.isDeleted !== undefined ? data.isDeleted : false
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
  }

  static getCollection() {
    return db.collection(COLLECTION_NAME)
  }

  static from(data = {}) {
    const parsed = safeParse(messageCreateSchema, data)
    if (!parsed.ok) throw new Error(parsed.error)
    return new Message(parsed.data)
  }

  static async findByChat(chatId, { limit = 20, cursor = null, order = 'asc' } = {}) {
    let query = this.getCollection()
      .where({ chatId, isDeleted: false })
      .orderBy('createdAt', order === 'asc' ? 'asc' : 'desc')
      .limit(limit)

    if (cursor) {
      const op = order === 'asc' ? db.command.gt : db.command.lt
      query = query.where({ createdAt: op(new Date(cursor)) })
    }

    const res = await query.get()
    return res.data.map((d) => new Message(d))
  }

  static async create(data) {
    const parsed = safeParse(messageCreateSchema, data)
    if (!parsed.ok) throw new Error(parsed.error)
    const payload = { ...parsed.data, createdAt: new Date() }
    const result = await this.getCollection().add({ data: payload })
    return new Message({ _id: result._id, ...payload })
  }

  async update(updateData) {
    const parsed = safeParse(messageUpdateSchema, updateData)
    if (!parsed.ok) throw new Error(parsed.error)
    const data = { ...parsed.data }
    await Message.getCollection().doc(this._id).update({ data })
    Object.assign(this, data)
    return this
  }

  async softDelete() {
    await Message.getCollection().doc(this._id).update({ data: { isDeleted: true } })
    this.isDeleted = true
    return true
  }
}

export default Message


