# 涂阿燃的网络日志 · 2aran.com

[2aran.com](https://2aran.com) 的生产源码：一个持续运行的个人网站、内容系统、AI Agent 工程实验场与站长工作台。

这个仓库不是通用博客模板。公开页面可以在本地浏览，但登录、评论、燃币、后台、私域数据、邮件、OAuth、D1 与 R2 等能力依赖站长自己的 Cloudflare 和第三方服务配置。仓库公开的主要目的，是展示一个前端与 AI Agent 工程师如何把写作、调研、出版、开源贡献、产品、工具和长期项目放进同一套 Web 系统持续维护。

- 线上站点：[2aran.com](https://2aran.com)
- 关于站长：[2aran.com/about](https://2aran.com/about)
- 全站地图：[2aran.com/map](https://2aran.com/map)
- 更新记录：[2aran.com/changelog](https://2aran.com/changelog)
- 面向智能体的站点说明：[2aran.com/llms.txt](https://2aran.com/llms.txt)

## 站长身份与可核验成果

涂阿燃（TUARAN，也使用“掘金安东尼”“安东尼404”等名字）是前端与 AI Agent 工程师、技术写作者和产品实践者。

- 《程序员成长手记》作者：技术图书，2023 年已出版。
- 《AI Bots 通关指南》作者：电子小册，2024 年已发布。
- OpenClaw Contributor：已有 5 个 PR 合并至 `openclaw:main`（[#90517](https://github.com/openclaw/openclaw/pull/90517)、[#98320](https://github.com/openclaw/openclaw/pull/98320)、[#91553](https://github.com/openclaw/openclaw/pull/91553)、[#102537](https://github.com/openclaw/openclaw/pull/102537)、[#113200](https://github.com/openclaw/openclaw/pull/113200)）。
- 维护矩联科技、博主联盟、前端周看、AI 分发大师等产品与内容项目。

这里只列入站内有明确记录或可以从外部链接核验的事实；出版中、撰写中和计划中的项目不会计入已完成成果。

## 五个公开频道

主导航与 `/map` 共用 `lib/siteNav.js` 作为结构化数据源。导航项还可以按 `public`、`authed`、`owner` 三种受众动态控制可见性。

| 频道 | 主要内容 |
| --- | --- |
| **内容** | [文章与分析](https://2aran.com/articles)、灵感流、前端周看、公司 / 人物 / 技术 / 商业分析，以及资源、书目、历史与外部收藏 |
| **工具** | [工具库](https://2aran.com/tools)、浏览器扩展、桌面应用、端侧大模型、舆情与交易分析、多维交互页面 |
| **系统** | [作品展厅](https://2aran.com/works)、[Skill 中心](https://2aran.com/skill-center)、[MCP 中心](https://2aran.com/mcp-center)、Prompt 中心和上下文记忆 |
| **圈子** | [讨论中心](https://2aran.com/community)、燃币、专题圈子、合作说明，以及面向创作者和产品方的外部项目 |
| **关于** | [关于本站](https://2aran.com/site)、[关于站长](https://2aran.com/about)、出版记录、内容规范、隐私政策、流量与更新日志 |

## 当前能力

### 内容与检索

- 文章、研究、资源和多维页面由统一内容管线归档，`contentKey` 同时连接评论、点赞、燃币解锁、阅读统计与相关推荐。
- `research/` 保存 Markdown 研究稿，`content/` 保存文章、资源和“前端周看”等结构化内容。
- D1 `content_index` 支持后台同步与手工登记；部分内容无需重新构建即可进入文章索引。
- 提供 Sitemap、RSS、`llms.txt`、结构化数据与 canonical URL，兼顾搜索引擎、读者和智能体检索。
- 调研风格规则集中在 `lib/researchStyleTemplates.js`、`lib/researchStyleRules.json`，构建时会执行内容风格审计。

### 账户、社区与权益

- 自定义 Cloudflare Edge Session，不以 NextAuth 作为生产认证层。
- 支持 GitHub、Google、微信 OAuth，以及邮箱验证码 / 密码注册登录。
- 不按昵称、手机号或邮箱自动合并第三方身份；账号绑定通过显式授权完成。
- 游客可以获得签名访客身份，登录后按规则承接历史互动数据。
- 评论、讨论、通知、签到、燃币余额和资源解锁以 D1 为主要存储。
- 站长身份由 `SITE_OWNER_IDS`、`SITE_OWNER_LOGINS`、`SITE_OWNER_EMAILS` 等白名单配置确认。

### AI、Agent 与工具

- `/web-llm` 使用 WebGPU 和 Transformers.js 在访问者设备上运行模型，数据不需要上传到站点推理服务。
- MCP 中心包含 OAuth 2.1 风格的授权端点和示例 MCP 服务，可让已授权智能体查询站内文章与天气工具。
- 后台模型调度可以在配置 `DEEPSEEK_API_KEY` 后调用 DeepSeek；普通公开页面不依赖线上 LLM API 才能完成渲染和阅读。
- Skill、Prompt、上下文记忆和作品展厅用于整理可复用的 Agent 工程能力，而不是只展示静态项目卡片。

### 站长后台

后台运行在 `admin.2aran.com`，并与公开站点使用独立的 Cloudflare Pages 构建目标。主要工作台包括：

- 内容编辑、内容索引、首页推荐、研究风格、前端周看和 RSS 管理；
- 项目组合、规划中心、AI 工作区、模型调度、Ops、站点开发与上下文记忆；
- D1 数据健康、站点设置、SEO、短链、活动归档和系统运维；
- 用户、角色、封禁、燃币、资源权益和菜单权限；
- 长期罗盘、加密信息库与私有 NSFW R2 媒体库。

规划中心使用“方向 → 项目 → 里程碑 → 任务”的层级管理长期项目，并保留历史事件、决策与依赖关系。

## 架构概览

| 层 | 实现 |
| --- | --- |
| Web | Next.js 15 App Router、React 19、JavaScript |
| UI | Tailwind CSS 3、响应式布局、浅色 / 深色主题、中文 / 英文导航 |
| 内容 | Markdown、JSON、构建期注册表、D1 内容索引 |
| 运行时 | 静态生成 / ISR、Cloudflare Pages Functions、浏览器端 WebGPU |
| 数据库 | Cloudflare D1，迁移文件位于 `migrations/` |
| 文件存储 | `MEDIA` 公共 R2 桶与 `NSFW_MEDIA` 私有 R2 桶 |
| 认证 | 自定义 HMAC Session、GitHub / Google / 微信 OAuth、邮箱登录 |
| Agent 接口 | MCP 资源服务、OAuth 授权服务、`llms.txt`、RSS |
| 自动化 | GitHub Actions、内容同步脚本、定时采集端点 |
| 部署 | Cloudflare Pages，公开站与 Admin 子域拆分构建 |

## 目录结构

```text
app/
  (site)/          公开页面与站点组件
  (admin)/         站长后台
  (web-llm)/       端侧大模型独立路由组
  api/             Edge API、认证、MCP 与后台接口
  .well-known/     OAuth / MCP 元数据端点
content/           文章、资源、前端周看等内容数据
research/          公司、人物、事项研究 Markdown
lib/               内容、认证、D1、R2、SEO、规划与业务规则
migrations/        Cloudflare D1 SQL 迁移
public/            静态资源与公开生成数据
scripts/           构建、同步、审计和维护脚本
tests/             Node 测试，目前重点覆盖规划中心
docs/              架构、部署与实现说明
desktop/           Electron 桌面端外壳
```

## 本地开发

### 环境要求

- Node.js `>=22.12.0 <23`（仓库 `.nvmrc` 当前为 `22.12.0`）
- npm 10+；CI 使用 `npm ci`
- 如需运行完整数据能力，需要 Cloudflare D1 / R2 与对应第三方凭证

### 启动公开页面

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。没有配置 D1、OAuth 或邮件服务时，大部分静态内容仍可浏览；依赖云端绑定的登录、评论、后台与资源操作不可用或会返回明确的配置错误。

### 常用检查

```bash
npm run lint
npm run build:check
npm run security:check
npm run research:style-audit
npm run test:planning
```

## 环境变量

`.env.example` 给出本地开发的最小模板。不要提交 `.env.local`、`.dev.vars`、API Key、OAuth Secret、Cookie Secret 或生产数据库导出。

| 类别 | 关键变量 |
| --- | --- |
| 站点与 Session | `NEXTAUTH_URL`、`NEXTAUTH_SECRET` |
| OAuth | `GITHUB_ID`、`GITHUB_SECRET`、`GOOGLE_ID`、`GOOGLE_SECRET`、`WECHAT_APP_ID`、`WECHAT_APP_SECRET` |
| 微信开关 | `WECHAT_LOGIN_ENABLED`、`NEXT_PUBLIC_WECHAT_LOGIN_ENABLED` |
| 站长白名单 | `SITE_OWNER_IDS`、`SITE_OWNER_LOGINS`、`SITE_OWNER_EMAILS` |
| 邮箱登录 | `EMAIL_CODE_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM` |
| Cloudflare | `DB`、`R2_PUBLIC_BASE`；生产环境还需要 `MEDIA`、`NSFW_MEDIA` bindings |
| 调研加密 | `RESEARCH_ENCRYPTION_PASSWORD` |
| 后台模型调度 | `DEEPSEEK_API_KEY`，可选 `DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` |
| X 站长分发 | `X_API_KEY`、`X_API_KEY_SECRET`、`X_ACCESS_TOKEN`、`X_ACCESS_TOKEN_SECRET` |
| 定时采集 | `PUBLIC_OPINION_COLLECT_SECRET` 等对应任务 Secret |
| 广告 | `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT` 与页面广告位变量 |

`NEXTAUTH_*` 名称是历史兼容命名；生产登录实际由 `lib/edgeSession.js` 和 `/api/auth/*` 自定义路由处理。`/api/auth/[...nextauth]` 仅保留为返回 HTTP 410 的废弃兼容端点。

## 构建与部署

本仓库使用三种 Cloudflare Pages 构建模式：

| 命令 | 用途 |
| --- | --- |
| `npm run pages:build:public` | `2aran.com` 公开站构建，临时排除 Admin 路由 |
| `npm run pages:build:admin` | `admin.2aran.com` 后台构建，仅保留后台及必要认证接口，并校验 Worker 大小与路由边界 |
| `npm run pages:build:all` | 完整构建，主要用于本地验证或应急 |

详细拆分约束见 [`docs/cloudflare-split-plan.md`](docs/cloudflare-split-plan.md)，前端周刊高频数据拆分见 [`docs/frontend-weekly-data-pipeline.md`](docs/frontend-weekly-data-pipeline.md)。Cloudflare 绑定定义位于 `wrangler.toml`，D1 结构变更位于 `migrations/`。生产迁移与 Secret 配置应通过 Cloudflare 控制台或 Wrangler 在明确目标环境中执行，不应把真实凭证写入仓库。

## 自动化与质量门禁

- `.github/workflows/ci.yml` 在 `main` push 和 Pull Request 上执行 lint 与生产构建。
- “前端周看”每日精选、每时新闻与周刊索引由独立 GitHub Actions 同步。
- 舆情采集通过受 Secret 保护的生产端点定时触发。
- 2026 Agent 世界杯活动已经归档，自动采集已停止，只保留手动归档状态工作流。
- Git pre-push hook 会检查静态资源大小、敏感文件和 lint。

## 反馈与贡献

优先通过 [GitHub Issues](https://github.com/TUARAN/tuaran-home-page/issues) 反馈：

- 页面错误、移动端错位、链接失效与可访问性问题；
- 文章、调研或资源中的事实错误；
- 性能、SEO、安全与工程改进建议；
- 与站点定位一致的新工具或内容想法。

不要在 Issue、日志、截图或提交中暴露 API Key、Token、密码、私人联系方式或其他敏感数据。Pull Request 是否接受，会结合个人站定位、数据依赖和长期维护成本判断。

## 许可证

本仓库采用双许可证说明：

- **代码**：MIT License，适用于站点源码、组件、脚本、API 路由和配置。
- **非代码内容**：除非另有说明，原创文章、调研、资源整理和图片说明采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。

第三方链接、引用材料、商标、平台截图和外部资源仍归原权利人所有。

## 作者

涂阿燃 / TUARAN / 掘金安东尼

- 网站：[2aran.com](https://2aran.com)
- GitHub：[TUARAN](https://github.com/TUARAN)
- 掘金：[涂阿燃的掘金主页](https://juejin.cn/user/1521379823340792)
- 开源贡献：[OpenClaw PR #90517](https://github.com/openclaw/openclaw/pull/90517)、[#98320](https://github.com/openclaw/openclaw/pull/98320)、[#91553](https://github.com/openclaw/openclaw/pull/91553)、[#102537](https://github.com/openclaw/openclaw/pull/102537)、[#113200](https://github.com/openclaw/openclaw/pull/113200)
