// 组件管理器 - 管理所有渲染的组件实例
import { BaseComponent } from './base-component.js'

export class ComponentManager {
  private static instance: ComponentManager
  private components: Map<string, BaseComponent> = new Map()

  static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager()
      // 设置全局实例供其他模块使用
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__ComponentManagerInstance__ = ComponentManager.instance
      }
    }
    return ComponentManager.instance
  }

  /**
   * 注册组件实例
   */
  registerComponent(component: BaseComponent): void {
    const componentId = component.getComponentId()
    this.components.set(componentId, component)
  }

  /**
   * 获取组件实例
   */
  getComponent(componentId: string): BaseComponent | undefined {
    return this.components.get(componentId)
  }

  /**
   * 移除组件实例
   */
  unregisterComponent(componentId: string): void {
    const component = this.components.get(componentId)
    if (component) {
      this.components.delete(componentId)
    }
  }

  /**
   * 检查组件是否存在
   */
  hasComponent(componentId: string): boolean {
    return this.components.has(componentId)
  }

  /**
   * 获取所有组件 ID
   */
  getAllComponentIds(): string[] {
    return Array.from(this.components.keys())
  }

  /**
   * 获取指定类型的所有组件
   */
  getComponentsByType(componentType: string): BaseComponent[] {
    return Array.from(this.components.values()).filter(
      component => component.getComponentType() === componentType
    )
  }

  /**
   * 清空所有组件
   */
  clear(): void {
    this.components.clear()
  }

  /**
   * 获取组件数量
   */
  getComponentCount(): number {
    return this.components.size
  }

  /**
   * 处理组件事件
   * 从事件对象中获取 componentId 和 eventName，然后执行对应的组件方法
   */
  handleComponentEvent(componentId: string, eventName: string, event?: any): boolean {
    const component = this.getComponent(componentId)
    if (!component) {
      return false
    }

    try {
      component.executeAction(eventName, event)
      return true
    } catch (error) {
      console.error(`执行组件事件失败: ${componentId}.${eventName}`, error)
      return false
    }
  }

  /**
   * 反序列化组件并自动注册
   * 用于从存储中恢复组件时使用
   */
  deserializeAndRegister(serializedData: any): BaseComponent {
    try {
      // 调用 BaseComponent 的反序列化方法
      const component = BaseComponent.deserialize(serializedData)
      
      // 手动注册到当前管理器
      this.registerComponent(component)
      
      return component
    } catch (error) {
      console.error('反序列化并注册组件失败:', error)
      throw error
    }
  }

  /**
   * 批量反序列化并注册组件
   * 用于一次性恢复多个组件
   */
  deserializeAndRegisterBatch(serializedDataArray: any[]): BaseComponent[] {
    const components: BaseComponent[] = []
    
    for (const serializedData of serializedDataArray) {
      try {
        const component = this.deserializeAndRegister(serializedData)
        components.push(component)
      } catch (error) {
        console.warn(`跳过无法反序列化的组件:`, serializedData, error)
        // 继续处理其他组件
      }
    }
    
    return components
  }

  /**
   * 获取组件状态摘要（用于调试）
   */
  getStatusSummary(): string {
    const componentsByType = new Map<string, number>()
    
    for (const component of this.components.values()) {
      const type = component.getComponentType()
      componentsByType.set(type, (componentsByType.get(type) || 0) + 1)
    }

    const summary = Array.from(componentsByType.entries())
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ')

    return `组件管理器状态 (总计 ${this.components.size} 个组件): ${summary}`
  }
}
