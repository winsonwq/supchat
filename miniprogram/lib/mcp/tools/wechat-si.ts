/**
 * 微信同声传译插件基础集成
 * 提供 requirePlugin("WechatSI") 的基本功能
 * 参考文档：https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/extended/translator.html
 */

export interface WechatSIResult {
  success: boolean
  text?: string
  error?: string
  duration?: number
  filename?: string
  expired_time?: number
}

export interface WechatSIOptions {
  lang?: string
  duration?: number
  tts?: boolean
}

/**
 * 微信同声传译插件服务类
 */
export class WechatSIService {
  private static instance: WechatSIService
  private plugin: any = null
  private isInitialized = false
  private recordRecoManager: any = null

  private constructor() {}

  static getInstance(): WechatSIService {
    if (!WechatSIService.instance) {
      WechatSIService.instance = new WechatSIService()
    }
    return WechatSIService.instance
  }

  /**
   * 初始化微信同声传译插件
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true
      }

      // 检查是否在微信小程序环境中
      if (typeof wx === 'undefined') {
        console.error('微信同声传译插件只能在微信小程序环境中使用')
        return false
      }

      // 检查插件是否可用
      if (typeof requirePlugin === 'undefined') {
        console.error('当前微信版本不支持插件功能')
        return false
      }

      // 加载微信同声传译插件
      this.plugin = requirePlugin('WechatSI')
      
      if (!this.plugin) {
        console.error('无法加载微信同声传译插件')
        return false
      }

      // 初始化语音识别管理器
      this.recordRecoManager = this.plugin.getRecordRecognitionManager()
      console.log('🔧 recordRecoManager 创建成功')

      // 调试信息：显示插件可用的方法
      console.log('🔧 插件可用方法:', Object.keys(this.plugin))

      this.isInitialized = true
      console.log('微信同声传译插件初始化成功')
      return true

    } catch (error) {
      console.error('初始化微信同声传译插件失败:', error)
      return false
    }
  }

  /**
   * 检查插件是否已初始化
   */
  isPluginInitialized(): boolean {
    return this.isInitialized && this.plugin !== null
  }

  /**
   * 获取插件实例
   */
  getPlugin(): any {
    return this.plugin
  }

  /**
   * 获取语音识别管理器
   */
  getRecordRecognitionManager(): any {
    return this.recordRecoManager
  }

  /**
   * 语音识别（录音文件转文字）
   * @param audioPath 音频文件路径
   * @param options 识别选项
   * @returns 识别结果
   */
  async recognizeVoiceFromFile(audioPath: string, options: WechatSIOptions = {}): Promise<WechatSIResult> {
    try {
      if (!this.isPluginInitialized()) {
        const initialized = await this.initialize()
        if (!initialized) {
          return {
            success: false,
            error: '微信同声传译插件初始化失败'
          }
        }
      }

      // 由于微信同声传译插件不直接支持录音文件转文字，
      // 我们需要使用其他方式或者回退到模拟识别
      console.log('⚠️ 微信同声传译插件不直接支持录音文件转文字，将使用模拟识别')
      
      return {
        success: false,
        error: '微信同声传译插件不直接支持录音文件转文字，请使用实时语音识别'
      }
    } catch (error) {
      console.error('语音识别异常:', error)
      return {
        success: false,
        error: '语音识别服务异常'
      }
    }
  }

  /**
   * 开始实时语音识别
   * @param options 识别选项
   * @returns 识别结果
   */
  async startRealtimeRecognition(options: WechatSIOptions = {}): Promise<WechatSIResult> {
    try {
      if (!this.isPluginInitialized()) {
        const initialized = await this.initialize()
        if (!initialized) {
          return {
            success: false,
            error: '微信同声传译插件初始化失败'
          }
        }
      }

      return new Promise((resolve, reject) => {
        let hasResolved = false

        // 严格按照官方文档的方式设置事件监听器
        this.recordRecoManager.onStart = function(res: any) {
          console.log('🎤 开始录音识别')
        }

        this.recordRecoManager.onStop = function(res: any) {
          console.log('✅ 识别完成:', res.result ? '成功' : '失败')
          
          if (!hasResolved) {
            hasResolved = true
            
            // 检查是否有识别结果
            if (res.result && res.result.trim()) {
              resolve({
                success: true,
                text: res.result.trim(),
                duration: res.duration,
                filename: res.tempFilePath
              })
            } else if (res.tempFilePath) {
              // 如果有录音文件但没有识别结果，可能是识别失败
              resolve({
                success: false,
                error: '语音识别失败：未返回识别结果'
              })
            } else {
              resolve({
                success: false,
                error: '语音识别异常：既无结果也无录音文件'
              })
            }
          }
        }

        this.recordRecoManager.onError = function(res: any) {
          console.error('❌ 识别错误:', res.msg)
          
          if (!hasResolved) {
            hasResolved = true
            resolve({
              success: false,
              error: `语音识别错误: ${res.msg} (错误码: ${res.retcode})`
            })
          }
        }

        // 开始语音识别
        this.recordRecoManager.start({
          duration: options.duration || 30000,
          lang: options.lang || 'zh_CN'
        })
        
        // 设置超时处理
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true
            this.recordRecoManager.stop()
            resolve({
              success: false,
              error: '语音识别超时'
            })
          }
        }, (options.duration || 30000) + 5000) // 额外5秒超时
      })
    } catch (error) {
      console.error('实时语音识别异常:', error)
      return {
        success: false,
        error: '实时语音识别服务异常'
      }
    }
  }

  /**
   * 文本翻译
   * @param content 要翻译的文本
   * @param lfrom 源语言
   * @param lto 目标语言
   * @param tts 是否进行语音合成
   * @returns 翻译结果
   */
  async translateText(content: string, lfrom: string = 'zh_CN', lto: string = 'en_US', tts: boolean = false): Promise<WechatSIResult> {
    try {
      if (!this.isPluginInitialized()) {
        const initialized = await this.initialize()
        if (!initialized) {
          return {
            success: false,
            error: '微信同声传译插件初始化失败'
          }
        }
      }

      return new Promise((resolve, reject) => {
        this.plugin.translate({
          lfrom: lfrom,
          lto: lto,
          content: content,
          tts: tts,
          success: (res: any) => {
            console.log('✅ 文本翻译成功:', res)
            if (res.retcode === 0) {
              resolve({
                success: true,
                text: res.result,
                filename: res.filename,
                expired_time: res.expired_time
              })
            } else {
              resolve({
                success: false,
                error: `翻译失败，错误码: ${res.retcode}`
              })
            }
          },
          fail: (err: any) => {
            console.error('❌ 文本翻译失败:', err)
            resolve({
              success: false,
              error: `翻译失败: ${err.msg} (错误码: ${err.retcode})`
            })
          }
        })
      })
    } catch (error) {
      console.error('文本翻译异常:', error)
      return {
        success: false,
        error: '文本翻译服务异常'
      }
    }
  }

  /**
   * 语音合成（文字转语音）
   * @param content 要合成的文本
   * @param lang 语言
   * @returns 合成结果
   */
  async textToSpeech(content: string, lang: string = 'zh_CN'): Promise<WechatSIResult> {
    try {
      if (!this.isPluginInitialized()) {
        const initialized = await this.initialize()
        if (!initialized) {
          return {
            success: false,
            error: '微信同声传译插件初始化失败'
          }
        }
      }

      return new Promise((resolve, reject) => {
        this.plugin.textToSpeech({
          lang: lang,
          content: content,
          success: (res: any) => {
            console.log('✅ 语音合成成功:', res)
            if (res.retcode === 0) {
              resolve({
                success: true,
                text: res.origin,
                filename: res.filename,
                expired_time: res.expired_time
              })
            } else {
              resolve({
                success: false,
                error: `语音合成失败，错误码: ${res.retcode}`
              })
            }
          },
          fail: (err: any) => {
            console.error('❌ 语音合成失败:', err)
            resolve({
              success: false,
              error: `语音合成失败: ${err.msg} (错误码: ${err.retcode})`
            })
          }
        })
      })
    } catch (error) {
      console.error('语音合成异常:', error)
      return {
        success: false,
        error: '语音合成服务异常'
      }
    }
  }

  /**
   * 停止语音识别
   */
  stopVoiceRecognition(): void {
    try {
      if (this.recordRecoManager) {
        this.recordRecoManager.stop()
        console.log('🛑 语音识别已停止')
      }
    } catch (error) {
      console.error('停止语音识别失败:', error)
    }
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): string[] {
    return [
      'zh_CN', // 中国大陆
      'en_US', // 英语
      'zh_HK', // 香港
      'sichuanhua', // 四川话
      'yue' // 粤语
    ]
  }

  /**
   * 检查当前语言是否支持
   */
  isLanguageSupported(lang: string): boolean {
    return this.getSupportedLanguages().includes(lang)
  }
}

/**
 * 微信同声传译工具函数
 */
export const wechatSI = {
  /**
   * 获取服务实例
   */
  getService(): WechatSIService {
    return WechatSIService.getInstance()
  },

  /**
   * 录音文件转文字（不支持，会回退到模拟识别）
   */
  async recognizeVoiceFromFile(audioPath: string, options?: WechatSIOptions): Promise<WechatSIResult> {
    const service = WechatSIService.getInstance()
    return await service.recognizeVoiceFromFile(audioPath, options)
  },

  /**
   * 开始实时语音识别
   */
  async startRealtimeRecognition(options?: WechatSIOptions): Promise<WechatSIResult> {
    const service = WechatSIService.getInstance()
    return await service.startRealtimeRecognition(options)
  },

  /**
   * 文本翻译
   */
  async translateText(content: string, lfrom?: string, lto?: string, tts?: boolean): Promise<WechatSIResult> {
    const service = WechatSIService.getInstance()
    return await service.translateText(content, lfrom, lto, tts)
  },

  /**
   * 语音合成
   */
  async textToSpeech(content: string, lang?: string): Promise<WechatSIResult> {
    const service = WechatSIService.getInstance()
    return await service.textToSpeech(content, lang)
  },

  /**
   * 停止语音识别
   */
  stopVoiceRecognition(): void {
    const service = WechatSIService.getInstance()
    service.stopVoiceRecognition()
  },

  /**
   * 获取语音识别管理器
   */
  getRecordRecognitionManager(): any {
    const service = WechatSIService.getInstance()
    return service.getRecordRecognitionManager()
  },

  /**
   * 获取支持的语言
   */
  getSupportedLanguages(): string[] {
    const service = WechatSIService.getInstance()
    return service.getSupportedLanguages()
  },

  /**
   * 检查语言支持
   */
  isLanguageSupported(lang: string): boolean {
    const service = WechatSIService.getInstance()
    return service.isLanguageSupported(lang)
  }
}

export default wechatSI




