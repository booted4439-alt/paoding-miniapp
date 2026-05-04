/**
 * 联系我们
 */
const api = require('../../utils/api')

Page({
  data: {
    phone: '021-6888-8888',
    address: '上海市浦东新区陆家嘴环路1000号',
    workHours: '周一至周五 9:00 - 18:00',
    email: 'contact@paodinglaw.com',
    wechatQr: ''
  },

  onLoad() {
    this.setData({ API_BASE: api.API_BASE })
    this.loadSettings()
  },

  loadSettings() {
    api.getSiteSettings()
      .then(data => {
        this.setData({
          phone: data.phone || this.data.phone,
          address: data.address || this.data.address,
          email: data.email || this.data.email,
          wechatQr: data.wechat_qr || ''
        })
      })
      .catch(() => {})
  },

  /** 拨打电话 */
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.phone.replace(/-/g, '')
    })
  },

  /** 复制信息 */
  copyInfo(e) {
    const type = e.currentTarget.dataset.type
    const map = { phone: this.data.phone, email: this.data.email, address: this.data.address }
    wx.setClipboardData({
      data: map[type] || '',
      success: () => {
        const nameMap = { phone: '电话', email: '邮箱', address: '地址' }
        wx.showToast({ title: `${nameMap[type]}已复制`, icon: 'success' })
      }
    })
  },

  /** 打开地图 */
  openMap() {
    wx.openLocation({
      latitude: 31.2390,
      longitude: 121.5032,
      name: '庖丁法律服务',
      address: this.data.address
    })
  },

  /** 预览微信二维码 */
  previewWechat() {
    if (this.data.wechatQr) {
      wx.previewImage({
        urls: [api.API_BASE + this.data.wechatQr]
      })
    }
  }
})
