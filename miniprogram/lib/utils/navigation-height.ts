// 导航栏高度计算工具
import getSafeArea from './safe-area'

/**
 * 获取导航栏的总高度（包含安全区域）
 * @returns 导航栏总高度（px）
 */
export function getNavigationHeight(): number {
  const safeAreaData = getSafeArea()
  // Android导航栏高度48px，iOS导航栏高度44px
  const navBarHeight = safeAreaData.isAndroid ? 48 : 44
  // 导航栏高度 + 安全区域顶部高度
  return navBarHeight + safeAreaData.safeAreaTop
}

/**
 * 获取页面内容顶部间距的CSS样式字符串
 * @returns CSS padding-top 值
 */
export function getContentPaddingTop(): string {
  return `${getNavigationHeight()}px`
}
