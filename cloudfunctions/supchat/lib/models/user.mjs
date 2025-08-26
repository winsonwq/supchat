import { db } from '../database.mjs'

// 用户集合名称
const COLLECTION_NAME = 'users'

// 用户数据模型
export class User {
  constructor(data = {}) {
    this._id = data._id || null
    this.id = data._id || data.id || null // 添加id字段作为_id的别名
    this.openid = data.openid || ''
    this.nickname = data.nickname || ''
    this.avatar = data.avatar || ''
    this.gender = data.gender || 0 // 0: 未知, 1: 男, 2: 女
    this.country = data.country || ''
    this.province = data.province || ''
    this.city = data.city || ''
    this.language = data.language || 'zh_CN'
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
    this.lastLoginAt = data.lastLoginAt || new Date()
    this.isActive = data.isActive !== undefined ? data.isActive : true
  }

  // 获取用户集合引用
  static getCollection() {
    return db.collection(COLLECTION_NAME)
  }

  // 根据 openid 查找用户
  static async findByOpenid(openid) {
    try {
      const collection = this.getCollection()
      const user = await collection.where({
        openid: openid
      }).get()
      
      return user.data.length > 0 ? new User(user.data[0]) : null
    } catch (error) {
      console.error('查找用户失败:', error)
      throw error
    }
  }

  // 根据 ID 查找用户
  static async findById(id) {
    try {
      const collection = this.getCollection()
      const user = await collection.doc(id).get()
      
      return user.data ? new User(user.data) : null
    } catch (error) {
      console.error('根据ID查找用户失败:', error)
      throw error
    }
  }

  // 创建新用户
  static async create(userData) {
    try {
      const collection = this.getCollection()
      
      // 准备要插入的数据，不包含_id字段，让数据库自动生成
      const userToInsert = {
        openid: userData.openid || '',
        nickname: userData.nickname || '',
        avatar: userData.avatar || '',
        gender: userData.gender || 0,
        country: userData.country || '',
        province: userData.province || '',
        city: userData.city || '',
        language: userData.language || 'zh_CN',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: userData.isActive !== undefined ? userData.isActive : true
      }
      
      const result = await collection.add({
        data: userToInsert
      })
      
      // 创建用户对象，包含数据库生成的_id
      const user = new User({
        _id: result._id,
        ...userToInsert
      })
      
      return user
    } catch (error) {
      console.error('创建用户失败:', error)
      throw error
    }
  }

  // 更新用户信息
  async update(updateData) {
    try {
      const collection = User.getCollection()
      const updateInfo = {
        ...updateData,
        updatedAt: new Date()
      }
      
      await collection.doc(this._id).update({
        data: updateInfo
      })
      
      // 更新本地数据
      Object.assign(this, updateInfo)
      return this
    } catch (error) {
      console.error('更新用户失败:', error)
      throw error
    }
  }

  // 更新最后登录时间
  async updateLastLogin() {
    return this.update({
      lastLoginAt: new Date()
    })
  }

  // 删除用户
  async delete() {
    try {
      const collection = User.getCollection()
      await collection.doc(this._id).remove()
      return true
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  }

  // 获取所有活跃用户
  static async findActiveUsers(limit = 100) {
    try {
      const collection = this.getCollection()
      const users = await collection
        .where({
          isActive: true
        })
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
      
      return users.data.map(user => new User(user))
    } catch (error) {
      console.error('获取活跃用户失败:', error)
      throw error
    }
  }

  // 根据条件查询用户
  static async findByCondition(condition, limit = 100) {
    try {
      const collection = this.getCollection()
      let query = collection
      
      // 构建查询条件
      Object.keys(condition).forEach(key => {
        query = query.where({
          [key]: condition[key]
        })
      })
      
      const users = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
      
      return users.data.map(user => new User(user))
    } catch (error) {
      console.error('条件查询用户失败:', error)
      throw error
    }
  }
}

export default User
