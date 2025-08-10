/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    safeAreaTop: number,
  }
  towxml: any,
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}