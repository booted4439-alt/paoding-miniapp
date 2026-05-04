/**
 * 工具函数
 */

/**
 * 显示 loading 提示
 */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

/**
 * 隐藏 loading
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示成功提示
 */
function showSuccess(title, duration = 1500) {
  wx.showToast({ title, icon: 'success', duration })
}

/**
 * 显示错误提示
 */
function showError(title) {
  wx.showToast({ title, icon: 'none', duration: 2000 })
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

/**
 * 格式化日期（仅日期）
 */
function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  if (y === now.getFullYear() && m === String(now.getMonth() + 1).padStart(2, '0') &&
      day === String(now.getDate()).padStart(2, '0')) {
    // 今天
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${min}`
  }
  return `${m}-${day}`
}

/**
 * 判断用户是否已登录
 */
function isLoggedIn() {
  return !!wx.getStorageSync('token')
}

/**
 * 检查登录，未登录则跳转
 */
function checkLogin() {
  if (!isLoggedIn()) {
    wx.navigateTo({ url: '/pages/login/login' })
    return false
  }
  return true
}

/**
 * 校验手机号
 */
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 防抖
 */
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

module.exports = {
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  formatDate,
  formatDateShort,
  isLoggedIn,
  checkLogin,
  isValidPhone,
  debounce
}
