import { ToolBaseConfig, ToolCallResult, WeatherData } from '../types.js'
import { BaseComponent } from '../components/base-component.js'

class WeatherCard extends BaseComponent {
  private data: WeatherData

  constructor(data: WeatherData) {
    super()
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

  render(): string {
    return `
<div class="bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">${this.data.city} 天气</h3>
        <span class="text-sm text-gray-500">${this.data.updateTime}</span>
    </div>
    
    <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">${this.data.temperature.current}°C</div>
            <div class="text-sm text-gray-600">当前温度</div>
        </div>
        <div class="text-center">
            <div class="text-lg font-medium text-gray-800">${this.data.weather}</div>
            <div class="text-sm text-gray-600">天气状况</div>
        </div>
    </div>
    
    <div class="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div class="text-center">
            <div class="font-medium text-gray-700">${this.data.temperature.high}°C</div>
            <div class="text-gray-500">最高</div>
        </div>
        <div class="text-center">
            <div class="font-medium text-gray-700">${this.data.temperature.low}°C</div>
            <div class="text-gray-500">最低</div>
        </div>
        <div class="text-center">
            <div class="font-medium text-gray-700">${this.data.humidity}%</div>
            <div class="text-gray-500">湿度</div>
        </div>
    </div>
    
    <div class="flex space-x-2">
        <button class="flex-1" data-action="refresh">
            🔄 刷新
        </button>
        <button class="flex-1" data-action="share">
            📤 分享
        </button>
        <button class="flex-1" data-action="detail">
            📊 详情
        </button>
    </div>
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
    const weatherData = generateMockWeatherData(city, date)
    const weatherCard = new WeatherCard(weatherData)

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
