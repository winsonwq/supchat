/**
 * 统一存储服务
 * 支持云函数和本地存储的统一接口
 */

// 存储适配器接口
export interface StorageAdapter {
  get<T = unknown>(
    path: string,
    options?: StorageOptions,
  ): Promise<StorageResult<T>>
  create<T = unknown>(
    path: string,
    data: T,
  ): Promise<StorageResult<T>>
  update<T = unknown>(
    path: string,
    data: Partial<T>,
  ): Promise<StorageResult<T>>
  delete(
    path: string,
  ): Promise<StorageResult<boolean>>
}

// 存储选项
export interface StorageOptions {
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

  async get<T = unknown>(
    path: string,
    options?: StorageOptions,
  ): Promise<StorageResult<T>> {
    return this.adapter.get<T>(path, options)
  }

  async create<T = unknown>(
    path: string,
    data: T,
  ): Promise<StorageResult<T>> {
    return this.adapter.create<T>(path, data)
  }

  async update<T = unknown>(
    path: string,
    data: Partial<T>,
  ): Promise<StorageResult<T>> {
    return this.adapter.update<T>(path, data)
  }

  async delete(
    path: string,
  ): Promise<StorageResult<boolean>> {
    return this.adapter.delete(path)
  }

  // 设置适配器
  setAdapter(adapter: StorageAdapter) {
    this.adapter = adapter
  }
}

const defaultStorage = new StorageService()

export default defaultStorage
