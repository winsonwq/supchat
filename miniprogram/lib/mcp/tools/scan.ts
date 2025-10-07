import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 扫码工具的参数定义
const scanCodeInputSchema = {
  type: 'object',
  properties: {
    scanType: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['qrCode', 'barCode', 'datamatrix', 'pdf417']
      },
      description: '扫码类型：qrCode(二维码)、barCode(条形码)、datamatrix、pdf417',
      default: ['qrCode', 'barCode'],
    },
    autoZoom: {
      type: 'boolean',
      description: '是否自动放大',
      default: true,
    },
    onlyFromCamera: {
      type: 'boolean',
      description: '是否只能从相机扫码，不允许从相册选择图片',
      default: false,
    },
  },
  required: [],
}

// 扫码工具处理函数
async function scanCodeHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const scanType = (args.scanType as string[]) || ['qrCode', 'barCode']
  const autoZoom = (args.autoZoom as boolean) !== false
  const onlyFromCamera = (args.onlyFromCamera as boolean) || false

  return new Promise((resolve, reject) => {
    wx.scanCode({
      scanType: scanType,
      autoZoom: autoZoom,
      onlyFromCamera: onlyFromCamera,
      success: (res) => {
        // 生成扫码结果报告
        const scanReport = `# 📱 扫码结果

## 🕐 扫码时间
- **扫码时间**: ${new Date().toLocaleString('zh-CN')}

## 📊 扫码信息
- **扫码类型**: ${res.scanType}
- **扫码结果**: ${res.result}
- **字符集**: ${res.charSet || '未知'}
- **路径**: ${res.path || '未知'}

## 🔍 扫码设置
- **支持类型**: ${scanType.join(', ')}
- **自动放大**: ${autoZoom ? '是' : '否'}
- **仅相机**: ${onlyFromCamera ? '是' : '否'}

## 📝 结果分析
${analyzeScanResult(res.result, res.scanType)}

---
*数据来源: 微信小程序扫码API*`

        resolve({
          success: true,
          data: {
            scanResult: res,
            report: scanReport,
          },
        })
      },
      fail: (error) => {
        console.error('扫码失败:', error)
        resolve({
          success: false,
          error: `扫码失败: ${error.errMsg}`,
        })
      },
    })
  })
}

// 分析扫码结果
function analyzeScanResult(result: string, scanType: string): string {
  let analysis = ''
  
  if (scanType === 'qrCode') {
    // 分析二维码内容
    if (result.startsWith('http://') || result.startsWith('https://')) {
      analysis += '- **内容类型**: 网址链接\n'
      analysis += '- **建议操作**: 可以打开链接或复制链接\n'
    } else if (result.startsWith('tel:')) {
      analysis += '- **内容类型**: 电话号码\n'
      analysis += '- **建议操作**: 可以拨打电话\n'
    } else if (result.startsWith('mailto:')) {
      analysis += '- **内容类型**: 邮箱地址\n'
      analysis += '- **建议操作**: 可以发送邮件\n'
    } else if (result.startsWith('WIFI:')) {
      analysis += '- **内容类型**: WiFi配置信息\n'
      analysis += '- **建议操作**: 可以连接WiFi网络\n'
    } else if (result.startsWith('BEGIN:VCARD')) {
      analysis += '- **内容类型**: 联系人信息\n'
      analysis += '- **建议操作**: 可以添加联系人\n'
    } else {
      analysis += '- **内容类型**: 文本内容\n'
      analysis += '- **建议操作**: 可以复制文本\n'
    }
  } else if (scanType === 'barCode') {
    // 分析条形码内容
    analysis += '- **内容类型**: 条形码\n'
    analysis += '- **建议操作**: 可以查询商品信息或复制编码\n'
  } else {
    analysis += '- **内容类型**: 其他类型码\n'
    analysis += '- **建议操作**: 可以复制内容\n'
  }
  
  return analysis
}

// 扫码工具配置
export const scanCodeTool: ToolBaseConfig = {
  name: 'scanCode',
  description: '扫描二维码或条形码',
  inputSchema: scanCodeInputSchema,
  chineseName: '扫码',
  needUserConfirm: true,
  handler: scanCodeHandler,
}
