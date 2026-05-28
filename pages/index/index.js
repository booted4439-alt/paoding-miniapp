/**
 * 首页逻辑
 */
const api = require('../../utils/api')
const util = require('../../utils/util')
const bgThemes = require('../../utils/bg-themes')

Page({
  data: {
    siteName: '演算法律',
    sitePhone: '021-6888-8888',
    siteAddress: '上海市浦东新区陆家嘴环路1000号',
    news: [],
    isLoggedIn: false,
    // 风景背景
    bgStyle: ''
  },

  onLoad() {
    this.checkLoginStatus()
    // 静默加载，失败不影响首页显示
    this.loadSiteInfo()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadBgTheme()
  },

  /** 加载风景背景（跟随「我的」页面选择的主题） */
  loadBgTheme() {
    const saved = bgThemes.getSavedTheme()
    this.setData({
      bgStyle: 'background-image: url(\'' + bgThemes.getBgSrc(saved) + '\')'
    })
  },

  checkLoginStatus() {
    if (util.isLoggedIn()) {
      // 验证 token 是否有效
      api.getUserProfile()
        .then(() => {
          this.setData({ isLoggedIn: true })
        })
        .catch(() => {
          // token 无效，清除登录状态
          getApp().clearLogin()
          this.setData({ isLoggedIn: false })
        })
    } else {
      this.setData({ isLoggedIn: false })
    }
  },

  /** 加载站点信息（超时短，失败容忍） */
  loadSiteInfo() {
    const timer = setTimeout(() => {
      // 3秒无响应就放弃，使用默认值
      console.warn('加载站点信息超时，使用默认值')
    }, 3000)

    api.getSiteSettings()
      .then(data => {
        clearTimeout(timer)
        const settings = {}
        if (data.site_name) settings.siteName = data.site_name
        if (data.phone) settings.sitePhone = data.phone
        if (data.address) settings.siteAddress = data.address
        this.setData(settings)
      })
      .catch(() => {
        clearTimeout(timer)
        // 使用默认值
      })
  },

  goConsult() {
    if (util.checkLogin()) {
      wx.switchTab({ url: '/pages/consult/consult' })
    }
  },


  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
