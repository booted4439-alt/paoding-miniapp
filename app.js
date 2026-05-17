/**
 * 演算法律 - 小程序入口
 */
App({
  globalData: {
    userInfo: null,
    token: null,
    // WebSocket 连接
    socketTask: null,
    // 已加入的房间
    joinedRooms: new Set()
  },

  onLaunch() {
    // 尝试从缓存恢复登录状态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  },

  /**
   * 保存登录状态
   */
  setLogin(token, userInfo) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
  },

  /**
   * 清除登录状态
   */
  clearLogin() {
    this.globalData.token = null
    this.globalData.userInfo = null
    this.globalData.joinedRooms.clear()
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  /**
   * WebSocket 连接（Socket.IO）
   * 小程序不支持原生 Socket.IO，需要后端适配或使用 HTTP 轮询
   * 这里使用 HTTP 轮询替代实时消息
   * 如需实时通知，后端可增加长轮询或 SSE 支持
   */
  connectSocket() {
    // 保留接口，实际使用 HTTP polling
    console.log('WebSocket 连接（通过 HTTP polling 替代）')
  }
})
