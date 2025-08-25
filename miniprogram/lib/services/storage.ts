/**
 * 统一存储服务
 * 支持云函数和本地存储的统一接口
 */

// 存储适配器接口
export interface StorageAdapter {
  get<T = unknown>(key: string, options?: StorageOptions): Promise<StorageResult<T>>
  create<T = unknown>(data: T, options?: StorageOptions): Promise<StorageResult<T>>
  update<T = unknown>(key: string, data: Partial<T>, options?: StorageOptions): Promise<StorageResult<T>>
  delete(key: string, options?: StorageOptions): Promise<StorageResult<boolean>>
  batchGet<T = unknown>(keys: string[], options?: StorageOptions): Promise<StorageResult<T[]>>
  query<T = unknown>(query: Record<string, unknown>, options?: StorageOptions): Promise<StorageResult<T[]>>
}

// 存储选项
export interface StorageOptions {
  collection?: string
  adapter?: 'cloud' | 'local'
  [key: string]: any
}

// 存储结果
export interface StorageResult<T = any> {
  ok: boolean
  data?: T
  error?: string
}

// 从 cloud.ts 引入云存储适配器实现
import { CloudStorageAdapter } from './cloud'

// 存储服务类
export class StorageService {
  private adapter: StorageAdapter

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || new CloudStorageAdapter()
  }

  async get<T = unknown>(key: string, options?: StorageOptions): Promise<StorageResult<T>> {
    return this.adapter.get<T>(key, options)
  }

  async create<T = unknown>(data: T, options?: StorageOptions): Promise<StorageResult<T>> {
    return this.adapter.create<T>(data, options)
  }

  async update<T = unknown>(key: string, data: Partial<T>, options?: StorageOptions): Promise<StorageResult<T>> {
    return this.adapter.update<T>(key, data, options)
  }

  async delete(key: string, options?: StorageOptions): Promise<StorageResult<boolean>> {
    return this.adapter.delete(key, options)
  }

  async batchGet<T = unknown>(keys: string[], options?: StorageOptions): Promise<StorageResult<T[]>> {
    return this.adapter.batchGet<T>(keys, options)
  }

  async query<T = unknown>(query: Record<string, unknown>, options?: StorageOptions): Promise<StorageResult<T[]>> {
    return this.adapter.query<T>(query, options)
  }

  // 设置适配器
  setAdapter(adapter: StorageAdapter) {
    this.adapter = adapter
  }
}

const defaultStorage = new StorageService()

export default defaultStorage
