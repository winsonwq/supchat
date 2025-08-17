// 组件渲染器 - 处理工具调用返回的组件实例和字符串
import { RenderableComponent, RenderNode } from '../types.js'

export class ComponentRenderer {
  static render(result: RenderNode): string {
    if (typeof result === 'string') {
      return result
    }

    if (Array.isArray(result)) {
      return this.renderMultiple(result)
    }

    if (typeof result === 'object' && result !== null && 'render' in result) {
      return result.render()
    }

    return JSON.stringify(result, null, 2)
  }

  static isComponent(result: unknown): result is RenderableComponent {
    return (
      typeof result === 'object' &&
      result !== null &&
      'render' in result &&
      typeof (result as RenderableComponent).render === 'function'
    )
  }

  static isComponentArray(
    result: unknown,
  ): result is Array<string | RenderableComponent> {
    return (
      Array.isArray(result) &&
      result.every((item) => typeof item === 'string' || this.isComponent(item))
    )
  }

  /**
   * 获取组件的元数据（如果可用）
   */
  static getComponentMetadata(result: unknown): Record<string, unknown> | null {
    if (this.isComponent(result) && 'getMetaData' in result) {
      return (result as any).getMetaData()
    }
    return null
  }

  /**
   * 执行组件的生命周期方法
   */
  static mountComponent(result: unknown): void {
    if (this.isComponent(result) && 'onMount' in result) {
      ;(result as any).onMount()
    }
  }

  static unmountComponent(result: unknown): void {
    if (this.isComponent(result) && 'onUnmount' in result) {
      ;(result as any).onUnmount()
    }
  }

  /**
   * 渲染多个结果
   */
  static renderMultiple(results: Array<string | RenderableComponent>): string {
    return results.map((result) => this.render(result)).join('\n')
  }

  /**
   * 创建包装器，为组件添加额外的样式或功能
   */
  static wrapComponent(
    result: string | RenderableComponent | Array<string | RenderableComponent>,
    wrapperClass?: string,
    wrapperId?: string,
  ): string {
    const content = this.render(result)
    const idAttr = wrapperId ? ` id="${wrapperId}"` : ''
    const classAttr = wrapperClass ? ` class="${wrapperClass}"` : ''

    return `<div${idAttr}${classAttr}>${content}</div>`
  }

  /**
   * 为组件添加交互功能
   */
  static addInteractivity(
    result: string | RenderableComponent | Array<string | RenderableComponent>,
    eventHandlers: Record<string, (event: any) => void>,
  ): string {
    const content = this.render(result)

    // 这里可以添加事件绑定逻辑
    // 在实际实现中，你可能需要使用微信小程序的事件系统

    return content
  }

  /**
   * 验证组件结果的有效性
   */
  static validateResult(result: unknown): {
    isValid: boolean
    message?: string
  } {
    if (typeof result === 'string') {
      return { isValid: true }
    }

    if (this.isComponent(result)) {
      return { isValid: true }
    }

    if (this.isComponentArray(result)) {
      return { isValid: true }
    }

    return {
      isValid: false,
      message: '结果必须是字符串、组件实例或组件数组',
    }
  }
}
