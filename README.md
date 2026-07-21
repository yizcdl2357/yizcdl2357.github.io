# 英语作文语料库

英语作文备战项目：按作文主题收集、上传和检索优文语段。

## 功能

- 用户注册、登录和登出
- 登录用户上传优文语段
- 按主题、关键词和标签搜索语段
- 浏览最新语段
- 在用户主页查看自己的上传
- 收藏和删除自己发布的语段
- 拍照上传并识别图片中的英文文字
- 自动根据语段内容推荐作文主题

## 运行方式

### 静态演示模式

直接用浏览器打开 `index.html` 即可运行。没有后端服务时，网页会自动使用 `localStorage` 保存演示数据，适合 GitHub Pages 静态部署和快速预览。

### 后端数据库模式

安装依赖后启动后端：

```bash
pnpm install
pnpm start
```

默认使用 SQLite，数据库文件为 `data/english-corpus.sqlite`。后端启动时会自动执行迁移脚本并提供静态页面和 `/api` 接口。

如需手动执行数据库脚本：

```bash
pnpm run db:migrate
pnpm run db:seed
```

部署到 MySQL 时，复制 `.env.example` 为 `.env`，将 `DB_CLIENT=mysql` 取消注释，并填写 `DB_HOST`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` 等连接信息。
