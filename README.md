# 庖丁法律服务 - 微信小程序

庖丁法律服务配套的微信小程序，提供法律咨询、知识查阅、联系我们等核心功能。

## 项目结构

```
paoding-miniapp/
├── app.json              # 小程序全局配置
├── app.js                # 全局逻辑（登录状态管理）
├── app.wxss              # 全局样式
├── project.config.json   # 开发者工具配置
├── sitemap.json          # 搜索配置
├── images/               # 图标和图片资源
├── utils/
│   ├── api.js            # API 封装（所有后端接口调用）
│   └── util.js           # 工具函数（格式化、校验、提示等）
└── pages/
    ├── index/             # 首页 - 品牌展示、功能入口
    ├── login/             # 登录（微信一键登录/密码/验证码）
    ├── register/          # 注册（手机号+验证码）
    ├── consult/           # 咨询列表 - 发起新咨询、下拉刷新
    ├── consult-detail/    # 咨询聊天 - 消息发送、文件上传、轮询
    ├── documents/         # 法律知识 - 搜索、分类筛选
    ├── document-detail/   # 文档详情 - Markdown 渲染
    ├── contact/           # 联系我们 - 电话、地址、导航
    └── profile/           # 个人中心 - 数据统计、退出登录
```

## 功能清单

| 模块 | 功能 | 说明 |
|------|------|------|
| 首页 | 品牌展示 | Logo、标语、服务特色 |
| 首页 | 快捷入口 | 咨询、知识库、联系我们 |
| 登录 | 微信一键登录 | `wx.login()` 获取 code 交换 token |
| 登录 | 手机号+密码 | 传统登录方式 |
| 登录 | 验证码登录 | 短信验证码快捷登录 |
| 注册 | 手机号注册 | 短信验证、密码设置 |
| 咨询 | 咨询列表 | 分页加载、下拉刷新、状态标记 |
| 咨询 | 发起咨询 | 弹窗输入标题和内容 |
| 咨询 | 实时聊天 | 文本消息、图片发送、5秒轮询 |
| 咨询 | 关闭/删除 | 用户可关闭或删除咨询 |
| 知识 | 文档列表 | 搜索、分类筛选 |
| 知识 | 文档详情 | Markdown 内容渲染 |
| 联系 | 联系我们 | 电话拨打、地址复制、地图导航、微信公众号二维码 |
| 个人中心 | 用户信息 | 头像、用户名、手机号 |
| 个人中心 | 统计数据 | 总咨询数、进行中数 |
| 个人中心 | 退出登录 | 清除 Token |

## 接入指南

### 1. 配置后端 API

修改 `utils/api.js` 中的 `BASE_URL` 为你的服务器地址：

```js
const BASE_URL = 'https://paodinglaw.com'
```

### 2. 配置微信小程序

在 `project.config.json` 中填写你的小程序 `appid`：

```json
{
  "appid": "你的微信小程序 AppID"
}
```

### 3. 配置后端微信登录（可选）

在服务器环境变量中设置：

```bash
export WX_MINI_APPID=你的微信小程序AppID
export WX_MINI_SECRET=你的微信小程序Secret
```

如不配置，开发模式下会自动创建测试用户。

### 4. 部署后端

```bash
# 更新数据库（添加 openid 字段）
flask init-db

# 或者手动在数据库中执行：
# ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE;
```

### 5. 微信开发者工具

1. 打开微信开发者工具
2. 导入项目目录 `paoding-miniapp/`
3. 填入 AppID
4. 在「详情 → 本地设置」中勾选「不校验合法域名」
5. 确保 Flask 后端运行在 `localhost:5000`

### 6. 后端需要新增的 API

小程序依赖以下后端 API，均已实现在 `paoding-law/miniapp_routes.py` 中，已在 `app.py` 注册：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/wechat/login` | 微信 code 登录 |
| POST | `/api/miniapp/login` | 手机号+密码登录 |
| POST | `/api/miniapp/register` | 手机号+验证码注册 |
| GET | `/api/user/profile` | 获取用户信息 |
| PUT | `/api/user/profile` | 更新用户信息 |
| GET | `/api/site/settings` | 获取站点公开设置 |
| GET | `/api/consultations` | 咨询列表（已有） |
| GET | `/api/consultations/<id>` | 咨询详情（新增） |
| POST | `/api/consultations` | 创建咨询（已有） |
| GET | `/api/consultations/<id>/messages` | 获取消息（已有） |
| POST | `/api/consultations/<id>/messages` | 发送消息（已有） |
| POST | `/api/consultations/<id>/close` | 关闭咨询（已有） |
| DELETE | `/api/consultations/<id>` | 删除咨询（已有） |
| GET | `/api/documents` | 文档列表（已有） |
| GET | `/api/documents/<id>` | 文档详情（已有） |
| POST | `/api/sms/send` | 发送验证码（已有） |

## 注意事项

1. **Tab 图标**：`images/tab_*.png` 是占位图标，建议替换为设计好的正式图标
2. **Logo**：`images/logo.png` 从网站复制，可替换
3. **实时消息**：小程序不支持原生 Socket.IO，使用 5 秒轮询代替。如需更好体验，建议后端增加 SSE 或短轮询 API
4. **Token 管理**：当前使用内存 Token（重启会失效），生产环境建议改为 JWT 或 Redis 存储
5. **微信支付**：如需集成支付功能，需额外开发
