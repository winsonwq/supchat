import { ToolBaseConfig, OpenRouterTool, ToolCallResult, AIResponse, ToolCall } from './types.js'
import { ComponentRenderer } from './components/component-renderer.js'

// 转换工具为OpenRouter格式
export function transformToOpenRouterTool(tool: ToolBaseConfig): OpenRouterTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.chineseName
        ? `[${tool.chineseName}] ${tool.description}`
        : tool.description,
      parameters: tool.inputSchema,
    },
  }
}

// 执行工具调用
export async function executeToolCall(
  toolName: string,
  arguments_: Record<string, unknown>,
  tools: ToolBaseConfig[]
): Promise<ToolCallResult> {
  console.log(`开始执行工具: ${toolName}`, arguments_)
  
  const tool = tools.find(t => t.name === toolName)
  if (!tool) {
    console.error(`工具 ${toolName} 未找到，可用工具:`, tools.map(t => t.name))
    throw new Error(`工具 ${toolName} 未找到。可用工具: ${tools.map(t => t.name).join(', ')}`)
  }

  console.log(`找到工具: ${tool.name} (${tool.chineseName})`)

  // 如果需要用户确认
  if (tool.needUserConfirm) {
    console.log(`工具 ${toolName} 需要用户确认`)
    const confirmed = await showToolConfirmDialog(tool.chineseName || tool.name, arguments_)
    if (!confirmed) {
      console.log(`用户取消了工具 ${toolName} 的执行`)
      throw new Error('用户取消了操作')
    }
  }

  // 执行工具处理函数
  console.log(`执行工具 ${toolName} 的处理函数`)
  const result = await tool.handler(arguments_)
  console.log(`工具 ${toolName} 执行成功:`, result)
  
  return result
}

// 显示工具确认对话框
function showToolConfirmDialog(toolName: string, arguments_: Record<string, unknown>): Promise<boolean> {
  return new Promise((resolve) => {
    const argsStr = JSON.stringify(arguments_, null, 2)
    wx.showModal({
      title: `确认执行 ${toolName}`,
      content: `是否要执行以下操作？\n\n参数：\n${argsStr}`,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

// 处理 AI 响应中的工具调用
export function processToolCalls(
  response: AIResponse
): { hasToolCalls: boolean; toolCalls: ToolCall[] | null } {
  const toolCalls = response.choices?.[0]?.message?.tool_calls || []
  
  console.log('检查工具调用:', toolCalls)
  
  if (toolCalls.length === 0) {
    return { hasToolCalls: false, toolCalls: null }
  }

  return { hasToolCalls: true, toolCalls }
}

// 构建工具调用响应消息
export function buildToolCallResponse(
  toolCalls: ToolCall[],
  results: (ToolCallResult | Error)[]
): Array<{
  tool_call_id: string
  role: 'tool'
  content: string
  originalData?: any // 添加原始数据字段，用于保存到聊天历史
}> {
  console.log('构建工具调用响应:', { toolCalls, results })
  
  const toolResults = toolCalls.map((call, index) => {
    const result = results[index]
    let content: string
    let originalData: any = null
    
    if (result instanceof Error) {
      content = `错误: ${result.message}`
      originalData = result // 错误对象本身作为原始数据
    } else if (result.data) {
      // 保存原始数据，用于聊天历史存储
      originalData = result.data
      
      // 使用组件渲染器处理结果，但只用于显示
      if (typeof result.data === 'object' && result.data !== null && 'render' in result.data) {
        // 如果是组件实例，调用render方法获取HTML字符串用于显示
        content = result.data.render()
      } else {
        // 如果不是组件实例，直接使用数据
        content = ComponentRenderer.render(result.data)
      }
    } else {
      content = '工具执行完成，无返回数据'
    }
    
    console.log(`工具调用 ${call.function.name} 响应:`, { content, originalData })
    
    return {
      tool_call_id: call.id,
      role: 'tool' as const,
      content,
      originalData // 返回原始数据
    }
  })
  
  return toolResults
}
