// storage 相关 handlers（ESM）
import { GET, POST, PUT, DELETE } from '../router.mjs'

export default [
  GET('/storage/:key', async ({ params, method, query }) => {
    const { key, collection = 'default' } = params || {}
    console.log(query)
    return {
      data: { key, collection, value: `value_for_${key}` },
      method,
    }
  }),
  POST('/storage', async ({ data, method }) => {
    const { data: itemData, collection = 'default' } = data || {}
    const id = `id_${Date.now()}`
    return {
      id,
      data: itemData,
      collection,
      method,
    }
  }),
  PUT('/storage/:key', async ({ params, method, data }) => {
    const { key, collection = 'default' } = params || {}
    console.log(data)
    return {
      success: true,
      key,
      collection,
      method,
    }
  }),
  DELETE('/storage/:key', async ({ params, method }) => {
    const { key, collection = 'default' } = params || {}
    return {
      success: true,
      key,
      collection,
      method,
    }
  }),
]
