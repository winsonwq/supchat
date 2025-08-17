# MCP 组件架构说明

## 概述

这个组件架构提供了可持久化的组件系统，支持组件的序列化、反序列化和事件绑定。**现在所有通用方法都放在 BaseComponent 中，子组件只需要实现最核心的逻辑！**

## 核心类

### BaseComponent

所有可渲染组件的基类，提供以下功能：

- **自动生成组件ID**: 每个组件实例都有唯一的ID
- **统一数据管理**: 所有组件数据都存储在 `this.data` 中
- **元数据管理**: 提供组件的基本信息
- **序列化支持**: 将组件转换为可存储的格式
- **持久化**: 支持组件的保存和恢复
- **操作管理**: 统一的操作执行和验证机制
- **自动反序列化**: 通过组件注册表自动恢复组件

#### 主要方法

```typescript
// 基础功能
getComponentId(): string
setComponentId(id: string): void
getData(): any
setData(data: any): void
getComponentType(): string

// 序列化和元数据
getMetaData(): Record<string, any>
serialize(): Record<string, any>

// 操作管理
executeAction(action: string, ...args: any[]): any

// 组件信息
getDisplayName(): string
getDescription(): string
getProperties(): Record<string, any>
getStatusSummary(): string

// 数据验证和克隆
validate(): boolean
clone(): BaseComponent
updateData(newData: any): void

// 静态方法（自动反序列化）
static deserialize(serializedData: any): BaseComponent
```

### ComponentRegistry

组件注册表，用于自动反序列化：

- **组件注册**: 注册组件类型和类
- **自动恢复**: 基类自动从注册表恢复组件
- **类型管理**: 管理所有已注册的组件类型

#### 主要方法

```typescript
// 注册组件类
register(componentType: string, componentClass: any): void

// 获取组件类
get(componentType: string): any

// 检查组件类型是否已注册
has(componentType: string): boolean

// 获取所有已注册的组件类型
getAllTypes(): string[]
```

### ComponentEventManager

组件事件管理器，负责处理组件的交互事件：

- **事件注册**: 为组件注册事件处理器
- **事件分发**: 根据组件ID和操作类型分发事件
- **生命周期管理**: 管理组件的事件处理器生命周期

#### 主要方法

```typescript
// 注册组件事件处理器
registerComponent(componentId: string, componentType: string, handlers: Record<string, Function>): void

// 处理组件事件
handleComponentEvent(componentId: string, action: string, event: any): boolean

// 移除组件事件处理器
unregisterComponent(componentId: string): void
```

## 使用示例

### 创建自定义组件（超简单！）

```typescript
import { BaseComponent } from './base-component.js'

class MyComponent extends BaseComponent {
  constructor(data: any) {
    super(data) // 自动生成componentId，存储data
  }

  // 只需要实现核心的渲染方法
  render(): string {
    return `<div>${this.data.content}</div>`
  }

  // 实现具体的操作方法（基类会自动调用）
  click() {
    console.log('组件被点击:', this.data.content)
  }

  refresh() {
    console.log('组件被刷新')
  }
}
```

### 注册组件类型

```typescript
import { ComponentRegistry } from './component-registry.js'

const registry = ComponentRegistry.getInstance()
registry.register('mycomponent', MyComponent)
```

### 注册事件处理器

```typescript
import { ComponentEventManager } from './component-event-manager.js'

const eventManager = ComponentEventManager.getInstance()

// 注册组件事件
eventManager.registerComponent('my-component-id', 'my-component', {
  click: () => console.log('组件被点击'),
  refresh: () => console.log('组件被刷新')
})
```

### 在聊天历史中使用

组件会自动被序列化并保存到聊天历史中。当恢复聊天历史时，组件会被自动反序列化并重新绑定事件。

## 持久化机制

### 序列化过程

1. 组件调用 `serialize()` 方法（基类自动处理）
2. 聊天历史存储调用 `serializeContent()` 方法
3. 组件数据被转换为可存储的格式
4. 数据保存到本地存储

### 反序列化过程

1. 从本地存储读取数据
2. 聊天历史存储调用 `deserializeContent()` 方法
3. **基类自动从注册表恢复组件**（无需手动实现）
4. 恢复组件的状态和ID
5. 重新绑定事件处理器

## 核心优势

### 🚀 **极简开发**
- **只需2个方法**: `render()`, 操作方法（如 `click()`, `refresh()`）
- **自动序列化**: 基类处理所有持久化逻辑
- **自动反序列化**: 通过注册表自动恢复组件
- **智能操作**: 基类自动调用同名方法

### 🔧 **统一接口**
- **数据管理**: 所有数据都在 `this.data` 中
- **操作执行**: 通过 `executeAction()` 统一调用
- **元数据**: 自动生成组件信息

### 📱 **微信小程序友好**
- **自动渲染**: 基类处理所有渲染逻辑
- **事件绑定**: 自动处理组件交互
- **类型安全**: 完整的 TypeScript 支持

### 💾 **智能持久化**
- **自动保存**: 组件状态自动序列化
- **自动恢复**: 通过注册表自动恢复组件
- **事件重绑**: 自动重新绑定交互事件

## 实际使用示例

### WeatherCard 组件（极简版）

```typescript
class WeatherCard extends BaseComponent {
  constructor(data: WeatherData) {
    super(data) // 数据自动存储到 this.data
  }

  render(): string {
    // 使用 this.data.city, this.data.temperature 等
    return `<div>${this.data.city} 天气</div>`
  }

  // 基类自动调用这些方法
  refresh() { console.log('刷新天气') }
  share() { console.log('分享天气') }
  detail() { console.log('查看详情') }
}
```

### 组件注册

```typescript
// 在 component-registry.ts 中
registry.register('weathercard', WeatherCard)
```

## 注意事项

1. **组件ID唯一性**: 每个组件实例都有唯一的ID，确保事件处理的准确性
2. **事件清理**: 组件销毁时会自动清理相关的事件处理器
3. **类型安全**: 使用TypeScript确保类型安全
4. **微信小程序兼容**: 所有代码都兼容微信小程序环境
5. **操作统一性**: 所有组件都通过 `executeAction` 方法执行操作
6. **组件注册**: 必须通过 ComponentRegistry 注册组件类型

## 扩展性

这个架构设计为可扩展的，你可以：

- 创建新的组件类型（只需2个方法！）
- 添加新的事件类型
- 实现自定义的序列化逻辑
- 集成第三方组件库
- 扩展操作类型和验证规则

## 总结

**现在的组件开发变得超级简单！**

✅ **之前**: 需要重写10+个方法  
✅ **现在**: 只需要实现2个核心方法  
✅ **功能**: 自动获得完整的持久化和事件管理  
✅ **维护**: 所有通用逻辑都在基类中，易于维护和扩展  
✅ **反序列化**: 通过注册表自动恢复，无需手动实现  

这就是我们追求的"不重复造轮子"的优雅架构设计！
