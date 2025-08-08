import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 获取天气工具的参数定义
const getWeatherInputSchema = {
  type: 'object',
  properties: {
    city: {
      type: 'string',
      description: '城市名称，例如：北京、上海、广州等',
    },
    date: {
      type: 'string',
      description: '查询日期，格式：YYYY-MM-DD，默认为今天',
      default: 'today'
    }
  },
  required: ['city']
}

// 获取天气工具处理函数
async function getWeatherHandler(args: Record<string, unknown>): Promise<ToolCallResult> {
  const city = args.city as string
  const date = args.date as string || 'today'
  
  return new Promise((resolve) => {
    // 模拟天气查询
    const weatherData = {
      city: city,
      date: date,
      temperature: {
        current: Math.floor(Math.random() * 30) + 5,
        high: Math.floor(Math.random() * 35) + 10,
        low: Math.floor(Math.random() * 20) + 0
      },
      weather: ['晴天', '多云', '小雨', '阴天'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
      wind: {
        direction: ['北风', '南风', '东风', '西风'][Math.floor(Math.random() * 4)],
        speed: Math.floor(Math.random() * 20) + 5
      },
      airQuality: ['优', '良', '轻度污染', '中度污染'][Math.floor(Math.random() * 4)]
    }

    // 模拟网络延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: weatherData
      })
    }, 1000)
  })
}

// 获取天气工具配置
export const getWeatherTool: ToolBaseConfig = {
  name: 'getWeather',
  description: '获取指定城市的天气信息',
  inputSchema: getWeatherInputSchema,
  chineseName: '天气查询',
  needUserConfirm: false,
  handler: getWeatherHandler
}
