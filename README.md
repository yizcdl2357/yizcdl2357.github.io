# 英语作文语料库

英语作文备战项目：按作文主题收集、上传和检索优文语段。

## 功能

- 用户注册、登录和登出
- 登录用户上传优文语段
- 按主题、关键词和标签搜索语段
- 浏览最新语段
- 在用户主页查看自己的上传

## 本地开发

直接用浏览器打开 `index.html` 即可运行。

直接打开 `index.html` 时，前端使用 `localStorage` 演示数据。使用本地 API 时：

```powershell
Copy-Item .env.example .env
npm start
```

## Railway 后端部署

Railway 服务从仓库根目录运行 `npm start`，健康检查路径为 `/health`。Railway Variables 配置：

```text
APP_ENV=production
DB_CLIENT=mysql
DB_HOST=mysql6.sqlpub.com
DB_PORT=3311
DB_NAME=yizcdl2357eng
DB_USER=yizcdl2357
DB_PASSWORD=<Railway Secret>
DB_SSL=false
CORS_ORIGIN=https://yizcdl2357.github.io
COOKIE_SECURE=true
SYSTEM_USER_ID=system
SOURCE_SYSTEM_USER_ID=system
```

`DB_PASSWORD` 只能保存在 Railway Secret 中，不得写入文件或 Git。如 MySQL 服务商要求 TLS，将 `DB_SSL=true`；只在明确使用自签名证书时才调整 `DB_SSL_REJECT_UNAUTHORIZED`。

Railway 公网域名确定后，在 GitHub Pages 的 `js/runtimeConfig.js` 中只填写公开 API 地址：

```js
window.APP_CONFIG = { API_BASE_URL: "https://your-service.up.railway.app" };
```

该文件不包含数据库凭据。配置云 API 后，连接失败不会静默写回本地演示数据，避免再次产生跨设备分叉。

## 数据库迁移与例句复制

```powershell
npm run db:migrate
npm run db:copy-to-mysql
```

`db:migrate` 只执行 `CREATE TABLE IF NOT EXISTS` 和标签幂等写入，不删表、不清空数据。`db:copy-to-mysql` 只复制 SQLite 中归属系统用户的例句正文、主题和标签；不复制普通用户、收藏或会话。脚本可重复运行，并在事务中幂等更新语料。
