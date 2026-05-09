/**
 * 咨询列表页
 */
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    consultations: [],
    loading: false,
    page: 1,
    hasMore: true,
    showCreateModal: false,
    newContent: '',
    newFiles: [],
    submitting: false
  },

  /** 检查是否有手机号，没有则跳绑定 */
  _checkPhone(callback) {
    const app = getApp()
    const user = app.globalData.userInfo || {}
    if (!user.phone) {
      wx.showModal({
        title: '提示',
        content: '请先绑定手机号，绑定后才能发起咨询',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login?forceBind=1' })
          }
        }
      })
      return false
    }
    return true
  },

  onLoad() {
    if (!util.checkLogin()) return
    this.loadConsultations()
  },

  onShow() {
    if (!util.isLoggedIn()) return
    this.setData({ page: 1, hasMore: true })
    this.loadConsultations()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, consultations: [] })
    this.loadConsultations().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadConsultations()
    }
  },

  loadConsultations() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })
    return api.getConsultations({ page: this.data.page })
      .then(data => {
        const list = data.consultations || []
        this.setData({
          consultations: this.data.page === 1 ? list : [...this.data.consultations, ...list],
          page: this.data.page + 1,
          hasMore: list.length >= 20,
          loading: false
        })
      })
      .catch(err => {
        this.setData({ loading: false })
        console.error(err)
      })
  },

  /** 打开发起咨询弹窗 */
  openCreate() {
    if (!util.checkLogin()) return
    if (!this._checkPhone()) return

    const app = getApp()

    // 从服务器刷新余额，避免使用缓存数据
    api.getUserProfile().then(data => {
      if (data.user) {
        app.setLogin(wx.getStorageSync('token'), data.user)
      }
      this._checkBalance()
    }).catch(() => {
      this._checkBalance()
    })
  },

  /** 检查余额是否 >= 100元 */
  _checkBalance() {
    const app = getApp()
    const balance = app.globalData.userInfo?.balance || 0
    if (balance < 10000) {
      wx.showModal({
        title: '余额不足',
        content: '发起咨询需要余额不低于100元，当前余额' + (balance/100).toFixed(2) + '元。请先到网页版充值。',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/profile/profile' })
          }
        }
      })
      return
    }
    this.setData({
      showCreateModal: true,
      newContent: '',
      newFiles: []
    })
  },
  closeCreate() {
    this.setData({ showCreateModal: false })
  },

  onContentInput(e) { this.setData({ newContent: e.detail.value }) },

  /** 选择图片 */
  chooseImage() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      success: res => {
        this.setData({ newFiles: res.tempFiles })
      }
    })
  },

  /** 选择附件 */
  chooseFiles() {
    wx.chooseMessageFile({
      count: 9,
      type: 'all',
      success: res => {
        this.setData({ newFiles: res.tempFiles })
      }
    })
  },

  /** 提交新咨询 */
  submitConsultation() {
    if (this.data.submitting) return
    const { newContent, newFiles } = this.data
    if (!newContent.trim() && newFiles.length === 0) {
      util.showError('请输入咨询内容或选择附件')
      return
    }

    this.setData({ submitting: true })
    util.showLoading('提交中...')

    // 有附件就走 with-message 接口（含文件上传）
    const title = newContent.trim().slice(0, 50) || '法律咨询'

    if (newFiles.length > 0) {
      api.createConsultationWithFiles(title, newContent.trim(), newFiles)
        .then(() => {
          this._afterSubmit()
        })
        .catch(err => {
          wx.hideLoading()
          this.setData({ submitting: false })
          util.showError(err.message || '提交失败')
        })
    } else {
      api.createConsultation(title, newContent.trim())
        .then(() => {
          this._afterSubmit()
        })
        .catch(err => {
          wx.hideLoading()
          this.setData({ submitting: false })
          util.showError(err.message || '提交失败')
        })
    }
  },

  _afterSubmit() {
    wx.hideLoading()
    util.showSuccess('咨询已提交')
    this.setData({
      showCreateModal: false,
      submitting: false,
      page: 1,
      hasMore: true,
      consultations: []
    })
    this.loadConsultations()
  },

  /** 进入咨询详情 */
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/consult-detail/consult-detail?id=${id}` })
  },

  /** 获取状态显示文本 */
  getStatusText(status) {
    const map = { pending: '待处理', active: '进行中', completed: '已完成', closed: '已结束' }
    return map[status] || status
  },

  stopPropagation() {}
})
