// markdown.ts

/**
 * 简单的 Markdown 文本处理
 * @param markdown Markdown 文本
 * @returns 处理后的文本
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) {
    return ''
  }
  
  // 简单的 Markdown 处理，转换为纯文本
  // 移除 Markdown 语法标记
  let text = markdown
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.*?)`/g, '$1') // 移除行内代码标记
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/^[-*+]\s+/gm, '') // 移除列表标记
    .replace(/^\d+\.\s+/gm, '') // 移除有序列表标记
    .replace(/^>\s+/gm, '') // 移除引用标记
    .replace(/^\|.*\|$/gm, '') // 移除表格
    .replace(/^[-*_]{3,}$/gm, '') // 移除分割线
  
  return text.trim()
}

/**
 * 检查文本是否包含 Markdown 语法
 * @param text 文本内容
 * @returns 是否包含 Markdown 语法
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
