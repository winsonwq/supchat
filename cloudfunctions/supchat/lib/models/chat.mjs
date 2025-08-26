import { db } from '../database.mjs'
import { chatCreateSchema, chatUpdateSchema, safeParse } from '../schemas/chat-schema.mjs'

const COLLECTION_NAME = 'chats'

export class Chat {
  constructor(data = {}) {
    this._id = data._id || null
    this.id = data._id || data.id || null
    this.userId = data.userId || ''
    this.title = data.title || ''
    this.isDeleted = data.isDeleted !== undefined ? data.isDeleted : false
    this.lastMessageAt = data.lastMessageAt ? new Date(data.lastMessageAt) : new Date()
    this.messageCount = Number.isInteger(data.messageCount) ? data.messageCount : 0
    this.lastMessagePreview = data.lastMessagePreview || ''
    this.messagesRecent = Array.isArray(data.messagesRecent) ? data.messagesRecent : []
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date()
  }

  static getCollection() {
    return db.collection(COLLECTION_NAME)
  }

  static from(data = {}) {
    const parsed = safeParse(chatCreateSchema, data)
    if (!parsed.ok) throw new Error(parsed.error)
    return new Chat(parsed.data)
  }

  static async findById(id) {
    const doc = await this.getCollection().doc(id).get()
    return doc && doc.data ? new Chat(doc.data) : null
  }

  static async findByUser(userId, { limit = 20, cursor = null } = {}) {
    let query = this.getCollection()
      .where({ userId, isDeleted: false })
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)

    if (cursor) {
      query = query.where({ lastMessageAt: db.command.lt(new Date(cursor)) })
    }

    const res = await query.get()
    return res.data.map((d) => new Chat(d))
  }

  static async create(data) {
    const parsed = safeParse(chatCreateSchema, data)
    if (!parsed.ok) throw new Error(parsed.error)
    const now = new Date()
    const payload = { ...parsed.data, createdAt: now, updatedAt: now }
    const result = await this.getCollection().add({ data: payload })
    return new Chat({ _id: result._id, ...payload })
  }

  async update(updateData) {
    const parsed = safeParse(chatUpdateSchema, updateData)
    if (!parsed.ok) throw new Error(parsed.error)
    const data = { ...parsed.data, updatedAt: new Date() }
    await Chat.getCollection().doc(this._id).update({ data })
    Object.assign(this, data)
    return this
  }

  async softDelete() {
    await Chat.getCollection().doc(this._id).update({ data: { isDeleted: true, updatedAt: new Date() } })
    this.isDeleted = true
    return true
  }
}

export default Chat


