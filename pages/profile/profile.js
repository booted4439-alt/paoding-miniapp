/**
 * 个人中心
 */
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    stats: {
      consultations: 0,
      active: 0
    }
  },

  onShow() {
    this.checkLogin()
    if (util.isLoggedIn()) {
      this.loadProfile()
      this.loadStats()
    }
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({
      isLoggedIn: util.isLoggedIn(),
      userInfo
    })
  },

  loadProfile() {
    api.getUserProfile()
      .then(data => {
        if (data.user) {
          app.setLogin(wx.getStorageSync('token'), data.user)
          this.setData({ userInfo: data.user })
        }
      })
      .catch(() => {})
  },

  loadStats() {
    api.getConsultations({ page: 1, status: '' })
      .then(data => {
        const cons = data.consultations || []
        const active = cons.filter(c => c.status === 'active').length
        const pending = cons.filter(c => c.status === 'pending').length
        this.setData({
          'stats.consultations': data.total || cons.length,
          'stats.active': active + pending
        })
      })
      .catch(() => {})
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goConsultations() {
    wx.switchTab({ url: '/pages/consult/consult' })
  },

  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' })
  },

  /** 退出登录 */
  logout() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          app.clearLogin()
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            stats: { consultations: 0, active: 0 }
          })
          util.showSuccess('已退出')
        }
      }
    })
  },

  /** 关于 */
  showAbout() {
    wx.showModal({
      title: '关于演算法律',
      content: '演算法律致力于为用户提供专业、高效的法律咨询服务。由资深律师团队运营，覆盖民商事、刑事、知识产权等多个法律领域。',
      showCancel: false
    })
  }
})
