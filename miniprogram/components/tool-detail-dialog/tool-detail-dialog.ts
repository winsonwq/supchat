// tool-detail-dialog.ts
import { MCPTool } from '../../lib/types/mcp-config'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示对话框
    visible: {
      type: Boolean,
      value: false
    },
    // 工具信息
    tool: {
      type: Object as () => MCPTool,
      value: {}
    },
    // 配置ID
    configId: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 关闭对话框
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 切换工具启用状态
     */
    onToggleTool() {
      this.triggerEvent('toggle', {
        configId: this.properties.configId,
        toolName: this.properties.tool.name
      })
    },

    /**
     * 检查属性是否必需
     */
    isPropertyRequired(propName: string): boolean {
      const { tool } = this.properties
      if (!tool.inputSchema || !tool.inputSchema.required) {
        return false
      }
      return tool.inputSchema.required.includes(propName)
    }
  }
})
