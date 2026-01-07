# 涂阿燃的网络日志

一个极简风格的个人网站与网络日志，记录编程、创作与生活。

## 设计理念

- **极简主义**: 去除复杂的动画效果和视觉干扰，专注于内容本身
- **清晰布局**: 使用简洁的卡片布局和网格系统
- **响应式设计**: 适配各种设备尺寸
- **快速加载**: 最小化CSS和JavaScript，提升性能

## 技术栈

- **前端框架**: Next.js (App Router) + React
- **样式框架**: Tailwind CSS
- **开发语言**: JavaScript

## 功能特性

### 个人信息展示
- 头像和基本信息
- 社交媒体链接
- 加入技术群功能

### 技术栈展示
- 前端技术 (Vue.js / React)
- 后端技术 (Node.js / Python)
- AI/ML 技术
- 云原生架构

### 技术成就
- 技术文章数量
- 技术粉丝数量
- 开源项目数量
- 帮助开发者数量

### 项目展示
- 社区看板 - 数据可视化项目
- 博主联盟 - 技术生态平台
- 超棒提示词 - AI对话优化
- AI学习路径 - 技术能力提升
- 大模型交易 - 智能金融决策
- 代码矿工 - 开发工具集合
- 数据库范式教学平台 - 交互式学习

## 开发指南

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## Cloudflare Pages 部署（GitHub 登录 + 踩一踩留言）

本项目在 Cloudflare Pages 上以 **SSR/Functions** 方式运行（不是纯静态导出）。

### 1) Pages 构建配置

在 Cloudflare Pages 项目设置中配置：

- Build command：`npm run pages:build`（等价于 `npx @cloudflare/next-on-pages@1`）
- Build output directory：`.vercel/output/static`

> 常见报错：`Error: Output directory "out" not found`
>
> 这是因为旧的纯静态方案会生成 `out/`，但现在使用 next-on-pages 产物在 `.vercel/output/static`。

### 2) 环境变量（Pages）

在 Cloudflare Pages 项目里添加环境变量（Production / Preview 视情况都加）：

- `GITHUB_ID`（Text）
- `GITHUB_SECRET`（Secret）
- `NEXTAUTH_URL`（Text）：例如 `https://tuaran.me`
- `NEXTAUTH_SECRET`（Secret）：使用 `openssl rand -base64 32` 生成

### 3) GitHub OAuth App（回调地址）

在 GitHub 创建/配置 OAuth App：

- Homepage URL：`https://tuaran.me`
- Authorization callback URL：`https://tuaran.me/api/auth/callback/github`

### 4) D1（踩一踩留言存储）

留言存储使用 Cloudflare D1，并通过 `DB` binding 注入到 Functions（代码读取 `env.DB`）。

#### 4.1 在 Cloudflare Pages 项目里绑定 D1

Cloudflare Dashboard → Pages → 你的项目 → Settings → Bindings：

- Binding type：D1 database
- Binding name：`DB`
- Database：选择你创建的 D1 数据库（云端的，不是本地的）

#### 4.2 迁移建表（wrangler）

迁移文件在 `migrations/0001_init.sql`。

```bash
# 1) 创建数据库（如果还没创建）
wrangler d1 create tuaran-me

# 2) 把输出的 database_id 写进 wrangler.toml

# 3) 执行迁移（建表）
wrangler d1 migrations apply tuaran-me
```

> 常见报错：`Error 8000022: Invalid database UUID ()`
>
> 这表示你用 `wrangler pages deploy` 发布 Functions 时，`wrangler.toml` 的 D1 `database_id` 为空或不合法。
> 解决：到 Cloudflare D1 控制台复制正确的 Database ID（UUID），填进 `wrangler.toml` 再重新部署。

### 5) nodejs_compat 警告

如果你在构建/上传时看到：

`The package "node:async_hooks" wasn't found... enable the "nodejs_compat" compatibility flag`

请在 `wrangler.toml` 里开启：

```toml
compatibility_flags = ["nodejs_compat"]
```

### 6) 部署方式说明（两种不要混淆）

- 方式 A（推荐）：Cloudflare Pages 连接 Git 仓库
	- 你只需要 `git push`，Pages 会自动拉代码、执行 Build command、发布。
- 方式 B：本地手动 `wrangler pages deploy`
	- 你需要在本地有正确的 `wrangler.toml`（尤其是 D1 `database_id`），否则会出现 UUID 相关发布失败。

### D1（踩一踩留言存储）

需要绑定一个 D1 数据库到 `DB`：

1) 创建 D1：`wrangler d1 create tuaran-me`
2) 把返回的 `database_id` 填进 [wrangler.toml](wrangler.toml) 的 `database_id`
3) 执行迁移：`wrangler d1 migrations apply tuaran-me`

然后在 Cloudflare Pages 项目里添加 D1 binding：

- Binding name：`DB`
- 选择你创建的 D1 数据库

### 运行生产服务器
```bash
npm run start
```

## 项目结构

```
src/
├── App.vue          # 主应用组件
├── main.js          # 应用入口
├── style.css        # 全局样式
└── components/      # 组件目录
```

## 设计变更

### 重构前
- 复杂的瀑布流布局
- 大量动画效果和渐变背景
- 霓虹灯、脉冲、呼吸等特效
- 深色主题设计

### 重构后
- 简洁的卡片布局
- 白色背景，清晰的层次结构
- 最小化的过渡效果
- 专注于内容可读性

## 访问地址

开发环境: http://localhost:3000

## 作者

掘金安东尼 - 全栈开发专家 / AI技术博主 