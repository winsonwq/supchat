// 组件注册文件 - 用于自动反序列化
import { ComponentRegistry } from './base-component.js'
import { WeatherCard } from '../tools/weather.js'

// 获取组件注册表实例
const registry = ComponentRegistry.getInstance()

// 注册所有组件类型
export function registerAllComponents() {
  console.log('开始注册组件...')
  
  // 注册天气组件 - 使用正确的类型名称
  registry.register('WeatherCard', WeatherCard)
  
  console.log('组件注册完成:', registry.getAllTypes())
  console.log('全局注册表:', (globalThis as any).__componentRegistry__)
  
  // 确保全局注册表存在
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any).__componentRegistry__) {
      (globalThis as any).__componentRegistry__ = {}
    }
    
    // 手动设置全局注册表
    (globalThis as any).__componentRegistry__['WeatherCard'] = WeatherCard
    
    console.log('🔧 手动设置全局注册表完成')
    console.log('全局注册表内容:', (globalThis as any).__componentRegistry__)
  }
}

// 导出注册表实例，供其他地方使用
export { registry }

// 自动注册组件（在模块加载时执行）
console.log('组件注册模块加载中...')
registerAllComponents()
