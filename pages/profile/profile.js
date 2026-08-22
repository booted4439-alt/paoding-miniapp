/**
 * 个人中心
 */
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()
const bgThemes = require('../../utils/bg-themes')

/** 生成 background-image 样式字符串 */
function makeBgStyle(themeName) {
  return 'background-image: url(\'' + bgThemes.getBgSrc(themeName) + '\')'
}

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    stats: {
      consultations: 0,
      active: 0
    },
    // 风景背景
    bgStyle: '',
    currentTheme: 'sunset',
    currentThemeName: '日落霞光',
    themeList: [],
    themePickerOpen: false
  },

  onLoad() {
    // 加载主题列表
    const colorMap = {
      sunset: 'linear-gradient(135deg,#f5af19,#f12711)',
      sunrise: 'linear-gradient(135deg,#f093fb,#f5576c)',
      aurora: 'linear-gradient(135deg,#0c3483,#a2ffb5)',
      mist: 'linear-gradient(135deg,#667eea,#b8cbb8)',
      night: 'linear-gradient(135deg,#0f0c29,#302b63)',
      dawn: 'linear-gradient(135deg,#fdfbfb,#667eea)',
      spring: 'linear-gradient(135deg,#43e97b,#38f9d7)',
      winter: 'linear-gradient(135deg,#a8edea,#fed6e3)'
    }
    const list = bgThemes.getThemeList().map(item => ({
      ...item,
      color: colorMap[item.key] || '#667eea'
    }))
    this.setData({ themeList: list })
  },

  onShow() {
    this.checkLogin()
    this.loadBgTheme()
    if (util.isLoggedIn()) {
      this.loadProfile()
      this.loadStats()
    }
  },

  /**
   * 加载风景背景主题
   */
  loadBgTheme() {
    const saved = bgThemes.getSavedTheme()
    const list = this.data.themeList
    const item = list.find(t => t.key === saved)
    this.setData({
      currentTheme: saved,
      currentThemeName: item ? item.name : '极光之巅',
      bgStyle: makeBgStyle(saved)
    })
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
  },

  /** 展开/收起主题选择器 */
  toggleThemePicker() {
    this.setData({
      themePickerOpen: !this.data.themePickerOpen
    })
  },

  /** 选择主题 */
  selectTheme(e) {
    const key = e.currentTarget.dataset.theme
    const list = this.data.themeList
    const item = list.find(t => t.key === key)
    if (!item) return

    bgThemes.saveTheme(key)
    this.setData({
      currentTheme: key,
      currentThemeName: item.name,
      bgStyle: makeBgStyle(key),
      themePickerOpen: false
    })
  }
})
