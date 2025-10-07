// MCP 模块主入口
export * from './types.js'
export * from './utils.js'
export * from './tools/index.js'
export * from './components/base-component.js'
export * from './components/component-registry.js'
export * from './components/component-event-manager.js'
export * from './components/component-manager.js'

// 重新导出常用功能
export { transformToOpenRouterTool, executeToolCall } from './utils.js'
export { allTools, getToolByName, getAllToolNames } from './tools/index.js'

import { ComponentRegistry } from './components/base-component.js'
import { ComponentManager } from './components/component-manager.js'
import { WeatherCard } from './components/weathercard/index.js'

// 确保管理器都已初始化
const registry = ComponentRegistry.getInstance()
const componentManager = ComponentManager.getInstance()

// 注册内置组件
registry.register('weather', WeatherCard)
