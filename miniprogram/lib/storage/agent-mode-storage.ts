// Agent 模式状态存储管理
import { AgentDefinition } from '../types/agent'
import { AgentConfigStorage } from './agent-config-storage'

const AGENT_MODE_STORAGE_KEY = 'agent_mode_state'

interface AgentModeState {
  isAgentMode: boolean
  currentAgentId: string | null
  lastUpdated: number
}

export class AgentModeStorage {
  /**
   * 获取当前Agent模式状态（内部使用）
   */
  private static getAgentModeStateRaw(): AgentModeState {
    try {
      const data = wx.getStorageSync(AGENT_MODE_STORAGE_KEY)
      if (data) {
        const state = JSON.parse(data) as AgentModeState
        // 验证数据结构的完整性
        if (typeof state.isAgentMode === 'boolean') {
          return {
            isAgentMode: state.isAgentMode,
            currentAgentId: state.currentAgentId || null,
            lastUpdated: state.lastUpdated || Date.now()
          }
        }
      }
    } catch (error) {
      console.error('获取Agent模式状态失败:', error)
    }
    
    // 返回默认状态
    return {
      isAgentMode: false,
      currentAgentId: null,
      lastUpdated: Date.now()
    }
  }

  /**
   * 保存Agent模式状态
   */
  private static setAgentModeState(state: Partial<AgentModeState>): boolean {
    try {
      const currentState = this.getAgentModeStateRaw()
      const newState: AgentModeState = {
        ...currentState,
        ...state,
        lastUpdated: Date.now()
      }
      
      wx.setStorageSync(AGENT_MODE_STORAGE_KEY, JSON.stringify(newState))
      return true
    } catch (error) {
      console.error('保存Agent模式状态失败:', error)
      return false
    }
  }

  /**
   * 设置Agent模式开关状态
   */
  static setAgentModeEnabled(enabled: boolean): boolean {
    return this.setAgentModeState({ isAgentMode: enabled })
  }

  /**
   * 设置当前选中的Agent ID
   */
  static setCurrentAgentId(agentId: string | null): boolean {
    return this.setAgentModeState({ currentAgentId: agentId })
  }

  /**
   * 获取Agent模式是否启用
   */
  static isAgentModeEnabled(): boolean {
    return this.getAgentModeStateRaw().isAgentMode
  }

  /**
   * 获取当前选中的Agent ID
   */
  static getCurrentAgentId(): string | null {
    return this.getAgentModeStateRaw().currentAgentId
  }

  /**
   * 获取当前选中的Agent（从AgentConfigStorage动态获取最新配置）
   */
  static getCurrentAgent(): AgentDefinition | null {
    const agentId = this.getCurrentAgentId()
    if (!agentId) {
      return null
    }
    
    // 从AgentConfigStorage获取最新配置
    const agent = AgentConfigStorage.getConfigById(agentId)
    
    if (!agent) {
      // Agent已被删除，清除存储的ID
      this.setCurrentAgentId(null)
      return null
    }
    
    return agent
  }

  /**
   * 获取Agent模式状态（包含完整的Agent对象）
   */
  static getAgentModeState(): { isAgentMode: boolean; currentAgent: AgentDefinition | null; lastUpdated: number } {
    const state = this.getAgentModeStateRaw()
    return {
      isAgentMode: state.isAgentMode,
      currentAgent: this.getCurrentAgent(),
      lastUpdated: state.lastUpdated
    }
  }

  /**
   * 清除Agent模式状态
   */
  static clearAgentModeState(): boolean {
    try {
      wx.removeStorageSync(AGENT_MODE_STORAGE_KEY)
      return true
    } catch (error) {
      console.error('清除Agent模式状态失败:', error)
      return false
    }
  }

  /**
   * 验证Agent配置是否仍然有效
   */
  static validateStoredAgent(): AgentDefinition | null {
    return this.getCurrentAgent()
  }
}
