// storage 相关 handlers（ESM）

const storageGet = {
  path: '/storage/get',
  handler: async ({ data }) => {
    const { key, collection = 'default' } = data || {}
    if (!key) {
      throw new Error('Missing key parameter')
    }
    return { data: { key, collection, value: `value_for_${key}` } }
  },
}

const storageCreate = {
  path: '/storage/create',
  handler: async ({ data }) => {
    const { data: itemData, collection = 'default' } = data || {}
    if (!itemData) {
      throw new Error('Missing data parameter')
    }
    const id = `id_${Date.now()}`
    return { id, data: itemData, collection }
  },
}

const storageUpdate = {
  path: '/storage/update',
  handler: async ({ data }) => {
    const { key, data: updateData, collection = 'default' } = data || {}
    if (!key || !updateData) {
      throw new Error('Missing key or data parameter')
    }
    return { success: true, key, collection }
  },
}

const storageDelete = {
  path: '/storage/delete',
  handler: async ({ data }) => {
    const { key, collection = 'default' } = data || {}
    if (!key) {
      throw new Error('Missing key parameter')
    }
    return { success: true, key, collection }
  },
}

const storageBatchGet = {
  path: '/storage/batchGet',
  handler: async ({ data }) => {
    const { keys, collection = 'default' } = data || {}
    if (!keys || !Array.isArray(keys)) {
      throw new Error('Missing keys parameter or keys is not an array')
    }
    const results = keys.map((key) => ({ key, collection, value: `value_for_${key}` }))
    return { data: results }
  },
}

const storageQuery = {
  path: '/storage/query',
  handler: async ({ data }) => {
    const { query, collection = 'default' } = data || {}
    if (!query) {
      throw new Error('Missing query parameter')
    }
    return { data: [{ collection, query, result: 'query_result' }] }
  },
}

export default [
  storageGet,
  storageCreate,
  storageUpdate,
  storageDelete,
  storageBatchGet,
  storageQuery,
]
