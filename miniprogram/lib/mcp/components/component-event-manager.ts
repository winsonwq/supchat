// 组件事件管理器 - 处理组件的交互事件
export class ComponentEventManager {
  private static instance: ComponentEventManager
  private eventHandlers: Map<string, Map<string, Function>> = new Map()

  static getInstance(): ComponentEventManager {
    if (!ComponentEventManager.instance) {
      ComponentEventManager.instance = new ComponentEventManager()
    }
    return ComponentEventManager.instance
  }

  /**
   * 注册组件事件处理器
   */
  registerComponent(componentId: string, componentType: string, handlers: Record<string, Function>): void {
    if (!this.eventHandlers.has(componentId)) {
      this.eventHandlers.set(componentId, new Map())
    }

    const componentHandlers = this.eventHandlers.get(componentId)!
    Object.entries(handlers).forEach(([action, handler]) => {
      componentHandlers.set(action, handler)
    })
  }

  /**
   * 处理组件事件
   */
  handleComponentEvent(componentId: string, action: string, event: any): boolean {
    const componentHandlers = this.eventHandlers.get(componentId)
    if (!componentHandlers) {
      console.warn(`未找到组件事件处理器: ${componentId}`)
      return false
    }

    const handler = componentHandlers.get(action)
    if (!handler) {
      console.warn(`未找到事件处理器: ${componentId}.${action}`)
      return false
    }

    try {
      handler(event)
      return true
    } catch (error) {
      console.error(`执行事件处理器失败: ${componentId}.${action}`, error)
      return false
    }
  }

  /**
   * 移除组件事件处理器
   */
  unregisterComponent(componentId: string): void {
    this.eventHandlers.delete(componentId)
    console.log(`移除组件事件处理器: ${componentId}`)
  }

  /**
   * 检查组件是否有事件处理器
   */
  hasComponent(componentId: string): boolean {
    return this.eventHandlers.has(componentId)
  }

  /**
   * 获取组件支持的操作列表
   */
  getComponentActions(componentId: string): string[] {
    const componentHandlers = this.eventHandlers.get(componentId)
    if (!componentHandlers) return []
    return Array.from(componentHandlers.keys())
  }
}
