/**
 * 登录页面
 */
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    phone: '',
    password: '',
    smsCode: '',
    loginMode: 'password', // 'password' | 'sms'
    codeBtnText: '获取验证码',
    codeBtnDisabled: false,
    countdown: 0,
    submitting: false,

    // 微信登录 → 绑定手机号 + 邮箱
    showBindPhone: false,
    bindPhoneNum: '',
    bindSmsCode: '',
    bindEmail: '',
    bindCodeBtnText: '获取验证码',
    bindCodeBtnDisabled: false,
    bindCountdown: 0,
    isDevMode: false
  },

  /** 切换登录方式 */
  switchMode() {
    this.setData({
      loginMode: this.data.loginMode === 'password' ? 'sms' : 'password',
      smsCode: '',
      codeBtnText: '获取验证码',
      codeBtnDisabled: false
    })
  },

  /** 输入事件 */
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onSmsCodeInput(e) { this.setData({ smsCode: e.detail.value }) },
  onBindPhoneInput(e) { this.setData({ bindPhoneNum: e.detail.value }) },
  onBindSmsCodeInput(e) { this.setData({ bindSmsCode: e.detail.value }) },
  onBindEmailInput(e) { this.setData({ bindEmail: e.detail.value }) },

  /** ---- 登录页验证码 ---- */
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
        this._startCountdown('countdown', 'codeBtnText', 'codeBtnDisabled')
      })
      .catch(err => {
        this.setData({ codeBtnDisabled: false })
        util.showError(err.message || '发送失败')
      })
  },

  /** ---- 绑定页验证码 ---- */
  sendBindCode() {
    if (this.data.bindCodeBtnDisabled) return
    if (!util.isValidPhone(this.data.bindPhoneNum)) {
      util.showError('请输入正确的手机号码')
      return
    }
    this.setData({ bindCodeBtnDisabled: true })
    api.sendSmsCode(this.data.bindPhoneNum)
      .then(() => {
        util.showSuccess('验证码已发送')
        this._startCountdown('bindCountdown', 'bindCodeBtnText', 'bindCodeBtnDisabled')
      })
      .catch(err => {
        this.setData({ bindCodeBtnDisabled: false })
        util.showError(err.message || '发送失败')
      })
  },

  /** 倒计时 */
  _startCountdown(countField, textField, disabledField) {
    this.setData({ [countField]: 60, [textField]: '60s' })
    const timer = setInterval(() => {
      let c = this.data[countField] - 1
      if (c <= 0) {
        clearInterval(timer)
        this.setData({ [countField]: 0, [textField]: '重新获取', [disabledField]: false })
      } else {
        this.setData({ [countField]: c, [textField]: `${c}s` })
      }
    }, 1000)
    this[`_${countField}Timer`] = timer
  },

  /** 微信一键登录 */
  wechatLogin() {
    wx.showLoading({ title: '登录中...', mask: true })
    wx.login({
      success: res => {
        if (res.code) {
          api.wechatLogin(res.code).then(data => {
            wx.hideLoading()
            if (data.token) {
              if (data.needs_bind) {
                getApp().setLogin(data.token, data.user || {})
                this.setData({
                  showBindPhone: true,
                  isDevMode: !!data.dev_mode
                })
              } else {
                this.completeLogin(data.token, data.user)
              }
            }
          }).catch(err => {
            wx.hideLoading()
            util.showError(err.message || '微信登录失败')
          })
        } else {
          wx.hideLoading()
          util.showError('微信登录失败')
        }
      },
      fail: () => {
        wx.hideLoading()
        util.showError('获取微信授权失败')
      }
    })
  },

  /** 提交绑定手机号 + 邮箱 */
  submitBindPhone() {
    if (this.data.submitting) return
    const phone = this.data.bindPhoneNum.trim()
    const smsCode = this.data.bindSmsCode.trim()
    const email = this.data.bindEmail.trim()

    if (!util.isValidPhone(phone)) {
      util.showError('请输入正确的手机号码')
      return
    }
    if (!smsCode) {
      util.showError('请输入短信验证码')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      util.showError('邮箱格式不正确')
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '绑定中...', mask: true })

    api.bindPhoneWithSms(phone, smsCode, email)
      .then(data => {
        wx.hideLoading()
        this.setData({ submitting: false })
        if (data.ok) {
          util.showSuccess('绑定成功')
          this.completeBindLogin(data.user)
        } else {
          util.showError(data.error || '绑定失败')
        }
      })
      .catch(err => {
        wx.hideLoading()
        this.setData({ submitting: false })
        util.showError(err.message || '绑定失败')
      })
  },

  /** 完成登录后跳转 */
  completeLogin(token, user) {
    app.setLogin(token, user || {})
    util.showSuccess('登录成功')
    setTimeout(() => this._goBack(), 800)
  },

  completeBindLogin(user) {
    const token = wx.getStorageSync('token')
    app.setLogin(token, user || {})
    util.showSuccess('登录成功')
    setTimeout(() => this._goBack(), 800)
  },

  _goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  /** 手机号+密码/验证码登录 */
  submitLogin() {
    if (this.data.submitting) return
    const { phone, password, smsCode, loginMode } = this.data

    if (!util.isValidPhone(phone)) {
      util.showError('请输入正确的手机号码')
      return
    }
    if (loginMode === 'password' && !password) {
      util.showError('请输入密码')
      return
    }
    if (loginMode === 'sms' && !smsCode) {
      util.showError('请输入验证码')
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '登录中...', mask: true })

    const doLogin = () => {
      const pwd = loginMode === 'sms' ? smsCode : password
      api.login(phone, pwd)
        .then(data => {
          wx.hideLoading()
          this.setData({ submitting: false })
          if (data.token) {
            app.setLogin(data.token, data.user || {})
            util.showSuccess('登录成功')
            this._goBack()
          }
        })
        .catch(err => {
          wx.hideLoading()
          this.setData({ submitting: false })
          util.showError(err.message || '登录失败')
        })
    }

    if (loginMode === 'sms') {
      api.verifySmsCode(phone, smsCode)
        .then(() => doLogin())
        .catch(err => {
          wx.hideLoading()
          this.setData({ submitting: false })
          util.showError(err.message || '验证码错误')
        })
    } else {
      doLogin()
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  onUnload() {
    ;['_countdownTimer', '_bindCountdownTimer'].forEach(k => {
      if (this[k]) { clearInterval(this[k]) }
    })
  }
})
