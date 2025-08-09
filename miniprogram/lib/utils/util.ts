import { ToolCallResult, StreamContent, StreamContentType, ToolCall } from '../mcp/types.js'

export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

// 工具调用消息格式化函数
export function formatToolCallMessage(toolName: string, result: ToolCallResult): string {
  return `执行工具: ${toolName}\n结果: ${result.data}`
}

// 工具调用错误消息格式化函数
export function formatToolCallErrorMessage(toolName: string, error: string): string {
  return `工具调用失败: ${toolName}\n错误: ${error}`
}

// 判断是否为工具调用消息（保留向后兼容性）
export function isToolCallMessage(content: string): boolean {
  return content.startsWith('执行工具:') || content.startsWith('工具调用失败:') || content.startsWith('正在调用工具:')
}

// 创建 StreamContent 工具函数
export function createStreamContent(
  content: string,
  type: StreamContentType = StreamContentType.NORMAL,
  isComplete: boolean = false,
  toolCalls?: ToolCall[],
  currentToolCall?: ToolCall
): StreamContent {
  return {
    content,
    type,
    isComplete,
    toolCalls,
    currentToolCall
  }
}

// 创建普通内容
export function createNormalContent(
  content: string, 
  isComplete: boolean = false, 
  toolCalls?: ToolCall[]
): StreamContent {
  return createStreamContent(content, StreamContentType.NORMAL, isComplete, toolCalls)
}

// 创建工具调用内容
export function createToolContent(
  content: string, 
  isComplete: boolean = false,
  currentToolCall?: ToolCall
): StreamContent {
  return createStreamContent(content, StreamContentType.TOOL, isComplete, undefined, currentToolCall)
}

// 创建错误内容
export function createErrorContent(
  content: string, 
  isComplete: boolean = true
): StreamContent {
  return createStreamContent(content, StreamContentType.ERROR, isComplete)
}
