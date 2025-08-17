// MCP Tools 类型定义

// 可渲染组件接口
export interface RenderableComponent {
  render(): string
}

export type RenderNode =
  | string
  | RenderableComponent
  | Array<string | RenderableComponent>

// 工具基础配置接口
export interface ToolBaseConfig {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  chineseName?: string
  annotations?: Record<string, unknown>
  needUserConfirm?: boolean
  handler: (args: Record<string, unknown>) => Promise<ToolCallResult>
}

// OpenRouter 工具格式
export interface OpenRouterTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

// 工具调用结果 - 可以是字符串、组件实例或组件数组
export interface ToolCallResult {
  data: RenderNode
}

// 工具调用请求
export interface ToolCallRequest {
  name: string
  arguments: Record<string, unknown>
}

// 工具调用对象
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

// 工具调用增量
export interface ToolCallDelta {
  index?: number
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

// 工具调用响应
export interface ToolCallResponse {
  tool_calls?: ToolCall[]
}

// AI响应选择
export interface AIChoice {
  delta?: {
    content?: string
    tool_calls?: ToolCallDelta[]
  }
  message?: {
    content?: string
    tool_calls?: ToolCall[]
  }
}

// AI响应
export interface AIResponse {
  choices?: AIChoice[]
}

// 工具调用响应消息
export interface ToolResponseMessage {
  tool_call_id: string
  role: 'tool'
  content: string
}

// HTTP请求响应
export interface HttpResponse {
  statusCode: number
  data: string | AIResponse
  errMsg?: string
}

// 微信请求任务
export interface WxRequestTask {
  abort(): void
}

// Towxml节点类型
export interface TowxmlNode {
  tag?: string
  attr?: Record<string, string>
  children?: TowxmlNode[]
  text?: string
  [key: string]: unknown
}

// 事件对象
export interface WxEvent {
  detail: {
    value?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// 工具调用信息
export interface ToolCallInfo {
  name: string
  arguments: Record<string, unknown>
  result: ToolCallResult
  success: boolean
  error?: string
}

// 解析后的工具调用消息
export interface ParsedToolCallMessage {
  toolName: string
  result?: unknown
  error?: string
  isCalling?: boolean // 标识是否正在调用工具
}

// 流式内容类型枚举
export enum StreamContentType {
  NORMAL = 'normal', // 普通内容
  TOOL = 'tool', // 工具调用消息
  ERROR = 'error', // 错误消息
}

// 流式内容对象
export interface StreamContent {
  content: RenderNode
  type: StreamContentType
  isComplete: boolean
  toolCalls?: ToolCall[]
  currentToolCall?: ToolCall
}

// 天气相关类型定义
export interface WeatherData {
  city: string
  date: string
  temperature: {
    current: number
    high: number
    low: number
  }
  weather: string
  humidity: number
  wind: {
    direction: string
    speed: number
  }
  airQuality: string
  updateTime: string
}

export interface WeatherCardProps {
  data: WeatherData
}

export interface WeatherCardComponent {
  render: () => {
    html: string
    events: {
      selector: string
      action: string
      handler: (eventContext?: any) => void
    }[]
  }
  handlers: {
    refresh: () => void
    share: () => void
    detail: () => void
  }
}
