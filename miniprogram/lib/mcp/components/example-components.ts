// 示例组件 - 展示如何使用新的组件架构
import { BaseComponent } from './base-component.js'

// 信息卡片组件
export class InfoCard extends BaseComponent {
  constructor(
    private title: string,
    private content: string,
    private type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) {
    super()
  }

  render(): string {
    const typeStyles = {
      info: 'border-blue-200 bg-blue-50 text-blue-800',
      success: 'border-green-200 bg-green-50 text-green-800',
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      error: 'border-red-200 bg-red-50 text-red-800'
    }

    return `
<div class="${this.getCardStyles()} border-l-4 ${typeStyles[this.type]} p-4">
    <h3 class="text-lg font-semibold mb-2">${this.title}</h3>
    <p class="text-sm">${this.content}</p>
</div>
    `
  }
}

// 数据表格组件
export class DataTable extends BaseComponent {
  constructor(
    private headers: string[],
    private rows: string[][]
  ) {
    super()
  }

  render(): string {
    const headerRow = this.headers.map(header => `<th class="px-4 py-2 text-left bg-gray-50">${header}</th>`).join('')
    const dataRows = this.rows.map(row => 
      `<tr>${row.map(cell => `<td class="px-4 py-2 border-t">${cell}</td>`).join('')}</tr>`
    ).join('')

    return `
<div class="${this.getCardStyles()} p-4">
    <table class="w-full">
        <thead>
            <tr>${headerRow}</tr>
        </thead>
        <tbody>${dataRows}</tbody>
    </table>
</div>
    `
  }
}

// 操作按钮组组件
export class ActionButtonGroup extends BaseComponent {
  constructor(
    private actions: Array<{
      label: string
      action: string
      variant?: 'primary' | 'secondary' | 'success' | 'danger'
      icon?: string
    }>
  ) {
    super()
  }

  render(): string {
    const buttons = this.actions.map(action => {
      const icon = action.icon ? `<span class="${this.getIconStyles()}">${action.icon}</span>` : ''
      return `
<button class="${this.getButtonStyles(action.variant || 'primary')} flex-1" ${this.bindEvent(action.action, 'click', action.action)}>
    ${icon}${action.label}
</button>
      `
    }).join('')

    return `
<div class="flex space-x-2">
    ${buttons}
</div>
    `
  }
}

// 统计卡片组件
export class StatCard extends BaseComponent {
  constructor(
    private title: string,
    private value: string | number,
    private change?: string,
    private trend?: 'up' | 'down' | 'neutral'
  ) {
    super()
  }

  render(): string {
    const trendIcon = this.trend === 'up' ? '📈' : this.trend === 'down' ? '📉' : '➡️'
    const changeDisplay = this.change ? `
<div class="text-sm ${this.trend === 'up' ? 'text-green-600' : this.trend === 'down' ? 'text-red-600' : 'text-gray-600'}">
    ${trendIcon} ${this.change}
</div>
    ` : ''

    return `
<div class="${this.getCardStyles()} p-4 text-center">
    <h3 class="text-sm font-medium text-gray-600 mb-1">${this.title}</h3>
    <div class="text-2xl font-bold text-gray-900 mb-1">${this.value}</div>
    ${changeDisplay}
</div>
    `
  }
}
