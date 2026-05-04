/**
 * 自定义底部标签栏
 * 支持字体加粗、更精细的样式控制
 */
Component({
  data: {
    selected: 0,
    list: [{
      pagePath: '/pages/index/index',
      text: '首页',
      iconPath: '/images/tab_home.png',
      selectedIconPath: '/images/tab_home_active.png'
    }, {
      pagePath: '/pages/consult/consult',
      text: '咨询',
      iconPath: '/images/tab_consult.png',
      selectedIconPath: '/images/tab_consult_active.png'
    }, {
      pagePath: '/pages/documents/documents',
      text: '知识',
      iconPath: '/images/tab_doc.png',
      selectedIconPath: '/images/tab_doc_active.png'
    }, {
      pagePath: '/pages/profile/profile',
      text: '我的',
      iconPath: '/images/tab_me.png',
      selectedIconPath: '/images/tab_me_active.png'
    }]
  },

  lifetimes: {
    attached() {
      this.updateSelected()
    }
  },

  pageLifetimes: {
    show() {
      this.updateSelected()
    }
  },

  methods: {
    updateSelected() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      if (current) {
        const path = '/' + current.route
        const idx = this.data.list.findIndex(item => item.pagePath === path)
        if (idx !== -1) {
          this.setData({ selected: idx })
        }
      }
    },

    switchTab(e) {
      const idx = e.currentTarget.dataset.index
      const url = this.data.list[idx].pagePath
      wx.switchTab({ url })
    }
  }
})
