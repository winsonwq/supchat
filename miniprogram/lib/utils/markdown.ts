// markdown.ts

/**
 * 将Markdown文本转换为富文本格式
 * @param markdown Markdown文本
 * @returns 富文本节点数组
 */
export function parseMarkdown(markdown: string): any[] {
  if (!markdown) return []
  
  const nodes: any[] = []
  const lines = markdown.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 空行
    if (!line.trim()) {
      nodes.push({
        type: 'text',
        text: '\n'
      })
      continue
    }
    
    // 标题
    if (line.match(/^#{1,6}\s/)) {
      const level = line.match(/^(#{1,6})\s/)?.[1]?.length || 1
      const text = line.replace(/^#{1,6}\s/, '')
      nodes.push({
        type: 'heading',
        level,
        text: text.trim()
      })
      continue
    }
    
    // 代码块
    if (line.startsWith('```')) {
      const language = line.replace('```', '').trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push({
        type: 'code-block',
        language,
        code: codeLines.join('\n')
      })
      continue
    }
    
    // 引用
    if (line.startsWith('> ')) {
      const text = line.replace('> ', '')
      nodes.push({
        type: 'quote',
        text: text.trim()
      })
      continue
    }
    
    // 无序列表
    if (line.match(/^[-*+]\s/)) {
      const text = line.replace(/^[-*+]\s/, '')
      nodes.push({
        type: 'list-item',
        ordered: false,
        text: text.trim()
      })
      continue
    }
    
    // 有序列表
    if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '')
      nodes.push({
        type: 'list-item',
        ordered: true,
        text: text.trim()
      })
      continue
    }
    
    // 分割线
    if (line.match(/^[-*_]{3,}$/)) {
      nodes.push({
        type: 'hr'
      })
      continue
    }
    
    // 普通文本（处理行内格式）
    const processedText = processInlineFormatting(line)
    nodes.push({
      type: 'text',
      text: processedText
    })
  }
  
  return nodes
}

/**
 * 处理行内格式（粗体、斜体、代码、链接等）
 * @param text 文本内容
 * @returns 处理后的文本
 */
function processInlineFormatting(text: string): string {
  // 这里可以添加行内格式处理逻辑
  // 由于小程序富文本组件限制，暂时返回原文本
  return text
}

/**
 * 检查文本是否包含Markdown语法
 * @param text 文本内容
 * @returns 是否包含Markdown语法
 */
export function hasMarkdown(text: string): boolean {
  if (!text) return false
  
  const markdownPatterns = [
    /\*\*(.*?)\*\*/, // 粗体
    /\*(.*?)\*/, // 斜体
    /`(.*?)`/, // 行内代码
    /```[\s\S]*?```/, // 代码块
    /^#{1,6}\s/m, // 标题
    /^[-*+]\s/m, // 无序列表
    /^\d+\.\s/m, // 有序列表
    /^>\s/m, // 引用
    /\[.*?\]\(.*?\)/, // 链接
    /!\[.*?\]\(.*?\)/, // 图片
    /^\|.*\|$/m, // 表格
    /^[-*_]{3,}$/m, // 分割线
  ]
  
  return markdownPatterns.some(pattern => pattern.test(text))
}

/**
 * 将Markdown节点转换为富文本格式
 * @param nodes Markdown节点数组
 * @returns 富文本格式字符串
 */
export function nodesToRichText(nodes: any[]): string {
  return nodes.map(node => {
    switch (node.type) {
      case 'heading':
        return `<view class="markdown-h${node.level}">${node.text}</view>`
      case 'code-block':
        return `<view class="code-block">
          <view class="code-header">${node.language || 'code'}</view>
          <view class="code-content">${node.code}</view>
        </view>`
      case 'quote':
        return `<view class="markdown-quote">${node.text}</view>`
      case 'list-item':
        const listType = node.ordered ? 'ol' : 'ul'
        return `<view class="markdown-${listType}-item">${node.text}</view>`
      case 'hr':
        return `<view class="markdown-hr"></view>`
      case 'text':
      default:
        return node.text
    }
  }).join('\n')
}
