import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 选择文件工具的参数定义
const chooseFileInputSchema = {
  type: 'object',
  properties: {
    count: {
      type: 'number',
      description: '最多可以选择的文件个数',
      minimum: 1,
      maximum: 100,
      default: 1,
    },
    type: {
      type: 'string',
      enum: ['all', 'video', 'image', 'file'],
      description: '所选的文件的类型',
      default: 'all',
    },
    extension: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: '根据文件扩展名过滤，仅 type 为 file 时有效',
      default: [],
    },
  },
  required: [],
}

// 选择文件工具处理函数
async function chooseFileHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const count = (args.count as number) || 1
  const type = (args.type as 'all' | 'video' | 'image' | 'file') || 'all'
  const extension = (args.extension as string[]) || []

  return new Promise((resolve, reject) => {
    wx.chooseMessageFile({
      count: count,
      type: type,
      extension: extension,
      success: (res) => {
        console.log('选择文件成功:', res)
        
        // 生成文件信息报告
        const fileReport = `# 📁 文件选择结果

## 📊 文件统计
- **选择数量**: ${res.tempFiles.length}/${count}
- **文件类型**: ${type === 'all' ? '全部类型' : type}

## 📋 文件列表
${res.tempFiles.map((file, index) => `
### 文件 ${index + 1}
- **文件名**: ${file.name}
- **文件大小**: ${(file.size / 1024).toFixed(2)} KB
- **文件路径**: ${file.path}
- **文件类型**: ${file.type || '未知'}
`).join('')}

## 🕐 选择时间
- **选择时间**: ${new Date().toLocaleString('zh-CN')}

---
*数据来源: 微信小程序文件选择服务*`

        resolve({
          success: true,
          data: {
            files: res.tempFiles,
            report: fileReport,
          },
        })
      },
      fail: (error) => {
        console.error('选择文件失败:', error)
        resolve({
          success: false,
          error: `选择文件失败: ${error.errMsg}`,
        })
      },
    })
  })
}

// 选择文件工具配置
export const chooseFileTool: ToolBaseConfig = {
  name: 'chooseFile',
  description: '选择聊天会话中的文件',
  inputSchema: chooseFileInputSchema,
  chineseName: '选择文件',
  needUserConfirm: true,
  handler: chooseFileHandler,
}
