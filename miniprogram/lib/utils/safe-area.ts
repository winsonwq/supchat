export default function getSafeArea() {
  const rect = wx.getMenuButtonBoundingClientRect()
  const res = wx.getSystemInfoSync()
  const isAndroid = res.platform === 'android'
  const isDevtools = res.platform === 'devtools'
  return {
    ios: !isAndroid,
    isAndroid,
    isDevtools,
    windowWidth: res.windowWidth,
    menuButtonLeft: rect.left,
    safeAreaTop: res.safeArea?.top || 0,
    rightPadding: res.windowWidth - rect.left,
    leftWidth: res.windowWidth - rect.left,
  }
}
