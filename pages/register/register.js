/**
 * 注册页面
 */
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    smsCode: '',
    codeBtnText: '获取验证码',
    codeBtnDisabled: false,
    countdown: 0,
    submitting: false,
    agreeTerms: true
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onConfirmInput(e) { this.setData({ confirmPassword: e.detail.value }) },
  onSmsCodeInput(e) { this.setData({ smsCode: e.detail.value }) },
  toggleAgree() { this.setData({ agreeTerms: !this.data.agreeTerms }) },

  /** 发送验证码 */
  sendCode() {
    if (this.data.codeBtnDisabled) return
    if (!util.isValidPhone(this.data.phone)) {
      util.showError('请输入正确的手机号码')
      return
    }

    this.setData({ codeBtnDisabled: true })
    api.sendSmsCode(this.data.phone)
      .then(() => {
        util.showSuccess('验证码已发送')
        this.startCountdown()
      })
      .catch(err => {
        this.setData({ codeBtnDisabled: false })
        util.showError(err.message || '发送失败')
      })
  },

  startCountdown() {
    this.setData({ countdown: 60, codeBtnText: '60s' })
    const timer = setInterval(() => {
      let c = this.data.countdown - 1
      if (c <= 0) {
        clearInterval(timer)
        this.setData({ countdown: 0, codeBtnText: '重新获取', codeBtnDisabled: false })
      } else {
        this.setData({ countdown: c, codeBtnText: `${c}s` })
      }
    }, 1000)
    this._timer = timer
  },

  /** 提交注册 */
  submitRegister() {
    if (this.data.submitting) return
    const { username, phone, password, confirmPassword, smsCode, agreeTerms } = this.data

    if (!username.trim()) { util.showError('请输入用户名'); return }
    if (!util.isValidPhone(phone)) { util.showError('请输入正确的手机号码'); return }
    if (!smsCode) { util.showError('请输入验证码'); return }
    if (!password) { util.showError('请输入密码'); return }
    if (password.length < 6) { util.showError('密码至少6位'); return }
    if (password !== confirmPassword) { util.showError('两次密码不一致'); return }
    if (!agreeTerms) { util.showError('请同意用户协议'); return }

    this.setData({ submitting: true })
    util.showLoading('注册中...')

    api.register({ username, phone, password, sms_code: smsCode })
      .then(data => {
        wx.hideLoading()
        if (data.token) {
          app.setLogin(data.token, data.user || {})
          util.showSuccess('注册成功')
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' })
          }, 1000)
        }
      })
      .catch(err => {
        wx.hideLoading()
        this.setData({ submitting: false })
        util.showError(err.message || '注册失败')
      })
  },

  goLogin() {
    wx.navigateBack()
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  }
})
