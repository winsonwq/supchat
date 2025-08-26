import User from '../models/user.mjs'

// 用户服务类
export class UserService {
  
  /**
   * 根据用户 ID 获取用户信息
   * @param {string} id - 用户 ID
   * @returns {Promise<User|null>} 用户对象，如果不存在则返回 null
   */
  static async getUserById(id) {
    try {
      const user = await User.findById(id)
      return user
    } catch (error) {
      console.error('根据 ID 获取用户失败:', error)
      throw error
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<User>} 创建的用户对象
   */
  static async createUser(userData) {
    try {
      const user = await User.create(userData)
      return user
    } catch (error) {
      console.error('创建用户失败:', error)
      throw error
    }
  }

  /**
   * 删除用户
   * @param {string} id - 用户 ID
   * @returns {Promise<boolean>} 删除成功返回 true，否则返回 false
   */
  static async deleteUser(id) {
    try {
      // 先查找用户是否存在
      const user = await User.findById(id)
      if (!user) {
        return false
      }
      
      // 删除用户
      await user.delete()
      return true
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  }

  /**
   * 更新用户信息
   * @param {string} id - 用户 ID
   * @param {Object} updateData - 要更新的数据
   * @returns {Promise<User|null>} 更新后的用户对象，如果不存在则返回 null
   */
  static async updateUser(id, updateData) {
    try {
      // 先查找用户是否存在
      const user = await User.findById(id)
      if (!user) {
        return null
      }
      
      // 更新用户信息
      await user.update(updateData)
      return user
    } catch (error) {
      console.error('更新用户失败:', error)
      throw error
    }
  }
}

export default UserService
