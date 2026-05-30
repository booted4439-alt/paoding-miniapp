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
    email: '',
    codeBtnText: '获取验证码',
    codeBtnDisabled: false,
    countdown: 0,
    submitting: false,
    agreeTerms: false
  },

  toggleAgree() {
    this.setData({ agreeTerms: !this.data.agreeTerms })
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onConfirmInput(e) { this.setData({ confirmPassword: e.detail.value }) },

  onSmsCodeInput(e) { this.setData({ smsCode: e.detail.value }) },
  onEmailInput(e) { this.setData({ email: e.detail.value }) },
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
    const { username, phone, password, confirmPassword, smsCode, email, agreeTerms } = this.data

    if (!agreeTerms) { util.showError('请先阅读并同意用户协议和隐私政策'); return }
    if (!username.trim()) { util.showError('请输入用户名'); return }
    if (!util.isValidPhone(phone)) { util.showError('请输入正确的手机号码'); return }
    if (!smsCode) { util.showError('请输入验证码'); return }
    if (!password) { util.showError('请输入密码'); return }
    if (password.length < 6) { util.showError('密码至少6位'); return }
    if (password !== confirmPassword) { util.showError('两次密码不一致'); return }
    // 密码：只能字母和数字
    for (var _i = 0; _i < password.length; _i++) {
      var _ch = password.charAt(_i);
      if (!((_ch >= 'a' && _ch <= 'z') || (_ch >= 'A' && _ch <= 'Z') || (_ch >= '0' && _ch <= '9'))) {
        util.showError('密码只能包含字母和数字');
        return;
      }
    }
    this.setData({ submitting: true })
    util.showLoading('注册中...')

    const regData = { username, phone, password, sms_code: smsCode }
    if (email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        wx.hideLoading()
        this.setData({ submitting: false })
        util.showError('邮箱格式不正确')
        return
      }
      regData.email = email.trim()
    }

    api.register(regData)
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

  /** 打开外部链接 */
  openUrl(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url: '/pages/webview/webview?url=' + encodeURIComponent(url) })
  },

  goLogin() {
    wx.navigateBack()
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  }
})
