import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 获取位置工具的参数定义
const getLocationInputSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['wgs84', 'gcj02'],
      description: '坐标类型：wgs84为GPS坐标，gcj02为火星坐标系',
      default: 'gcj02',
    },
    isHighAccuracy: {
      type: 'boolean',
      description: '是否开启高精度定位',
      default: false,
    },
    highAccuracyExpireTime: {
      type: 'number',
      description: '超时时间，单位ms，默认5000ms',
      default: 5000,
    },
  },
  required: [],
}

// 获取位置工具处理函数
async function getLocationHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const type = (args.type as 'wgs84' | 'gcj02') || 'gcj02'
  const isHighAccuracy = (args.isHighAccuracy as boolean) || false
  const highAccuracyExpireTime = (args.highAccuracyExpireTime as number) || 5000

  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: type,
      isHighAccuracy: isHighAccuracy,
      highAccuracyExpireTime: highAccuracyExpireTime,
      success: (res) => {
        console.log('获取位置成功:', res)
        
        // 生成位置信息报告
        const locationReport = `# 📍 位置信息

## 🌍 坐标信息
- **纬度**: ${res.latitude}°
- **经度**: ${res.longitude}°
- **坐标类型**: ${type === 'wgs84' ? 'GPS坐标' : '火星坐标系'}

## 📊 精度信息
- **精度**: ${res.accuracy}米
- **高精度**: ${isHighAccuracy ? '是' : '否'}
- **垂直精度**: ${res.verticalAccuracy || '未知'}米
- **水平精度**: ${res.horizontalAccuracy || '未知'}米

## 🕐 时间信息
- **获取时间**: ${new Date().toLocaleString('zh-CN')}

---
*数据来源: 微信小程序定位服务*`

        resolve({
          success: true,
          data: {
            location: res,
            report: locationReport,
          },
        })
      },
      fail: (error) => {
        console.error('获取位置失败:', error)
        resolve({
          success: false,
          error: `获取位置失败: ${error.errMsg}`,
        })
      },
    })
  })
}

// 获取位置工具配置
export const getLocationTool: ToolBaseConfig = {
  name: 'getLocation',
  description: '获取用户当前位置信息',
  inputSchema: getLocationInputSchema,
  chineseName: '获取位置',
  needUserConfirm: true,
  handler: getLocationHandler,
}
