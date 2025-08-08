import { ToolBaseConfig, ToolCallResult } from '../types.js'

// 打开照片工具的参数定义
const openPhotoInputSchema = {
  type: 'object',
  properties: {
    sourceType: {
      type: 'string',
      enum: ['album', 'camera'],
      description: '选择图片来源：相册或相机',
      default: 'album',
    },
    count: {
      type: 'number',
      description: '最多可以选择的图片张数',
      minimum: 1,
      maximum: 9,
      default: 1,
    },
    sizeType: {
      type: 'string',
      enum: ['original', 'compressed'],
      description: '所选的图片的尺寸',
      default: 'compressed',
    },
  },
  required: ['sourceType'],
}

// 打开照片工具处理函数
async function openPhotoHandler(
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  const sourceType = args.sourceType as 'album' | 'camera'
  const count = (args.count as number) || 1
  const sizeType = (args.sizeType as 'original' | 'compressed') || 'compressed'

  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: count,
      mediaType: ['image'],
      sourceType: [sourceType],
      sizeType: [sizeType],
      success: (res) => {
        console.log('选择照片成功:', res)
        resolve({
          success: true,
          data: {
            tempFiles: res.tempFiles,
            tempFilePaths: res.tempFiles.map((file) => file.tempFilePath),
          },
        })
      },
      fail: (error) => {
        console.error('选择照片失败:', error)
        resolve({
          success: false,
          error: `选择照片失败: ${error.errMsg}`,
        })
      },
    })
  })
}

// 打开照片工具配置
export const openPhotoTool: ToolBaseConfig = {
  name: 'openPhoto',
  description: '打开相册或相机选择照片',
  inputSchema: openPhotoInputSchema,
  chineseName: '打开照片',
  needUserConfirm: true,
  handler: openPhotoHandler,
}
