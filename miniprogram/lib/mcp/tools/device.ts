import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 获取设备信息工具的参数定义
const getDeviceInfoInputSchema = {
  type: 'object',
  properties: {
    includeSystemInfo: {
      type: 'boolean',
      description: '是否包含系统信息',
      default: true,
    },
    includeDeviceInfo: {
      type: 'boolean',
      description: '是否包含设备信息',
      default: true,
    },
    includeAppInfo: {
      type: 'boolean',
      description: '是否包含应用信息',
      default: true,
    },
  },
  required: [],
}

// 获取设备信息工具处理函数
async function getDeviceInfoHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const includeSystemInfo = (args.includeSystemInfo as boolean) !== false
  const includeDeviceInfo = (args.includeDeviceInfo as boolean) !== false
  const includeAppInfo = (args.includeAppInfo as boolean) !== false

  return new Promise((resolve, reject) => {
    wx.getSystemInfo({
      success: (res) => {
        // 生成设备信息报告
        let deviceReport = `# 📱 设备信息报告

## 🕐 获取时间
- **获取时间**: ${new Date().toLocaleString('zh-CN')}

`

        if (includeSystemInfo) {
          deviceReport += `## 💻 系统信息
- **操作系统**: ${res.platform}
- **系统版本**: ${res.system}
- **系统语言**: ${res.language}
- **系统主题**: ${res.theme || '未知'}

`
        }

        if (includeDeviceInfo) {
          deviceReport += `## 📱 设备信息
- **设备品牌**: ${res.brand}
- **设备型号**: ${res.model}
- **设备像素比**: ${res.pixelRatio}
- **屏幕宽度**: ${res.screenWidth}px
- **屏幕高度**: ${res.screenHeight}px
- **窗口宽度**: ${res.windowWidth}px
- **窗口高度**: ${res.windowHeight}px
- **状态栏高度**: ${res.statusBarHeight}px
- **安全区域**: ${JSON.stringify(res.safeArea || {}, null, 2)}

`
        }

        if (includeAppInfo) {
          deviceReport += `## 📱 应用信息
- **微信版本**: ${res.version}
- **基础库版本**: ${res.SDKVersion}
- **宿主环境**: ${res.host?.appId || '未知'}
- **字体大小设置**: ${res.fontSizeSetting || '未知'}

`
        }

        deviceReport += `---
*数据来源: 微信小程序系统信息API*`

        resolve({
          success: true,
          data: {
            systemInfo: res,
            report: deviceReport,
          },
        })
      },
      fail: (error) => {
        console.error('获取设备信息失败:', error)
        resolve({
          success: false,
          error: `获取设备信息失败: ${error.errMsg}`,
        })
      },
    })
  })
}

// 获取设备信息工具配置
export const getDeviceInfoTool: ToolBaseConfig = {
  name: 'getDeviceInfo',
  description: '获取设备系统信息',
  inputSchema: getDeviceInfoInputSchema,
  chineseName: '设备信息',
  needUserConfirm: false,
  handler: getDeviceInfoHandler,
}
