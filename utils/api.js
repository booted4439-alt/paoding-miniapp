/**
 * 庖丁法律服务 - API 封装
 * 统一管理所有后端接口调用
 */

const API_BASE = 'https://www.paodinglaw.com'

/**
 * 通用请求封装
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    wx.request({
      url: `${API_BASE}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: options.timeout || 10000,
      success(res) {
        if (res.statusCode === 401) {
          // Token 过期，提示但不强制跳转
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          reject(new Error('登录已过期，请重新登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.error || res.data?.message || '请求失败'))
        }
      },
      fail(err) {
        console.error('请求异常:', err)
        reject(new Error('网络异常，请检查网络连接'))
      }
    })
  })
}

/**
 * 微信小程序登录（后端交换 code → openid → 返回 token）
 * POST /api/wechat/login
 * @param {string} code - wx.login() 获取的 code
 * @param {string} [nickname] - 微信昵称（可选），用于首次创建用户时作为用户名
 */
function wechatLogin(code, nickname) {
  const data = { code }
  if (nickname) {
    data.nickname = nickname
  }
  return request('/api/wechat/login', {
    method: 'POST',
    data
  })
}

/**
 * 绑定手机号到微信账号
 * POST /api/wechat/bind-phone
 */
function bindPhone(encryptedData, iv) {
  return request('/api/wechat/bind-phone', {
    method: 'POST',
    data: { encryptedData, iv }
  })
}

/**
 * 手动绑定手机号（开发模式用）
 * POST /api/wechat/bind-phone   dev 模式直接传 phone
 */
function bindPhoneDirect(phone) {
  return request('/api/wechat/bind-phone', {
    method: 'POST',
    data: { phone }
  })
}

/**
 * 绑定手机号（短信验证码 + 可选邮箱）
 * POST /api/wechat/bind-phone
 */
function bindPhoneWithSms(phone, smsCode, email) {
  const data = { phone, sms_code: smsCode }
  if (email) {
    data.email = email
  }
  return request('/api/wechat/bind-phone', {
    method: 'POST',
    data
  })
}

/**
 * 发送短信验证码
 */
function sendSmsCode(phone) {
  return request('/api/sms/send', {
    method: 'POST',
    data: { phone }
  })
}

/**
 * 核验短信验证码
 */
function verifySmsCode(phone, code) {
  return request('/api/sms/verify', {
    method: 'POST',
    data: { phone, code }
  })
}

/**
 * 账号密码登录
 */
function login(phone, password) {
  return request('/api/miniapp/login', {
    method: 'POST',
    data: { phone, password }
  })
}

/**
 * 用户注册
 */
function register(data) {
  return request('/api/miniapp/register', {
    method: 'POST',
    data
  })
}

/**
 * 获取用户信息
 */
function getUserProfile() {
  return request('/api/user/profile')
}

/**
 * 更新用户信息
 */
function updateUserProfile(data) {
  return request('/api/user/profile', {
    method: 'PUT',
    data
  })
}

// ======== 法律咨询 ========

/**
 * 获取咨询列表
 */
function getConsultations(params = {}) {
  return request('/api/consultations?' + objToParams(params))
}

/**
 * 创建咨询
 */
function createConsultation(title, description) {
  return request('/api/consultations', {
    method: 'POST',
    data: { title, description }
  })
}

/**
 * 创建咨询（含文件上传）
 */
function createConsultationWithFiles(title, content, files) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    wx.uploadFile({
      url: `${API_BASE}/api/consultations/with-message`,
      filePath: files[0].path,
      name: 'file',
      formData: { title, content },
      header: { 'Authorization': `Bearer ${token}` },
      success(res) {
        try { resolve(JSON.parse(res.data)) }
        catch { resolve(res.data) }
      },
      fail: reject
    })
  })
}

/**
 * 发送消息（含文件上传）
 */
function sendMessage(consultationId, content, filePaths = []) {
  if (filePaths.length > 0) {
    return uploadFiles(consultationId, content, filePaths)
  }
  return request(`/api/consultations/${consultationId}/messages`, {
    method: 'POST',
    data: { content },
    header: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

/**
 * 带文件上传的消息发送
 */
function uploadFiles(consultationId, content, filePaths) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    wx.uploadFile({
      url: `${API_BASE}/api/consultations/${consultationId}/messages`,
      filePath: filePaths[0],
      name: 'file',
      formData: { content },
      header: { 'Authorization': `Bearer ${token}` },
      success(res) {
        try {
          resolve(JSON.parse(res.data))
        } catch {
          resolve(res.data)
        }
      },
      fail: reject
    })
  })
}

/**
 * 获取单个咨询详情
 */
function getConsultation(id) {
  return request(`/api/consultations/${id}`)
}

/**
 * 获取咨询消息列表
 */
function getMessages(consultationId) {
  return request(`/api/consultations/${consultationId}/messages`)
}

/**
 * 关闭咨询
 */
function closeConsultation(consultationId) {
  return request(`/api/consultations/${consultationId}/close`, {
    method: 'POST'
  })
}

/**
 * 删除咨询
 */
function deleteConsultation(consultationId) {
  return request(`/api/consultations/${consultationId}`, {
    method: 'DELETE'
  })
}

// ======== 法律文档 ========

/**
 * 获取文档列表
 */
function getDocuments(params = {}) {
  return request('/api/documents?' + objToParams(params))
}

/**
 * 获取文档详情
 */
function getDocumentDetail(docId) {
  return request(`/api/documents/${docId}`)
}

// ======== 联系信息 ========

/**
 * 获取站点设置
 */
function getSiteSettings() {
  return request('/api/site/settings')
}

// ======== 辅助函数 ========

function objToParams(obj) {
  const parts = []
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
  }
  return parts.join('&')
}

module.exports = {
  wechatLogin,
  bindPhone,
  bindPhoneDirect,
  bindPhoneWithSms,
  sendSmsCode,
  verifySmsCode,
  login,
  register,
  getUserProfile,
  updateUserProfile,
  getConsultations,
  getConsultation,
  createConsultation,
  createConsultationWithFiles,
  sendMessage,
  getMessages,
  closeConsultation,
  deleteConsultation,
  getDocuments,
  getDocumentDetail,
  getSiteSettings,
  API_BASE
}
