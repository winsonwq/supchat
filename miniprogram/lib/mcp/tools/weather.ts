import { ToolBaseConfig, ToolCallResult, WeatherData } from '../types.js'
import { WeatherCard } from '../components/weathercard/index.js'

// 生成模拟天气数据
function generateMockWeatherData(city: string, date: string): WeatherData {
  return {
    city,
    date,
    temperature: {
      current: Math.floor(Math.random() * 30) + 5,
      high: Math.floor(Math.random() * 35) + 10,
      low: Math.floor(Math.random() * 20) + 0,
    },
    weather: ['晴天', '多云', '小雨', '阴天'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 40) + 40,
    wind: {
      direction: ['北风', '南风', '东风', '西风'][
        Math.floor(Math.random() * 4)
      ],
      speed: Math.floor(Math.random() * 20) + 5,
    },
    airQuality: ['优', '良', '轻度污染', '中度污染'][
      Math.floor(Math.random() * 4)
    ],
    updateTime: new Date().toLocaleString('zh-CN'),
  }
}

// 获取天气工具处理函数
async function getWeatherHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const city = args.city as string
  const date = (args.date as string) || 'today'

  return new Promise((resolve) => {
    const weatherData = generateMockWeatherData(city, date)
    const weatherCard = new WeatherCard(weatherData)

    setTimeout(() => {
      resolve({ data: weatherCard })
    }, 1000)
  })
}

// 获取天气工具配置
export const getWeatherTool: ToolBaseConfig = {
  name: 'getWeather',
  description: '获取指定城市的天气信息，以横向滚动的卡片形式展示',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '城市名称，例如：北京、上海、广州等',
      },
      date: {
        type: 'string',
        description: '查询日期，格式：YYYY-MM-DD，默认为今天',
        default: 'today',
      },
    },
    required: ['city'],
  },
  chineseName: '天气查询',
  needUserConfirm: false,
  handler: getWeatherHandler,
}
