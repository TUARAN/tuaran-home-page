# tuaran-home-page 技术架构总结

## 1. 项目定位

这是一个基于 `Next.js 15 App Router` 的个人网站项目，核心形态不是单一博客，而是一个混合站点：

- 内容展示站：主页、文章、阅读、书签、人物、项目等页面。
- 交互站点：登录态获取、留言（stomp）功能。
- AI 体验页：`/web-llm` 在浏览器端用 WebGPU 跑本地模型。

整体部署目标是 `Cloudflare Pages + Functions + D1`，因此代码同时兼顾：

- 标准 Next.js 页面开发体验
- Cloudflare Edge 运行时约束
- 浏览器侧推理能力

## 2. 核心技术栈

`package.json` 显示当前主栈如下：

- 框架：`next@15.1.3`
- 视图层：`react@19`
- 样式：`tailwindcss@3`
- 主题：`next-themes`
- 浏览器端模型推理：`@huggingface/transformers`
- 云平台适配：`@cloudflare/next-on-pages`

补充说明：

- 项目代码主体使用 `JavaScript`，未引入 TypeScript。
- 页面路由采用 `app/` 目录，即 App Router 方案。
- 数据库存储采用 `Cloudflare D1`，本质是托管 SQLite。

## 3. 目录结构与职责

### 3.1 页面与路由层

`app/` 是项目主入口，承担页面、布局和 API 路由：

- `app/layout.jsx`
  定义全站根布局、SEO 元信息、结构化数据、主题容器、站点外壳。
- `app/page.jsx`
  首页，偏静态内容驱动。
- `app/articles/`
  文章列表和文章详情页。
- `app/reading/`
  阅读主题页，按分类拆分子路由。
- `app/bookmarks/`
  书签与分类页面。
- `app/web-llm/`
  浏览器端大模型问答功能。
- `app/api/`
  服务端接口，包括登录、当前用户、留言等。

### 3.2 组件层

`app/components/` 放全站复用 UI 与功能组件，例如：

- `LayoutChrome.jsx`：控制是否显示站点头部。
- `SiteHeader.jsx`：全站导航头。
- `ThemeProvider.jsx`：主题切换支持。
- `AnalyticsScripts.jsx`：埋点脚本注入。
- `StompPanel.jsx`：留言能力的前端 UI。
- `WebLlmModal.jsx`：和站内 AI 体验相关的入口组件。

### 3.3 基础能力层

`lib/` 放运行时相关封装：

- `edgeSession.js`
  自定义 GitHub OAuth + 签名 Cookie 会话方案。
- `d1.js`
  从 Cloudflare Pages 运行时上下文读取 `DB` 绑定。
- `stompDb.js`
  基于 `better-sqlite3` 的本地 SQLite 版本留言存储，像是早期/本地兜底实现。
- `authOptions.js`
  当前内容为空，基本处于保留状态。

### 3.4 静态资源层

`public/` 存放：

- favicon / manifest / robots 等站点资源
- 头像、封面、二维码
- 阅读分类图片
- 书签缩略图
- `public/web-llm/site-context.md` 这类提供给 AI 功能使用的站点上下文材料

### 3.5 数据与部署配置

- `migrations/0001_init.sql`
  D1 初始化建表脚本，目前主要是 `stomps` 表。
- `next.config.js`
  Next.js 自定义 headers、redirects、图片白名单。
- `wrangler.toml`
  Cloudflare Pages/D1 配置。

## 4. 页面架构

### 4.1 根布局

`app/layout.jsx` 是全站装配点，负责：

- 定义 `metadata`
- 输出 `Person` 类型 JSON-LD
- 注入统计脚本
- 包裹 `ThemeProvider`
- 通过 `LayoutChrome` 统一页面外壳

这意味着 SEO、社交分享、站点品牌信息都集中在根布局维护。

### 4.2 内容页面组织方式

内容页主要有两类：

- 纯页面组件直接写内容
- 用数据文件驱动页面渲染

其中文章系统最典型：

- `app/articles/articlesData.js` 直接维护文章元数据和正文内容
- `app/articles/[slug]/page.jsx` 根据 `slug` 读取数据生成详情页
- `generateStaticParams()` 预生成文章路由

这是一个“轻 CMS”思路：内容直接存在代码仓库里，不依赖外部 CMS 或数据库。

### 4.3 SEO 与发现能力

SEO 相关能力比较完整：

- 根布局统一元信息
- 文章详情页单独生成 metadata
- `app/sitemap.js` 动态输出 sitemap
- `app/robots.js` 输出 robots 规则
- 页面内嵌 JSON-LD 结构化数据

站点明显不是纯展示页面拼接，而是有明确搜索引擎友好设计。

## 5. 交互与数据流

### 5.1 登录鉴权

当前生效方案不是标准 NextAuth 页面流，而是自定义 Edge OAuth 流程：

1. `GET /api/auth/login`
   生成 state，写入 Cookie，然后 302 到 GitHub OAuth 授权页。
2. `GET /api/auth/callback/github`
   校验 state，向 GitHub 换 token，再拉取用户信息。
3. 服务端使用 `lib/edgeSession.js` 对用户信息签名，写入 `tuaran_session` Cookie。
4. `GET /api/me`
   解析并验证 Cookie，返回当前用户。

这一套方案的特点：

- 兼容 Cloudflare Edge 运行时
- 避开 NextAuth 在 Cloudflare 场景下的额外复杂度
- 会话存储走签名 JWT 风格 Cookie，而不是服务端 session store

仓库里仍保留了两类历史痕迹：

- `auth.js` 中有 `NextAuth(...)` 初始化代码
- `app/api/auth/[...nextauth]/route.js` 已明确返回 `410 DEPRECATED`

说明项目曾使用或尝试使用 NextAuth，后来迁移到自定义鉴权方案。

### 5.2 留言（stomp）功能

留言接口在 `app/api/stomp/route.js`：

- `GET`：查询最近留言
- `POST`：要求用户已登录，写入留言

当前线上目标实现依赖：

- `lib/d1.js` 从 Cloudflare 上下文取 `env.DB`
- D1 表 `stomps`

数据库表结构很简单：

- `id`
- `user_id`
- `user_name`
- `user_image`
- `message`
- `created_at`

此外，`lib/stompDb.js` 还保留了本地 `better-sqlite3` 实现，但当前 API 路由没有调用它，说明它更像旧版本或本地替代方案。

## 6. Web LLM 架构

`/web-llm` 是项目里最特殊的一块，它不是传统 SSR 功能，而是浏览器端 AI Runtime。

### 6.1 页面结构

- `app/web-llm/page.jsx`
  服务端页面壳，挂载客户端组件。
- `app/web-llm/WebLlmPageClient.jsx`
  主交互界面，负责模型加载、会话管理、推理状态展示。
- `app/web-llm/lib/runtime.js`
  模型加载与推理核心逻辑。
- `app/web-llm/lib/sessionStore.js`
  本地会话持久化。
- `app/web-llm/lib/siteContext.js`
  站点上下文注入。

### 6.2 运行方式

浏览器端推理依赖：

- `WebGPU`
- 安全上下文
- `crossOriginIsolated`

因此 `next.config.js` 给以下路由额外加了头：

- `/web-llm`
- `/web-llm/embed`

对应头包括：

- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

这是为了满足浏览器侧模型运行环境要求。

### 6.3 推理实现特点

`runtime.js` 的设计重点：

- 动态导入 `@huggingface/transformers`
- 使用浏览器缓存
- 模型运行设备指定为 `webgpu`
- 首轮做 warmup
- 流式输出 token 与推理阶段
- 把站点上下文拼入对话，形成“站内问答”体验

这说明 `web-llm` 不是调用服务端 OpenAI/第三方 API，而是本地模型推理页面。

## 7. 运行时模型

这个项目同时混用了三种运行环境：

### 7.1 Next.js 页面运行时

多数页面是标准 App Router 页面，偏静态或半静态渲染。

例如：

- 首页 `force-static`
- 文章详情 `force-static`
- sitemap 使用 `revalidate = 3600`

说明内容页优先走静态化或 ISR 风格，以提升加载和 SEO。

### 7.2 Cloudflare Edge 运行时

认证与 API 明确声明了：

- `export const runtime = 'edge'`
- `export const dynamic = 'force-dynamic'`

这类接口依赖：

- Cloudflare Pages Functions
- `@cloudflare/next-on-pages`
- D1 binding

### 7.3 浏览器本地运行时

`web-llm` 的核心逻辑在客户端浏览器执行，依赖用户设备的：

- WebGPU
- 内存
- 浏览器缓存

所以这是“前端页面 + Edge API + Browser AI Runtime”三层并存的架构。

## 8. 部署架构

部署配置由 `wrangler.toml` 和 npm scripts 共同体现：

- 本地开发：`next dev`
- 标准构建：`next build`
- Cloudflare Pages 构建：`npm run pages:build`

关键部署特征：

- 通过 `@cloudflare/next-on-pages` 适配 Next.js 到 Cloudflare Pages
- `pages_build_output_dir = ".vercel/output/static"`
- 使用 `nodejs_compat`
- 通过 `[[d1_databases]]` 绑定 `DB`

说明项目不是部署到 Vercel，而是以 Cloudflare Pages 为主目标平台。

## 9. 中间件与路由治理

`middleware.js` 目前职责很轻，只处理少量历史路径重定向：

- `/weekly` -> `/diary`
- `/articles/diary-self-reflection` -> `/diary`

说明当前中间件没有承担鉴权、AB 实验、地区路由等复杂职责，只做兼容性跳转。

## 10. 当前架构特点总结

这个项目的技术架构可以概括为：

### 优点

- 用 App Router 统一页面、布局和 API，结构清晰。
- 内容站部分偏静态化，对 SEO 友好。
- Cloudflare Edge + D1 成本较低，适合个人站。
- `web-llm` 形成差异化能力，不依赖服务端推理成本。
- 认证方案已针对 Cloudflare 场景做定制。

### 现状与注意点

- 仓库里存在遗留实现：`NextAuth` 相关文件、`better-sqlite3` 留言存储。
- 内容数据直接写在代码里，维护简单，但扩展到大量内容时会变重。
- `web-llm` 对浏览器环境要求高，不适合所有设备。
- 部分能力明显依赖 Cloudflare 运行时，本地或其他平台迁移时要补适配层。

## 11. 一句话架构结论

这是一个以 `Next.js App Router` 为核心、部署在 `Cloudflare Pages` 上的个人内容与 AI 体验站：内容页偏静态化，交互能力走 Edge API，留言数据落 D1，登录使用自定义 GitHub OAuth，`/web-llm` 则把浏览器本地模型推理作为站点的差异化能力。
