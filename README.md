# 涂阿燃的网络日志

一个极简风格的个人网站与网络日志，记录编程、创作与生活。

🌐 线上地址：[https://2aran.com](https://2aran.com)

---

## 设计理念

- **极简主义**：去除复杂的动画效果和视觉干扰，专注于内容本身
- **清晰布局**：使用简洁的卡片布局和网格系统
- **响应式设计**：适配各种设备尺寸
- **快速加载**：最小化 CSS 和 JavaScript，提升性能

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js (App Router) + React |
| 样式框架 | Tailwind CSS |
| 开发语言 | JavaScript |
| 身份认证 | NextAuth.js（GitHub OAuth） |
| 数据存储 | Cloudflare D1（SQLite） |
| 部署平台 | Cloudflare Pages |

---

## 功能特性

### 个人信息展示
- 头像和基本信息
- 社交媒体链接
- 加入技术群功能

### 技术栈展示
- 前端技术（Vue.js / React）
- 后端技术（Node.js / Python）
- AI/ML 技术
- 云原生架构

### 技术成就
- 技术文章数量
- 技术粉丝数量
- 开源项目数量
- 帮助开发者数量

### 项目展示
- 社区看板 — 数据可视化项目
- 博主联盟 — 技术生态平台
- 超棒提示词 — AI 对话优化
- AI 学习路径 — 技术能力提升
- 大模型交易 — 智能金融决策
- 代码矿工 — 开发工具集合
- 数据库范式教学平台 — 交互式学习

### 互动功能
- GitHub 账号登录
- 踩一踩留言（基于 Cloudflare D1 存储）

---

## 项目结构

```
tuaran-home-page/
├── app/                    # Next.js App Router 页面目录
│   ├── api/                # API 路由（NextAuth、留言等）
│   ├── reading/            # 阅读相关页面
│   └── ...
├── components/             # 公共组件
├── migrations/             # D1 数据库迁移文件
│   └── 0001_init.sql
├── public/                 # 静态资源
├── wrangler.toml           # Cloudflare Workers/Pages 配置
├── next.config.js          # Next.js 配置
└── package.json
```

---

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 本地预览 Admin

Admin 页面和 `/api/admin/*` 默认仍要求 owner session。仅本地开发需要快速预览时，可以显式开启本地预览开关：

```bash
ADMIN_LOCAL_PREVIEW=1 npm run dev
```

该开关只在 `NODE_ENV=development` 下生效；生产环境即使误配 `ADMIN_LOCAL_PREVIEW=1` 也不会绕过 owner 校验。启用后 Admin 页面顶部会显示本地预览提示。

### DeepSeek 任务规划器

`/admin/model-dispatch` 会通过 owner-only API `/api/admin/model-dispatch/plan` 调用 DeepSeek V4 Pro 做任务拆解和 agent 分派。密钥只放环境变量，不写入源码：

```bash
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-v4-pro
# 可选：DEEPSEEK_BASE_URL=https://api.deepseek.com
```

本地 `.env.local` 已被 `.gitignore` 排除；线上部署时把同名变量配置到 Cloudflare Pages / Workers 环境变量或 secret。

### 构建生产版本

```bash
npm run build
```

### 运行生产服务器

```bash
npm run start
```

---

## Cloudflare Pages 部署

本项目在 Cloudflare Pages 上以 **SSR/Functions** 方式运行（非纯静态导出）。

### 1. Pages 构建配置

在 Cloudflare Pages 项目设置中配置：

| 配置项 | 值 |
|--------|-----|
| Build command | `npm run pages:build` |
| Build output directory | `.vercel/output/static` |

> ⚠️ **常见报错**：`Error: Output directory "out" not found`
>
> 原因：旧的纯静态方案产物在 `out/`，而 next-on-pages 产物在 `.vercel/output/static`，请确认构建配置正确。

### 2. 环境变量

在 Cloudflare Pages 项目里添加以下环境变量（Production / Preview 均需配置）：

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `NODE_VERSION` | Text | `20`（与 `.nvmrc` 一致；Next 15 建议在 Cloudflare 显式指定，避免默认 Node 过旧） |
| `GITHUB_ID` | Text | GitHub OAuth App Client ID |
| `GITHUB_SECRET` | Secret | GitHub OAuth App Client Secret |
| `NEXTAUTH_URL` | Text | 例如 `https://2aran.com` |
| `NEXTAUTH_SECRET` | Secret | 使用 `openssl rand -base64 32` 生成 |

### 3. GitHub OAuth App 配置

在 GitHub 创建/配置 OAuth App：

- **Homepage URL**：`https://2aran.com`
- **Authorization callback URL**：`https://2aran.com/api/auth/callback/github`

### 4. D1 数据库配置（踩一踩留言存储）

留言存储使用 Cloudflare D1，通过 `DB` binding 注入到 Functions。

#### 4.1 创建并迁移数据库

```bash
# 1) 创建数据库
wrangler d1 create tuaran-me

# 2) 将输出的 database_id 填入 wrangler.toml

# 3) 执行迁移建表
wrangler d1 migrations apply tuaran-me
```

公开写接口启用限流后，需要确保 `0017_abuse_controls.sql` 已应用到线上 D1；否则短链、评论、踩踏等写接口会因为缺少 `api_rate_limits` 表而返回 500。

> ⚠️ **常见报错**：`Error 8000022: Invalid database UUID ()`
>
> 解决：到 Cloudflare D1 控制台复制正确的 Database ID（UUID），填入 `wrangler.toml` 后重新部署。

### 邮箱验证码注册（Resend）

项目提供 `/register` 注册页，以及以下 Edge API：

```text
POST /api/auth/email/send-code
POST /api/auth/register
POST /api/auth/login
```

先在 Resend 验证发件域名，再为 Cloudflare Pages / Worker 配置 secrets：

```bash
npx wrangler pages secret put NEXTAUTH_SECRET --project-name=tuaran
npx wrangler pages secret put EMAIL_CODE_SECRET --project-name=tuaran
npx wrangler pages secret put RESEND_API_KEY --project-name=tuaran
npx wrangler pages secret put EMAIL_FROM --project-name=tuaran
```

`EMAIL_FROM` 示例：`2aran.com <noreply@mail.2aran.com>`。`NEXTAUTH_SECRET` 与
`EMAIL_CODE_SECRET` 必须使用不同的随机值。然后应用 D1 migration：

```bash
npx wrangler d1 migrations apply tuaran-me --remote
```

#### 4.2 在 Pages 项目中绑定 D1

Cloudflare Dashboard → Pages → 你的项目 → Settings → Bindings：

| 配置项 | 值 |
|--------|-----|
| Binding type | D1 database |
| Binding name | `DB` |
| Database | 选择你创建的 D1 数据库（云端） |

### 5. nodejs_compat 兼容性标志

如果构建时出现以下警告：

```
The package "node:async_hooks" wasn't found... enable the "nodejs_compat" compatibility flag
```

请在 `wrangler.toml` 中开启：

```toml
compatibility_flags = ["nodejs_compat"]
```

### 6. 部署方式说明

| 方式 | 说明 |
|------|------|
| **方式 A（推荐）** | Cloudflare Pages 连接 Git 仓库，`git push` 后自动构建发布 |
| **方式 B** | 本地手动执行 `wrangler pages deploy`，需确保 `wrangler.toml` 中 `database_id` 正确 |

---

## 设计变更记录

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

---

## 作者

**掘金安东尼** — 全栈开发专家 / AI 技术博主

- 🌐 网站：[2aran.com](https://2aran.com)
- 📝 掘金：[掘金主页](https://juejin.cn/user/3544481219674541)
