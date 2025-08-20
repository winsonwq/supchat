import { BaseComponent } from '../base-component.js'

export class WeatherCard extends BaseComponent {
  static componentType = 'weather'

  render() {
    return `
<div class="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl shadow-md" ${this.getComponentAttributes()}>
    <div class="flex items-center justify-between mb-4">
        <span class="text-xl font-semibold text-gray-900 leading-snug">${this.data.city} 天气</span>
        <span class="text-sm text-gray-500 leading-normal">${this.data.updateTime}</span>
    </div>
    
    <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="text-center">
            <div class="text-4xl font-extrabold text-blue-600 leading-tight">${this.data.temperature.current}°C</div>
            <div class="text-sm text-gray-600 leading-normal">当前温度</div>
        </div>
        <div class="text-center">
            <div class="text-lg font-semibold text-gray-800 leading-snug">${this.data.weather}</div>
            <div class="text-sm text-gray-600 leading-normal">天气状况</div>
        </div>
    </div>
    
    <div class="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div class="text-center">
            <div class="font-semibold text-gray-800 leading-snug">${this.data.temperature.high}°C</div>
            <div class="text-gray-500 leading-normal">最高</div>
        </div>
        <div class="text-center">
            <div class="font-semibold text-gray-800 leading-snug">${this.data.temperature.low}°C</div>
            <div class="text-gray-500 leading-normal">最低</div>
        </div>
        <div class="text-center">
            <div class="font-semibold text-gray-800 leading-snug">${this.data.humidity}%</div>
            <div class="text-gray-500 leading-normal">湿度</div>
        </div>
    </div>
    
    <div class="flex gap-8">
        <button class="flex-1 px-4 py-3 rounded-lg bg-white-alpha-80 border border-blue-alpha-20 text-gray-700 text-sm font-medium" ${this.bindEvent('refresh')}>
            🔄 刷新
        </button>
        <button class="flex-1 px-4 py-3 rounded-lg bg-white-alpha-80 border border-blue-alpha-20 text-gray-700 text-sm font-medium" ${this.bindEvent('share')}>
            📤 分享
        </button>
        <button class="flex-1 px-4 py-3 rounded-lg bg-white-alpha-80 border border-blue-alpha-20 text-gray-700 text-sm font-medium" ${this.bindEvent('detail')}>
            📊 详情
        </button>
    </div>
</div> 
    `
  }

  // 实现具体的操作方法（基类会自动调用）
  refresh() {
    console.log('刷新天气数据')
  }

  share() {
    console.log('分享天气数据')
  }

  detail() {
    console.log('查看天气详情')
  }
}


