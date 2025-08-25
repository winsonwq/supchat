/**
 * HTTP 服务适配器
 * 提供高级 HTTP 服务封装，包括拦截器、错误处理、重试机制等
 */

import { get, post, put, del, patch, setBaseURL, setDefaultHeaders, setRequestTimeout } from './request'

// 请求拦截器类型
export interface RequestInterceptor {
  (config: any): any | Promise<any>
}

// 响应拦截器类型
export interface ResponseInterceptor {
  (response: any): any | Promise<any>
}

// 错误拦截器类型
export interface ErrorInterceptor {
  (error: any): any | Promise<any>
}

// HTTP 客户端配置
export interface HttpClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
}

// HTTP 客户端类
class HttpClient {
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []
  private config: HttpClientConfig

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 10000,
      headers: {},
      retries: 0,
      retryDelay: 1000,
      ...config,
    }

    // 应用配置
    if (this.config.baseURL) {
      setBaseURL(this.config.baseURL)
    }
    if (this.config.timeout) {
      setRequestTimeout(this.config.timeout)
    }
    if (this.config.headers) {
      setDefaultHeaders(this.config.headers)
    }
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor)
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor)
  }

  // 执行请求拦截器
  private async executeRequestInterceptors(config: any): Promise<any> {
    let result = config
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  // 执行响应拦截器
  private async executeResponseInterceptors(response: any): Promise<any> {
    let result = response
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  // 执行错误拦截器
  private async executeErrorInterceptors(error: any): Promise<any> {
    let result = error
    for (const interceptor of this.errorInterceptors) {
      result = await interceptor(result)
    }
    return result
  }

  // 带重试的请求方法
  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    retries: number = this.config.retries || 0
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.config.retryDelay || 1000)
        return this.requestWithRetry(requestFn, retries - 1)
      }
      throw error
    }
  }

  // 延迟方法
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // GET 请求
  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.requestWithRetry(async () => {
      const finalConfig = await this.executeRequestInterceptors({ url, ...config })
      try {
        const response = await get<T>(finalConfig.url, finalConfig)
        return await this.executeResponseInterceptors(response.data)
      } catch (error) {
        const processedError = await this.executeErrorInterceptors(error)
        throw processedError
      }
    })
  }

  // POST 请求
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithRetry(async () => {
      const finalConfig = await this.executeRequestInterceptors({ url, data, ...config })
      try {
        const response = await post<T>(finalConfig.url, finalConfig.data, finalConfig)
        return await this.executeResponseInterceptors(response.data)
      } catch (error) {
        const processedError = await this.executeErrorInterceptors(error)
        throw processedError
      }
    })
  }

  // PUT 请求
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithRetry(async () => {
      const finalConfig = await this.executeRequestInterceptors({ url, data, ...config })
      try {
        const response = await put<T>(finalConfig.url, finalConfig.data, finalConfig)
        return await this.executeResponseInterceptors(response.data)
      } catch (error) {
        const processedError = await this.executeErrorInterceptors(error)
        throw processedError
      }
    })
  }

  // DELETE 请求
  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.requestWithRetry(async () => {
      const finalConfig = await this.executeRequestInterceptors({ url, ...config })
      try {
        const response = await del<T>(finalConfig.url, finalConfig)
        return await this.executeResponseInterceptors(response.data)
      } catch (error) {
        const processedError = await this.executeErrorInterceptors(error)
        throw processedError
      }
    })
  }

  // PATCH 请求
  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithRetry(async () => {
      const finalConfig = await this.executeRequestInterceptors({ url, data, ...config })
      try {
        const response = await patch<T>(finalConfig.url, finalConfig.data, finalConfig)
        return await this.executeResponseInterceptors(response.data)
      } catch (error) {
        const processedError = await this.executeErrorInterceptors(error)
        throw processedError
      }
    })
  }

  // 更新配置
  updateConfig(config: Partial<HttpClientConfig>) {
    this.config = { ...this.config, ...config }
    
    if (config.baseURL) {
      setBaseURL(config.baseURL)
    }
    if (config.timeout) {
      setRequestTimeout(config.timeout)
    }
    if (config.headers) {
      setDefaultHeaders(config.headers)
    }
  }

  // 获取当前配置
  getConfig(): HttpClientConfig {
    return { ...this.config }
  }
}

// 创建默认 HTTP 客户端实例
const defaultHttpClient = new HttpClient()

// 导出默认实例的方法
export const http = {
  get: <T = any>(url: string, config?: any) => defaultHttpClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => defaultHttpClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => defaultHttpClient.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => defaultHttpClient.delete<T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: any) => defaultHttpClient.patch<T>(url, data, config),
  
  // 拦截器方法
  addRequestInterceptor: (interceptor: RequestInterceptor) => 
    defaultHttpClient.addRequestInterceptor(interceptor),
  addResponseInterceptor: (interceptor: ResponseInterceptor) => 
    defaultHttpClient.addResponseInterceptor(interceptor),
  addErrorInterceptor: (interceptor: ErrorInterceptor) => 
    defaultHttpClient.addErrorInterceptor(interceptor),
  
  // 配置方法
  updateConfig: (config: Partial<HttpClientConfig>) => defaultHttpClient.updateConfig(config),
  getConfig: () => defaultHttpClient.getConfig(),
}

// 导出 HttpClient 类，用于创建自定义实例
export { HttpClient }

// 默认导出
export default http
