import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 获取网络状态工具的参数定义
const getNetworkStatusInputSchema = {
  type: 'object',
  properties: {
    includeDetailedInfo: {
      type: 'boolean',
      description: '是否包含详细网络信息',
      default: true,
    },
  },
  required: [],
}

// 获取网络状态工具处理函数
async function getNetworkStatusHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const includeDetailedInfo = (args.includeDetailedInfo as boolean) !== false

  return new Promise((resolve, reject) => {
    // 获取网络类型
    wx.getNetworkType({
      success: (res) => {
        let networkReport = `# 🌐 网络状态信息

## 🕐 获取时间
- **获取时间**: ${new Date().toLocaleString('zh-CN')}

## 📡 网络类型
- **网络类型**: ${res.networkType}
- **网络状态**: ${getNetworkStatusText(res.networkType)}

`

        // 如果包含详细信息，尝试获取更多网络信息
        if (includeDetailedInfo) {
          // 尝试获取网络状态变化监听器信息
          try {
            // 获取当前网络状态
            const currentNetworkType = res.networkType
            const isConnected = currentNetworkType !== 'none'
            
            networkReport += `## 📊 网络详情
- **连接状态**: ${isConnected ? '已连接' : '未连接'}
- **网络质量**: ${getNetworkQualityText(currentNetworkType)}
- **建议操作**: ${getNetworkSuggestion(currentNetworkType)}

`
          } catch (error) {
            console.warn('获取详细网络信息失败:', error)
          }
        }

        networkReport += `---
*数据来源: 微信小程序网络状态API*`

        resolve({
          success: true,
          data: {
            networkType: res.networkType,
            report: networkReport,
          },
        })
      },
      fail: (error) => {
        console.error('获取网络状态失败:', error)
        resolve({
          success: false,
          error: `获取网络状态失败: ${error.errMsg}`,
        })
      },
    })
  })
}

// 获取网络状态文本描述
function getNetworkStatusText(networkType: string): string {
  const statusMap: Record<string, string> = {
    'wifi': 'WiFi网络',
    '2g': '2G网络',
    '3g': '3G网络',
    '4g': '4G网络',
    '5g': '5G网络',
    'unknown': '未知网络',
    'none': '无网络连接',
  }
  return statusMap[networkType] || '未知状态'
}

// 获取网络质量描述
function getNetworkQualityText(networkType: string): string {
  const qualityMap: Record<string, string> = {
    'wifi': '高速稳定',
    '5g': '超高速',
    '4g': '高速',
    '3g': '中等速度',
    '2g': '低速',
    'unknown': '未知',
    'none': '无网络',
  }
  return qualityMap[networkType] || '未知'
}

// 获取网络建议
function getNetworkSuggestion(networkType: string): string {
  const suggestionMap: Record<string, string> = {
    'wifi': '网络状态良好，适合大文件传输',
    '5g': '网络状态优秀，支持高清视频',
    '4g': '网络状态良好，适合日常使用',
    '3g': '网络状态一般，建议避免大文件传输',
    '2g': '网络状态较差，仅适合文字消息',
    'unknown': '网络状态未知，建议检查网络设置',
    'none': '无网络连接，请检查网络设置',
  }
  return suggestionMap[networkType] || '请检查网络设置'
}

// 获取网络状态工具配置
export const getNetworkStatusTool: ToolBaseConfig = {
  name: 'getNetworkStatus',
  description: '获取当前网络连接状态',
  inputSchema: getNetworkStatusInputSchema,
  chineseName: '网络状态',
  needUserConfirm: false,
  handler: getNetworkStatusHandler,
}
