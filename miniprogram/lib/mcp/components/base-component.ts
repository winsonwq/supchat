// 基础组件类 - 所有可渲染组件的父类
import { RenderableComponent } from '../types.js'

export abstract class BaseComponent implements RenderableComponent {
  protected componentId: string
  protected data: any
  protected componentType: string

  constructor(data?: any) {
    this.data = data
    // 修复：使用子类定义的 componentType，而不是构造函数名
    this.componentType = (this.constructor as any).prototype.componentType || this.constructor.name
    // 延迟生成 componentId，确保 componentType 已经设置
    this.componentId = this.generateComponentId()
  }

  abstract render(): string

  protected generateComponentId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${this.componentType}_${timestamp}_${random}`
  }

  /**
   * 获取组件ID
   */
  getComponentId(): string {
    return this.componentId
  }

  /**
   * 设置组件ID
   */
  setComponentId(id: string): void {
    this.componentId = id
  }

  /**
   * 获取组件数据
   */
  getData(): any {
    return this.data
  }

  /**
   * 设置组件数据
   */
  setData(data: any): void {
    this.data = data
  }

  /**
   * 获取组件类型
   */
  getComponentType(): string {
    return this.componentType
  }

  /**
   * 序列化组件，用于持久化
   */
  serialize(): Record<string, any> {
    return {
      componentType: this.componentType,  // 统一使用 componentType 字段
      componentId: this.componentId,
      data: this.data,
      html: this.render()
    }
  }

  /**
   * 生成包含组件ID的事件属性字符串
   * 用于在 render 方法中方便地添加事件属性
   */
  protected bindEvent(action: string): string {
    return `data-component-id="${this.componentId}" data-action="${action}"`
  }

  /**
   * 生成组件根元素的属性字符串
   * 包含组件ID和类型信息
   */
  protected getComponentAttributes(): string {
    return `data-component-id="${this.componentId}" data-component-type="${this.componentType}"`
  }

  /**
   * 从序列化数据恢复组件
   * 尝试自动恢复，如果失败则抛出错误
   */
  static deserialize(serializedData: any): BaseComponent {
    const { componentType, data, componentId } = serializedData
    
    // 尝试从全局注册表中获取组件类
    const ComponentClass = (globalThis as any).__componentRegistry__?.[componentType]
    
    if (ComponentClass && typeof ComponentClass === 'function') {
      try {
        const component = new ComponentClass(data)
        component.setComponentId(componentId)
        return component
      } catch (error) {
        console.error(`创建组件实例失败:`, error)
        throw new Error(`创建组件实例失败: ${error}`)
      }
    }
    
    console.error(`未找到组件类型 ${componentType} 的注册`)
    
    // 如果无法自动恢复，抛出错误提示子组件实现
    throw new Error(`无法自动恢复组件类型 '${componentType}'，请确保组件已注册或实现 deserialize 方法`)
  }

  /**
   * 执行组件操作
   * 子组件可以重写此方法实现具体的操作逻辑
   */
  executeAction(action: string, ...args: any[]): any {
    // 默认实现：尝试调用同名方法
    if (typeof (this as any)[action] === 'function') {
      return (this as any)[action](...args)
    }
    throw new Error(`操作 '${action}' 未实现`)
  }

  /**
   * 获取组件的显示名称
   * 子组件可以重写此方法提供友好的显示名称
   */
  getDisplayName(): string {
    return this.componentType
  }

  /**
   * 获取组件的描述信息
   * 子组件可以重写此方法提供描述
   */
  getDescription(): string {
    return `${this.getDisplayName()} 组件`
  }

  /**
   * 验证组件数据的有效性
   * 子组件可以重写此方法实现数据验证
   */
  validate(): boolean {
    return !!this.data
  }

  /**
   * 克隆组件
   * 子组件可以重写此方法实现深拷贝
   */
  clone(): BaseComponent {
    const cloned = Object.create(Object.getPrototypeOf(this))
    Object.assign(cloned, this)
    cloned.componentId = this.generateComponentId()
    return cloned
  }

  /**
   * 获取组件的所有属性
   */
  getProperties(): Record<string, any> {
    return {
      componentId: this.componentId,
      componentType: this.componentType,
      data: this.data,
      displayName: this.getDisplayName(),
      description: this.getDescription()
    }
  }

  /**
   * 更新组件数据
   */
  updateData(newData: any): void {
    this.data = { ...this.data, ...newData }
  }

  /**
   * 获取组件的状态摘要
   */
  getStatusSummary(): string {
    return `${this.getDisplayName()} (${this.componentId})`
  }
}

// 组件注册表 - 用于自动反序列化
export class ComponentRegistry {
  private static instance: ComponentRegistry
  private registry: Map<string, any> = new Map()

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry()
    }
    return ComponentRegistry.instance
  }

  /**
   * 注册组件类
   */
  register(componentType: string, componentClass: any): void {
    this.registry.set(componentType, componentClass)
    // 同时注册到全局，供基类使用
    if (typeof globalThis !== 'undefined') {
      if (!(globalThis as any).__componentRegistry__) {
        (globalThis as any).__componentRegistry__ = {}
      }
      (globalThis as any).__componentRegistry__[componentType] = componentClass
    }
  }

  /**
   * 获取组件类
   */
  get(componentType: string): any {
    return this.registry.get(componentType)
  }

  /**
   * 检查组件类型是否已注册
   */
  has(componentType: string): boolean {
    return this.registry.has(componentType)
  }

  /**
   * 获取所有已注册的组件类型
   */
  getAllTypes(): string[] {
    return Array.from(this.registry.keys())
  }
}
