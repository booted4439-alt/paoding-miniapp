/**
 * 文档详情 - 使用后端返回的 HTML 渲染内容
 */
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    document: null,
    loading: true,
    // rendered HTML content for rich-text
    renderedHtml: '',
    nodes: []
  },

  onLoad(options) {
    const id = parseInt(options.id)
    if (!id) {
      util.showError('参数错误')
      wx.navigateBack()
      return
    }
    this.loadDocument(id)
  },

  loadDocument(id) {
    util.showLoading()
    api.getDocumentDetail(id)
      .then(data => {
        wx.setNavigationBarTitle({ title: data.title || '文档详情' })

        // 使用后端返回的 rendered HTML
        let html = data.rendered || ''

        // 处理无 rendered 时的降级（简单换行）
        if (!html && data.content) {
          html = data.content.replace(/\n/g, '<br/>')
        }

        // 移除可能存在的外层 <p> 包裹以控制样式
        // 设置到 nodes 供 rich-text 使用
        this.setData({
          document: data,
          renderedHtml: html,
          loading: false
        })
        wx.hideLoading()
      })
      .catch(err => {
        wx.hideLoading()
        util.showError(err.message || '加载失败')
        this.setData({ loading: false })
      })
  },

  /** 复制链接 */
  copyLink() {
    wx.setClipboardData({
      data: `${api.API_BASE}/api/documents/${this.data.document.id}`,
      success: () => util.showSuccess('已复制链接')
    })
  }
})
