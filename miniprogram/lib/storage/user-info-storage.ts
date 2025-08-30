// 用户信息存储管理
import { UserInfo, WxUserInfo } from '../types/user-info'

const STORAGE_KEY = 'user_info'

export class UserInfoStorage {
  
  /**
   * 获取用户信息
   */
  static getUserInfo(): UserInfo | null {
    try {
      const data = wx.getStorageSync(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 保存用户信息
   */
  static saveUserInfo(userInfo: UserInfo): boolean {
    try {
      userInfo.updatedAt = Date.now()
      wx.setStorageSync(STORAGE_KEY, JSON.stringify(userInfo))
      return true
    } catch (error) {
      console.error('保存用户信息失败:', error)
      return false
    }
  }

  /**
   * 创建默认用户信息
   */
  static createDefaultUserInfo(): UserInfo {
    const now = Date.now()
    return {
      id: this.generateUserId(),
      nickname: '用户',
      avatar: '',
      isAuthorized: false,
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * 从微信用户信息更新本地用户信息
   */
  static updateFromWxUserInfo(wxUserInfo: WxUserInfo): UserInfo {
    const existingUserInfo = this.getUserInfo() || this.createDefaultUserInfo()
    
    const updatedUserInfo: UserInfo = {
      ...existingUserInfo,
      nickname: wxUserInfo.nickName || existingUserInfo.nickname,
      avatar: wxUserInfo.avatarUrl || existingUserInfo.avatar,
      gender: wxUserInfo.gender,
      language: wxUserInfo.language,
      city: wxUserInfo.city,
      province: wxUserInfo.province,
      country: wxUserInfo.country,
      updatedAt: Date.now()
    }

    this.saveUserInfo(updatedUserInfo)
    return updatedUserInfo
  }

  /**
   * 更新用户昵称
   */
  static updateUserNickname(nickname: string): boolean {
    const userInfo = this.getUserInfo()
    if (!userInfo) {
      return false
    }

    userInfo.nickname = nickname
    return this.saveUserInfo(userInfo)
  }

  /**
   * 更新用户头像
   */
  static updateUserAvatar(avatar: string): boolean {
    const userInfo = this.getUserInfo()
    if (!userInfo) {
      return false
    }

    userInfo.avatar = avatar
    return this.saveUserInfo(userInfo)
  }

  /**
   * 清除用户信息
   */
  static clearUserInfo(): boolean {
    try {
      wx.removeStorageSync(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('清除用户信息失败:', error)
      return false
    }
  }

  /**
   * 检查是否已授权
   */
  static isAuthorized(): boolean {
    const userInfo = this.getUserInfo()
    return userInfo?.isAuthorized || false
  }

  /**
   * 生成用户ID
   */
  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证用户信息
   */
  static validateUserInfo(userInfo: Partial<UserInfo>): { isValid: boolean; message?: string } {
    if (!userInfo.nickname?.trim()) {
      return { isValid: false, message: '请输入用户名' }
    }
    
    if (userInfo.nickname.length > 20) {
      return { isValid: false, message: '用户名不能超过20个字符' }
    }

    return { isValid: true }
  }
}
