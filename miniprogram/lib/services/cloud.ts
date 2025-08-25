/**
 * 云函数调用封装（接口化），保持与 http.ts 相似的风格
 * 支持 route 与 data 传参，返回 { ok, data, error }
 */

export interface CloudCallConfig {
  name?: string // 云函数名称，默认 'index'
  route: string
  data?: Record<string, unknown>
}

export interface CloudCallResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

export async function callCloudFunction<T = any>(
  config: CloudCallConfig,
): Promise<CloudCallResponse<T>> {
  const { name = 'index', route, data } = config

  if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
    return { ok: false, error: 'wx.cloud.callFunction 不可用' }
  }

  try {
    const res = await wx.cloud.callFunction({
      name,
      data: { route, data },
    })

    const result = (res && (res.result as CloudCallResponse<T>)) || null
    if (!result) return { ok: false, error: '无返回结果' }
    return result
  } catch (e: any) {
    return { ok: false, error: e && e.errMsg ? e.errMsg : String(e) }
  }
}

export default { callCloudFunction }

// 云存储适配器，供 storage 服务使用
// 仅类型导入，避免运行时循环依赖
import type { StorageOptions, StorageResult, StorageAdapter } from './storage'
export class CloudStorageAdapter implements StorageAdapter {
  private cloudFunctionName: string

  constructor(cloudFunctionName: string = 'supchat') {
    this.cloudFunctionName = cloudFunctionName
  }

  private async call<R>(
    route: string,
    body?: unknown,
  ): Promise<StorageResult<R>> {
    const res = await callCloudFunction<R>({
      name: this.cloudFunctionName,
      route,
      data: body as Record<string, unknown>,
    })
    return res as unknown as StorageResult<R>
  }

  async get<T = unknown>(
    key: string,
    options?: StorageOptions,
  ): Promise<StorageResult<T>> {
    const data = { key, collection: options?.collection }
    return this.call<unknown>('/storage/get', data) as Promise<StorageResult<T>>
  }

  async create<T = unknown>(
    data: T,
    options?: StorageOptions,
  ): Promise<StorageResult<T>> {
    const requestData = { data, collection: options?.collection }
    return this.call<unknown>('/storage/create', requestData) as Promise<
      StorageResult<T>
    >
  }

  async update<T = unknown>(
    key: string,
    data: Partial<T>,
    options?: StorageOptions,
  ): Promise<StorageResult<T>> {
    const requestData = { key, data, collection: options?.collection }
    return this.call<unknown>('/storage/update', requestData) as Promise<
      StorageResult<T>
    >
  }

  async delete(
    key: string,
    options?: StorageOptions,
  ): Promise<StorageResult<boolean>> {
    const data = { key, collection: options?.collection }
    return this.call<boolean>('/storage/delete', data)
  }

  async batchGet<T = unknown>(
    keys: string[],
    options?: StorageOptions,
  ): Promise<StorageResult<T[]>> {
    const data = { keys, collection: options?.collection }
    return this.call<unknown[]>('/storage/batchGet', data) as Promise<
      StorageResult<T[]>
    >
  }

  async query<T = unknown>(
    query: Record<string, unknown>,
    options?: StorageOptions,
  ): Promise<StorageResult<T[]>> {
    const data = { query, collection: options?.collection }
    return this.call<unknown[]>('/storage/query', data) as Promise<
      StorageResult<T[]>
    >
  }
}
