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
    submitting: false
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
    this._countdownTimer = timer
  },

  /** 微信一键登录 */
  wechatLogin() {
    wx.showLoading({ title: '登录中...', mask: true })
    wx.login({
      success: res => {
        if (res.code) {
          api.wechatLogin(res.code)
            .then(data => {
              wx.hideLoading()
              if (data.token) {
                app.setLogin(data.token, data.user || {})
                util.showSuccess('登录成功')
                setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1000)
              }
            })
            .catch(err => {
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

  /** 提交登录 */
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
    util.showLoading('登录中...')

    if (loginMode === 'password') {
      api.login(phone, password)
        .then(data => {
          wx.hideLoading()
          if (data.token) {
            app.setLogin(data.token, data.user || {})
            util.showSuccess('登录成功')
            setTimeout(() => goBack(), 1000)
          }
        })
        .catch(err => {
          wx.hideLoading()
          this.setData({ submitting: false })
          util.showError(err.message || '登录失败')
        })
    } else {
      api.verifySmsCode(phone, smsCode)
        .then(() => api.login(phone, smsCode))
        .then(data => {
          wx.hideLoading()
          if (data.token) {
            app.setLogin(data.token, data.user || {})
            util.showSuccess('登录成功')
            setTimeout(() => goBack(), 1000)
          }
        })
        .catch(err => {
          wx.hideLoading()
          this.setData({ submitting: false })
          util.showError(err.message || '登录失败')
        })
    }

    function goBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  onUnload() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
    }
  }
})
