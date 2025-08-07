/**
 * HTTP 请求封装
 * 对 wx.request 的简单封装
 */

// 请求配置接口
export interface RequestConfig {
  url: string
  method?:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'
    | 'TRACE'
    | 'CONNECT'
  data?: any
  header?: Record<string, string>
  timeout?: number
}

// 响应接口
export interface HttpResponse<T = any> {
  data: T
  statusCode: number
  header: Record<string, string>
  cookies: string[]
}

// 错误接口
export interface HttpError {
  errMsg: string
  statusCode?: number
  data?: any
}

// 默认配置
const DEFAULT_CONFIG = {
  baseURL: '',
  timeout: 10000,
  header: {
    'Content-Type': 'application/json',
  },
}

// 核心请求方法
const request = async <T = any>(
  config: RequestConfig,
): Promise<HttpResponse<T>> => {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    timeout = DEFAULT_CONFIG.timeout,
  } = config

  try {
    // 构建完整 URL
    const fullURL = DEFAULT_CONFIG.baseURL + url

    // 合并请求头
    const finalHeaders = { ...DEFAULT_CONFIG.header, ...header }

    // 发起请求
    const response = await new Promise<HttpResponse<T>>((resolve, reject) => {
      wx.request({
        url: fullURL,
        method,
        data,
        header: finalHeaders,
        timeout,
        success: (res) => {
          resolve(res as HttpResponse<T>)
        },
        fail: (err) => {
          reject({
            errMsg: err.errMsg,
            statusCode: (err as any).statusCode,
            data: (err as any).data,
          })
        },
      })
    })

    // 检查状态码
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response
    } else {
      // 处理 HTTP 错误
      const error: HttpError = {
        errMsg: `HTTP ${response.statusCode}`,
        statusCode: response.statusCode,
        data: response.data,
      }

      throw error
    }
  } catch (error) {
    const httpError = error as HttpError
    throw httpError
  }
}

// 导出请求方法
export const get = <T = any>(
  url: string,
  config?: Partial<RequestConfig>,
): Promise<HttpResponse<T>> => {
  return request<T>({
    url,
    method: 'GET',
    ...config,
  })
}

export const post = <T = any>(
  url: string,
  data?: any,
  config?: Partial<RequestConfig>,
): Promise<HttpResponse<T>> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...config,
  })
}

export const put = <T = any>(
  url: string,
  data?: any,
  config?: Partial<RequestConfig>,
): Promise<HttpResponse<T>> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...config,
  })
}

export const del = <T = any>(
  url: string,
  config?: Partial<RequestConfig>,
): Promise<HttpResponse<T>> => {
  return request<T>({
    url,
    method: 'DELETE',
    ...config,
  })
}

export const patch = <T = any>(
  url: string,
  data?: any,
  config?: Partial<RequestConfig>,
): Promise<HttpResponse<T>> => {
  return request<T>({
    url,
    method: 'PUT', // 微信小程序不支持 PATCH，使用 PUT 替代
    data,
    ...config,
  })
}

// 配置方法
export const setBaseURL = (url: string) => {
  DEFAULT_CONFIG.baseURL = url
}

export const setTimeout = (timeout: number) => {
  DEFAULT_CONFIG.timeout = timeout
}

export const setDefaultHeaders = (headers: Record<string, string>) => {
  DEFAULT_CONFIG.header = { ...DEFAULT_CONFIG.header, ...headers }
}

// 默认导出
export default {
  get,
  post,
  put,
  delete: del,
  patch,
  setBaseURL,
  setTimeout,
  setDefaultHeaders,
}
