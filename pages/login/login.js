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
    submitting: false,

    // 微信登录 → 绑定手机号 + 密码 + 邮箱
    showBindPhone: false,
    bindPhoneNum: '',
    bindPassword: '',
    bindConfirmPassword: '',
    bindEmail: '',
    isDevMode: false,
    agreeWechat: false,
    agreeBind: false
  },

  toggleAgreeWechat() {
    this.setData({ agreeWechat: !this.data.agreeWechat })
  },
  toggleAgreeBind() {
    this.setData({ agreeBind: !this.data.agreeBind })
  },

  /** 输入事件 */
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onBindPhoneInput(e) { this.setData({ bindPhoneNum: e.detail.value }) },
  onBindPasswordInput(e) { this.setData({ bindPassword: e.detail.value }) },
  onBindConfirmPasswordInput(e) { this.setData({ bindConfirmPassword: e.detail.value }) },
  onBindEmailInput(e) { this.setData({ bindEmail: e.detail.value }) },

  /** 如果从其他页面跳过来要求强制绑定 */
  onLoad(options) {
    if (options && options.forceBind) {
      // 已有 token 但没手机号，直接进入绑定页
      wx.login({
        success: res => {
          if (res.code) {
            api.wechatLogin(res.code).then(data => {
              if (data.token) {
                getApp().setLogin(data.token, data.user || {})
                this.setData({ showBindPhone: true, isDevMode: !!data.dev_mode })
              }
            }).catch(() => {})
          }
        }
      })
    }
  },

  /** 微信一键登录 */
  wechatLogin() {
    if (!this.data.agreeWechat) {
      util.showError('请先阅读并同意用户协议和隐私政策')
      return
    }
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
    if (!this.data.agreeBind) {
      util.showError('请先阅读并同意用户协议和隐私政策')
      return
    }
    const phone = this.data.bindPhoneNum.trim()
    const email = this.data.bindEmail.trim()
    const password = this.data.bindPassword
    const confirmPassword = this.data.bindConfirmPassword

    if (!util.isValidPhone(phone)) {
      util.showError('请输入正确的手机号码')
      return
    }
    // 密码校验（同注册页：必填、至少6位、只能字母和数字、两次一致）
    if (!password) {
      util.showError('请输入密码')
      return
    }
    if (password.length < 6) {
      util.showError('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      util.showError('两次密码不一致')
      return
    }
    for (var _i = 0; _i < password.length; _i++) {
      var _ch = password.charAt(_i);
      if (!((_ch >= 'a' && _ch <= 'z') || (_ch >= 'A' && _ch <= 'Z') || (_ch >= '0' && _ch <= '9'))) {
        util.showError('密码只能包含字母和数字');
        return;
      }
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      util.showError('邮箱格式不正确')
      return
    }

    this._doBind('')
  },

  /** 执行绑定；existingPassword 用于手机号已注册时合并到原账户 */
  _doBind(existingPassword) {
    const phone = this.data.bindPhoneNum.trim()
    const email = this.data.bindEmail.trim()
    const password = this.data.bindPassword

    this.setData({ submitting: true })

    api.bindPhoneWithPassword(phone, email, password, existingPassword)
      .then(data => {
        this.setData({ submitting: false })
        if (data.ok) {
          if (data.token) {
            // 合并到老账户的情况，用新 token
            this.completeLogin(data.token, data.user)
          } else {
            this.completeBindLogin(data.user)
          }
        } else {
          util.showError(data.error || '绑定失败')
        }
      })
      .catch(err => {
        this.setData({ submitting: false })
        const d = err.data || {}
        console.log('[bind] error', err.statusCode, d)
        if (err.statusCode === 409 && d.need_existing_password) {
          // 延迟弹窗：避免与 Loading/Toast 的原生调用竞争导致 showModal 不显示
          setTimeout(() => this._askExistingPassword(d.error), 120)
          return
        }
        util.showError(err.message || '绑定失败')
      })
  },

  /** 手机号已注册 → 输入该账户原密码后合并 */
  _askExistingPassword(hint) {
    wx.showModal({
      title: '该手机号已注册',
      content: hint || '请输入该账户原密码后合并',
      editable: true,
      placeholderText: '请输入该账户原密码',
      confirmText: '合并并登录',
      cancelText: '取消',
      success: res => {
        if (!res.confirm) return
        const pwd = (res.content || '').trim()
        if (!pwd) {
          util.showError('请输入该账户原密码')
          return
        }
        this._doBind(pwd)
      },
      fail: err => {
        console.error('[bind] showModal fail', err)
        util.showError(hint || '该手机号已注册，请返回用手机号+密码登录')
      }
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

  /** 手机号 + 密码登录（仅密码登录） */
  submitLogin() {
    if (this.data.submitting) return
    const { phone, password } = this.data

    if (!util.isValidPhone(phone)) {
      util.showError('请输入正确的手机号码')
      return
    }
    if (!password) {
      util.showError('请输入密码')
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '登录中...', mask: true })

    api.login(phone, password)
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
  },

  /** 打开外部链接 */
  openUrl(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url: '/pages/webview/webview?url=' + encodeURIComponent(url) })
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  }
})
