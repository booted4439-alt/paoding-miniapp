/**
 * 咨询详情 - 聊天页面
 */
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    consultation: null,
    messages: [],
    inputContent: '',
    consultationId: null,
    loading: true,
    pollingTimer: null,
    // 文件上传
    uploadFiles: []
  },

  onLoad(options) {
    const id = parseInt(options.id)
    if (!id) {
      util.showError('参数错误')
      wx.navigateBack()
      return
    }
    // 检查手机号
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo?.phone) {
      wx.showModal({
        title: '提示',
        content: '请先绑定手机号',
        success: () => {
          wx.navigateTo({ url: '/pages/login/login?forceBind=1' })
        }
      })
      return
    }
    this.setData({ 
      consultationId: id,
      userId: userInfo?.id || 0,
      API_BASE: api.API_BASE 
    })
    this.loadData()
  },

  onUnload() {
    // 停止轮询
    if (this.data.pollingTimer) {
      clearInterval(this.data.pollingTimer)
    }
  },

  loadData() {
    util.showLoading()
    Promise.all([
      this.loadConsultation(),
      this.loadMessages(true)
    ])
      .catch(err => {
        util.showError(err.message || '加载失败')
      })
      .finally(() => {
        wx.hideLoading()
        this.setData({ loading: false })
      })
  },

  /** 获取咨询详情 */
  loadConsultation() {
    return api.getConsultation(this.data.consultationId)
      .then(c => {
        this.setData({ consultation: c })
      })
  },

  loadMessages(initial = false) {
    return api.getMessages(this.data.consultationId)
      .then(msgs => {
        // 给每条消息标记是否为自己发送的（用于样式判断）
    const me = this.data.userId || 0
    const imageTypes = ['jpg', 'png', 'jpeg', 'gif', 'webp']
    const formatted = msgs.map(m => ({
      ...m,
      isMine: String(m.sender_id) === String(me),
      isImage: m.file_url && imageTypes.includes(m.file_type),
      fileUrl: m.file_url ? api.API_BASE + m.file_url : ''
    }))
    this.setData({ messages: formatted })
        if (initial) {
          this.scrollToBottom()
          // 启动轮询
          this.startPolling()
        }
      })
  },

  /** 轮询新消息（替代 WebSocket） */
  startPolling() {
    if (this.data.pollingTimer) clearInterval(this.data.pollingTimer)
    const timer = setInterval(() => {
      if (this.data.loading) return
      api.getMessages(this.data.consultationId)
        .then(msgs => {
          if (msgs.length > this.data.messages.length) {
            const me = this.data.userId || 0
            const imageTypes = ['jpg', 'png', 'jpeg', 'gif', 'webp']
            const formatted = msgs.map(m => ({
              ...m,
              isMine: String(m.sender_id) === String(me),
              isImage: m.file_url && imageTypes.includes(m.file_type),
              fileUrl: m.file_url ? api.API_BASE + m.file_url : ''
            }))
            this.setData({ messages: formatted })
            this.scrollToBottom()
          }
        })
        .catch(() => {})
    }, 5000) // 每5秒轮询
    this.setData({ pollingTimer: timer })
  },

  scrollToBottom() {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select('#msg-end')
        .boundingClientRect(rect => {
          if (rect) {
            wx.pageScrollTo({ scrollTop: rect.top + rect.height, duration: 200 })
          }
        })
        .exec()
    }, 100)
  },

  onInput(e) { this.setData({ inputContent: e.detail.value }) },

  /** 选择文件 */
  chooseFile() {
    wx.chooseMessageFile({
      count: 9,
      type: 'all',
      success: res => {
        this.setData({ uploadFiles: res.tempFiles })
        // 直接发送带附件的消息
        this.sendMessage(true)
      }
    })
  },

  /** 选择图片 */
  chooseImage() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const files = res.tempFilePaths.map(p => ({ path: p, size: 0 }))
        this.setData({ uploadFiles: files })
        this.sendMessage(true)
      }
    })
  },

  /** 发送消息 */
  sendMessage(fromFile = false) {
    const { inputContent, uploadFiles, consultationId } = this.data

    if (!inputContent.trim() && uploadFiles.length === 0) {
      if (!fromFile) util.showError('请输入内容')
      return
    }

    const content = inputContent.trim()
    const filePaths = uploadFiles.map(f => f.path || f)

    // 本地乐观更新
    const tempMsg = {
      id: 'temp_' + Date.now(),
      sender: '我',
      sender_id: 'me',
      content: content || '[文件]',
      file_url: '',
      file_type: '',
      is_system: false,
      created_at: new Date().toISOString()
    }
    this.setData({
      messages: [...this.data.messages, tempMsg],
      inputContent: '',
      uploadFiles: []
    })
    this.scrollToBottom()

    api.sendMessage(consultationId, content, filePaths)
      .then(() => {
        this.loadMessages()
      })
      .catch(err => {
        util.showError(err.message || '发送失败')
      })
  },

  /** 获取状态文本 */
  getStatusText(status) {
    const map = { pending: '待处理', active: '进行中', completed: '已完成', closed: '已结束' }
    return map[status] || status
  },

  /** 预览/打开文件 */
  previewFile(e) {
    const url = e.currentTarget.dataset.url
    const fileType = e.currentTarget.dataset.type || ''
    if (!url) return

    // URL 可能是相对路径（/uploads/...）也可能是完整路径
    const fullUrl = url.startsWith('http') ? url : api.API_BASE + url

    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
    if (imageTypes.includes(fileType)) {
      wx.previewImage({ urls: [fullUrl] })
    } else {
      wx.downloadFile({
        url: fullUrl,
        success: res => {
          if (res.statusCode === 200) {
            wx.openDocument({
              filePath: res.tempFilePath,
              fileType: fileType,
              showMenu: true
            })
          }
        },
        fail: err => {
          console.error('downloadFile fail', err)
          wx.showModal({
            title: '打开失败',
            content: '请在微信后台「开发→开发设置→服务器域名」中添加 https://www.paodinglaw.com 到 downloadFile 白名单',
            showCancel: false
          })
        }
      })
    }
  }
})
