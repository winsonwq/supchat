export default function getSafeArea() {
  const rect = wx.getMenuButtonBoundingClientRect()
  const res = wx.getSystemInfoSync()
  const isAndroid = res.platform === 'android'
  const isDevtools = res.platform === 'devtools'
  const isIOS = !isAndroid && !isDevtools
  
  // 计算底部安全区域
  const safeAreaBottom = res.safeArea?.bottom || res.screenHeight
  const bottomSafeHeight = res.screenHeight - safeAreaBottom
  
  return {
    ios: isIOS,
    isAndroid,
    isDevtools,
    windowWidth: res.windowWidth,
    windowHeight: res.windowHeight,
    screenHeight: res.screenHeight,
    menuButtonLeft: rect.left,
    safeAreaTop: res.safeArea?.top || 0,
    safeAreaBottom: bottomSafeHeight,
    rightPadding: res.windowWidth - rect.left,
    leftWidth: res.windowWidth - rect.left,
  }
}
