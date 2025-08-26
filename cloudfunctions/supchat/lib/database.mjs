// 微信云开发数据库连接
import cloud from 'wx-server-sdk'

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取数据库实例
export const db = cloud.database()

// 导出云开发实例，以便其他地方使用
export { cloud }

export default db
