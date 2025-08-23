// content-parser.ts
import { TowxmlNode, WxEvent, RenderNode } from '../mcp/types.js'
import { BaseComponent } from '../mcp/components/base-component.js'

/**
 * 判断内容是否为HTML格式
 * @param content 内容字符串
 * @returns 是否为HTML
 */
export function isHtmlContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // HTML标签模式
  const htmlPatterns = [
    /<[^>]+>/, // 包含HTML标签
    /&[a-zA-Z]+;/, // HTML实体
    /<[a-zA-Z][a-zA-Z0-9]*\s+[^>]*>/, // 带属性的HTML标签
  ]
  
  // 检查是否包含HTML特征
  const hasHtmlTags = htmlPatterns.some(pattern => pattern.test(content))
  
  // 如果包含HTML标签，进一步检查是否为有效的HTML结构
  if (hasHtmlTags) {
    // 检查是否有完整的HTML文档结构
    const hasHtmlDoc = /<html[^>]*>.*<\/html>/i.test(content)
    const hasBody = /<body[^>]*>.*<\/body>/i.test(content)
    const hasDiv = /<div[^>]*>.*<\/div>/i.test(content)
    const hasSpan = /<span[^>]*>.*<\/span>/i.test(content)
    const hasP = /<p[^>]*>.*<\/p>/i.test(content)
    
    // 如果包含完整的HTML结构，则认为是HTML
    if (hasHtmlDoc || hasBody || hasDiv || hasSpan || hasP) {
      return true
    }
    
    // 检查是否包含组件相关的HTML结构
    const hasComponentStructure = /data-component-id|data-action|class="[^"]*component[^"]*"/i.test(content)
    if (hasComponentStructure) {
      return true
    }
  }
  
  return false
}

/**
 * 判断内容是否为Markdown格式
 * @param content 内容字符串
 * @returns 是否为Markdown
 */
export function isMarkdownContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  // Markdown语法模式
  const markdownPatterns = [
    /^#{1,6}\s+/m, // 标题
    /\*\*(.*?)\*\*/, // 粗体
    /\*(.*?)\*/, // 斜体
    /`(.*?)`/, // 行内代码
    /```[\s\S]*?```/, // 代码块
    /^[-*+]\s/m, // 无序列表
    /^\d+\.\s/m, // 有序列表
    /^>\s/m, // 引用
    /\[.*?\]\(.*?\)/, // 链接
    /!\[.*?\]\(.*?\)/, // 图片
    /^\|.*\|$/m, // 表格
    /^[-*_]{3,}$/m, // 分割线
    /~~(.*?)~~/, // 删除线
    /^`{3,}[a-zA-Z]*$/m, // 代码块开始
  ]
  
  // 检查是否包含Markdown语法
  const hasMarkdownSyntax = markdownPatterns.some(pattern => pattern.test(content))
  
  // 如果包含Markdown语法，进一步检查是否为纯Markdown
  if (hasMarkdownSyntax) {
    // 检查是否同时包含HTML标签（可能是混合内容）
    const hasHtmlTags = /<[^>]+>/.test(content)
    
    // 如果包含HTML标签，需要进一步判断
    if (hasHtmlTags) {
      // 检查HTML标签是否只是简单的格式化标签
      const simpleHtmlTags = /<(b|strong|i|em|code|pre|br|hr)[^>]*>/i
      const hasOnlySimpleTags = !/<(?!\/?(b|strong|i|em|code|pre|br|hr)\b)[^>]+>/i.test(content)
      
      // 如果只包含简单的HTML标签，可能是Markdown转换后的结果
      if (hasOnlySimpleTags) {
        return true
      }
      
      // 如果包含复杂的HTML结构，可能是HTML内容
      return false
    }
    
    return true
  }
  
  return false
}

/**
 * 智能判断内容类型并返回相应的解析类型
 * @param content 内容字符串
 * @returns 内容类型
 */
export function detectContentType(content: string): 'html' | 'markdown' | 'text' {
  if (isHtmlContent(content)) {
    return 'html'
  } else if (isMarkdownContent(content)) {
    return 'markdown'
  } else {
    return 'text'
  }
}

/**
 * 处理消息内容，智能判断类型并使用towxml解析
 * @param content 消息内容
 * @param app towxml应用实例
 * @param eventHandler 事件处理器
 * @returns towxml节点
 */
export function processMessageContent(
  content: RenderNode,
  app: any,
  eventHandler?: (e: WxEvent) => void
): TowxmlNode | undefined {
  try {
    let html: string
    let contentType: 'html' | 'markdown' | 'text'
    
    if (content instanceof BaseComponent) {
      // 如果是组件，渲染为HTML
      html = content.render()
      contentType = 'html'
    } else {
      // 如果是字符串，智能判断类型
      const contentStr = String(content)
      contentType = detectContentType(contentStr)
      html = contentStr
    }
    
    // 根据内容类型选择解析方式
    let towxmlNodes: TowxmlNode
    
    if (contentType === 'html') {
      towxmlNodes = app.towxml(html, 'html', {
        events: eventHandler ? {
          tap: eventHandler
        } : undefined
      })
    } else if (contentType === 'markdown') {
      towxmlNodes = app.towxml(html, 'markdown', {
        events: eventHandler ? {
          tap: eventHandler
        } : undefined
      })
    } else {
      // 纯文本
      towxmlNodes = app.towxml(html, 'text')
    }
    
    return towxmlNodes
  } catch (error) {
    console.error('towxml解析错误:', error)
    // 解析失败时，尝试作为纯文本处理
    return app.towxml(String(content), 'text')
  }
}
