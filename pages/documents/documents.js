/**
 * 法律文档列表
 */
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    documents: [],
    categories: [],
    searchKeyword: '',
    activeCategory: '',
    loading: false
  },

  onLoad() {
    this.loadDocuments()
  },

  onPullDownRefresh() {
    this.loadDocuments().then(() => wx.stopPullDownRefresh())
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  /** 搜索 */
  search() {
    this.loadDocuments()
  },

  /** 按分类筛选 */
  filterByCategory(e) {
    const cat = e.currentTarget.dataset.category
    this.setData({
      activeCategory: this.data.activeCategory === cat ? '' : cat
    })
    this.loadDocuments()
  },

  loadDocuments() {
    this.setData({ loading: true })
    const params = {}
    if (this.data.searchKeyword.trim()) {
      params.q = this.data.searchKeyword.trim()
    }
    if (this.data.activeCategory) {
      params.category = this.data.activeCategory
    }

    return api.getDocuments(params)
      .then(data => {
        // 提取分类
        const cats = [...new Set(data.map(d => d.category).filter(Boolean))]
        this.setData({
          documents: data,
          categories: cats,
          loading: false
        })
      })
      .catch(err => {
        this.setData({ loading: false })
        console.error(err)
      })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/document-detail/document-detail?id=${id}` })
  }
})
