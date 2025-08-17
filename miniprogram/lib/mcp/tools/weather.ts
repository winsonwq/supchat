import {
  ToolBaseConfig,
  ToolCallResult,
  WeatherData,
} from '../types.js'

class WeatherCard {
  private data: WeatherData

  constructor(data: WeatherData) {
    this.data = data
  }

  refresh() {
    console.log('刷新天气数据')
  }
  share() {
    console.log('分享天气数据')
  }
  detail() {
    console.log('查看天气详情')
  }

  render() {
    return `
<div class="weather-container bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl">
    <button class="weather-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors" 
            data-action="refresh">
      🔄 刷新 ${this.data.city}
    </button>
    <button class="weather-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors" 
            data-action="share">
      📤 分享
    </button>
    <button class="weather-btn bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors" 
            data-action="detail">
      📊 详情
    </button>
</div> 
    `
  }
}

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
    // 生成天气数据
    const weatherData = generateMockWeatherData(city, date)

    // 创建天气卡片组件
    const weatherCard = new WeatherCard(weatherData)

    // 模拟网络延迟
    setTimeout(() => {
      const result = weatherCard
      resolve({
        data: result,
      })
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
