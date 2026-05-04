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
    newTitle: '',
    newContent: '',
    submitting: false
  },

  onLoad() {
    if (!util.checkLogin()) return
    this.loadConsultations()
  },

  onShow() {
    if (!util.isLoggedIn()) return
    // 回到页面时刷新列表
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
    this.setData({
      showCreateModal: true,
      newTitle: '',
      newContent: ''
    })
  },

  closeCreate() {
    this.setData({ showCreateModal: false })
  },

  onTitleInput(e) { this.setData({ newTitle: e.detail.value }) },
  onContentInput(e) { this.setData({ newContent: e.detail.value }) },

  /** 提交新咨询 */
  submitConsultation() {
    if (this.data.submitting) return
    const { newTitle, newContent } = this.data
    if (!newContent.trim()) {
      util.showError('请输入咨询内容')
      return
    }

    this.setData({ submitting: true })
    util.showLoading('提交中...')

    api.createConsultation(
      newTitle.trim() || newContent.trim().slice(0, 50),
      newContent.trim()
    )
      .then(data => {
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
      })
      .catch(err => {
        wx.hideLoading()
        this.setData({ submitting: false })
        util.showError(err.message || '提交失败')
      })
  },

  /** 进入咨询详情 */
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/consult-detail/consult-detail?id=${id}` })
  },

  /** 获取状态显示文本 */
  getStatusText(status) {
    const map = { pending: '待处理', active: '进行中', closed: '已结束' }
    return map[status] || status
  },

  stopPropagation() {}
})
