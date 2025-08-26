// storage 相关 handlers（ESM）
import { GET, POST, PUT, DELETE } from '../router.mjs'
import db from '../database.mjs'

export default [
  // 获取单个记录
  GET('/storage/:key', async ({ params, method, query }) => {
    try {
      const { key, collection = 'default' } = params || {}
      console.log('GET /storage/:key', { key, collection, query })
      
      const collectionRef = db.collection(collection)
      const result = await collectionRef.doc(key).get()
      
      if (result.data && result.data.length > 0) {
        return {
          data: result.data[0],
          method,
        }
      } else {
        return { error: '记录不存在' }
      }
    } catch (error) {
      console.error('GET /storage/:key error:', error)
      return { error: error.message || '获取记录失败' }
    }
  }),

  // 获取集合列表
  GET('/storage', async ({ method, query }) => {
    try {
      const { collection = 'default', limit = 20, skip = 0 } = query || {}
      console.log('GET /storage', { collection, limit, skip, method })
      
      const collectionRef = db.collection(collection)
      let queryBuilder = collectionRef.limit(parseInt(limit)).skip(parseInt(skip))
      
      const result = await queryBuilder.get()
      
      return {
        data: result.data,
        total: result.data.length,
        method,
      }
    } catch (error) {
      console.error('GET /storage error:', error)
      return { error: error.message || '获取记录列表失败' }
    }
  }),

  // 创建记录
  POST('/storage', async ({ body, method }) => {
    try {
      const { data: itemData, collection = 'default' } = body || {}
      console.log('POST /storage', { itemData, collection, method })
      
      if (!itemData) {
        return { error: '缺少数据' }
      }
      
      const collectionRef = db.collection(collection)
      const now = new Date()
      
      const recordData = {
        ...itemData,
        createdAt: now,
        updatedAt: now,
      }
      
      const result = await collectionRef.add({
        data: recordData
      })
      
      return {
        id: result.id,
        data: { ...recordData, _id: result.id },
        collection,
        method,
      }
    } catch (error) {
      console.error('POST /storage error:', error)
      return { error: error.message || '创建记录失败' }
    }
  }),

  // 更新记录
  PUT('/storage/:key', async ({ params, method, body }) => {
    try {
      const { key, collection = 'default' } = params || {}
      const { data: updateData } = body || {}
      console.log('PUT /storage/:key', { key, collection, updateData, method })
      
      if (!updateData) {
        return { error: '缺少更新数据' }
      }
      
      const collectionRef = db.collection(collection)
      const now = new Date()
      
      const updateResult = await collectionRef.doc(key).update({
        data: {
          ...updateData,
          updatedAt: now,
        }
      })
      
      if (updateResult.stats.updated > 0) {
        // 获取更新后的数据
        const getResult = await collectionRef.doc(key).get()
        const updatedData = getResult.data && getResult.data.length > 0 ? getResult.data[0] : null
        
        return {
          key,
          collection,
          data: updatedData,
          method,
        }
      } else {
        return { error: '记录不存在或更新失败' }
      }
    } catch (error) {
      console.error('PUT /storage/:key error:', error)
      return { error: error.message || '更新记录失败' }
    }
  }),

  // 删除记录
  DELETE('/storage/:key', async ({ params, method }) => {
    try {
      const { key, collection = 'default' } = params || {}
      console.log('DELETE /storage/:key', { key, collection, method })
      
      const collectionRef = db.collection(collection)
      const result = await collectionRef.doc(key).remove()
      
      if (result.stats.removed > 0) {
        return {
          key,
          collection,
          data: true,
          method,
        }
      } else {
        return { error: '记录不存在或删除失败' }
      }
    } catch (error) {
      console.error('DELETE /storage/:key error:', error)
      return { error: error.message || '删除记录失败' }
    }
  }),

  // 健康检查端点
  GET('/health', async ({ method }) => {
    try {
      // 简单的数据库连接测试
      const result = await db.collection('_health_check').limit(1).get()
      return {
        data: { status: 'healthy', timestamp: new Date().toISOString() },
        method,
      }
    } catch (error) {
      console.error('Health check error:', error)
      return { error: error.message || '健康检查失败' }
    }
  }),
]
