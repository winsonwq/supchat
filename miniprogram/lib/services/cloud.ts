/**
 * 云函数调用封装（接口化），保持与 http.ts 相似的风格
 * 支持 route 与 data 传参，返回 { ok, data, error }
 */

export interface CloudCallConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  name?: string // 云函数名称，默认 'index'
  route: string
  body?: Record<string, unknown>
}

export interface CloudCallResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

export async function callCloudFunction<T = any>(
  config: CloudCallConfig,
): Promise<CloudCallResponse<T>> {
  const { name = 'index', route, body, method = 'POST' } = config

  if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
    return { ok: false, error: 'wx.cloud.callFunction 不可用' }
  }

  try {
    const res = await wx.cloud.callFunction({
      name,
      data: { route, method, body },
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
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: unknown,
  ): Promise<StorageResult<R>> {
    const res = await callCloudFunction<R>({
      name: this.cloudFunctionName,
      route: path,
      method,
      body: body as Record<string, unknown>,
    })
    return res as unknown as StorageResult<R>
  }

  async get<T = unknown>(
    path: string,
    options?: StorageOptions,
  ): Promise<StorageResult<T>> {
    const data = { collection: options?.collection }
    return this.call<T>('GET', path, data)
  }

  async create<T = unknown>(
    path: string,
    data: T,
  ): Promise<StorageResult<T>> {
    return this.call<T>('POST', path, data)
  }

  async update<T = unknown>(
    path: string,
    data: Partial<T>,
  ): Promise<StorageResult<T>> {
    return this.call<T>('PUT', path, data)
  }

  async delete(
    path: string,
  ): Promise<StorageResult<boolean>> {
    return this.call<boolean>('DELETE', path)
  }
}
