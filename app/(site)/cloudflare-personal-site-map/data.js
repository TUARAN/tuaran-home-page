export const SHARE_COPY = {
  title: 'Cloudflare 开发者平台选型地图 · 2aran.com 个人站该用哪个',
  lead: '对照 tuaran-home-page 的真实代码与 wrangler 配置：已用 Pages + D1；R2 暂不需要；KV / DO / Workers AI 大多可跳过。带数据流图、产品判定表与 R2 触发规则。',
  full: '继续 Pages + D1 + Git 静态资源即可。只有出现用户上传、大文件、不 deploy 发内容时再绑 R2。',
}

export const VERDICT_META = {
  have: { label: '已用', tone: 'success' },
  use: { label: '推荐', tone: 'info' },
  later: { label: '以后再说', tone: 'warning' },
  skip: { label: '暂不需要', tone: 'neutral' },
}

export const VERDICT_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'have', label: '已用' },
  { id: 'later', label: '以后再说' },
  { id: 'skip', label: '暂不需要' },
]

export const VERDICT_COUNTS = [
  { label: '已用', count: 3, verdict: 'have' },
  { label: '以后再说', count: 3, verdict: 'later' },
  { label: '暂不需要', count: 14, verdict: 'skip' },
]

export const SITE_FACTS = [
  { label: '部署', value: 'Cloudflare Pages + Functions' },
  { label: '动态数据', value: 'D1（留言 / 评论 / 用户 / 短链等）' },
  { label: '内容与静态资源', value: 'Git + public/（约 8.5MB）' },
  { label: '默认语言', value: '边缘 Middleware 读 cf-ipcountry：中国大陆→中文，海外→英文' },
  { label: 'AI 体验', value: '浏览器 WebGPU（不进 Cloudflare AI）' },
]

export const CORE_STACK = [
  {
    layer: '入口 & 托管',
    product: 'Pages',
    role: 'Next.js SSR、静态资源 CDN、Functions 宿主',
    verdict: 'have',
    note: '项目主战场，wrangler.toml 已配置',
  },
  {
    layer: '边缘计算',
    product: 'Workers / Functions',
    role: 'API 路由、OAuth、Edge Session、Middleware',
    verdict: 'have',
    note: 'next-on-pages 把 app/api/* 与 middleware.js 跑在边缘；中间件用 cf-ipcountry 定默认语言 + 域名/路径重定向',
  },
  {
    layer: '关系型数据',
    product: 'D1',
    role: '结构化数据 + 小密文（shared_notes 等）',
    verdict: 'have',
    note: 'binding = DB，单库离 10GB 上限还很远',
  },
]

export const STORAGE_PRODUCTS = [
  {
    product: 'D1',
    type: 'SQL（SQLite）',
    personalUse: '留言、评论、点赞、短链、邮箱注册、PV 统计',
    verdict: 'have',
  },
  {
    product: 'R2',
    type: '对象存储（S3 兼容）',
    personalUse: '用户上传、音频、大附件、动态媒体库',
    verdict: 'later',
  },
  {
    product: 'KV',
    type: '键值缓存',
    personalUse: '全站配置缓存、feature flag',
    verdict: 'skip',
  },
  {
    product: 'Durable Objects',
    type: '强一致有状态',
    personalUse: '实时聊天室、WebSocket Agent、多人协作',
    verdict: 'skip',
  },
  {
    product: 'Queues',
    type: '异步队列',
    personalUse: '批量邮件、异步转码、离线任务',
    verdict: 'skip',
  },
  {
    product: 'Hyperdrive',
    type: '外部 Postgres 加速',
    personalUse: '已有 D1，无需外部 DB',
    verdict: 'skip',
  },
]

export const AI_PRODUCTS = [
  {
    product: 'Workers AI',
    role: '边缘推理 Llama / Qwen 等',
    verdict: 'skip',
    reason: '/web-llm 已在浏览器本地跑模型',
  },
  {
    product: 'AI Gateway',
    role: '多模型路由、缓存、限流',
    verdict: 'skip',
    reason: '没有服务端 LLM 代理需求',
  },
  {
    product: 'Vectorize',
    role: '向量检索 / RAG',
    verdict: 'skip',
    reason: '调研文走 Git Markdown，无向量库',
  },
  {
    product: 'Agents SDK + DO',
    role: '有状态 Agent、MCP、WebSocket',
    verdict: 'later',
    reason: '若做服务端 Agent 再考虑',
  },
]

export const PLATFORM_PRODUCTS = [
  {
    product: 'Turnstile',
    role: '人机验证',
    verdict: 'later',
    reason: '已有 D1 限流；若垃圾注册增多可加',
  },
  {
    product: 'Email Routing',
    role: '域名邮件转发',
    verdict: 'skip',
    reason: '注册验证码走 Resend，不是 CF Email',
  },
  {
    product: 'Images',
    role: '图片变换 / 压缩 CDN',
    verdict: 'skip',
    reason: 'public/ 很小；调研配图走 Unsplash',
  },
  {
    product: 'Stream',
    role: '视频托管',
    verdict: 'skip',
    reason: '站点无视频业务',
  },
  {
    product: 'Tunnel',
    role: '内网穿透',
    verdict: 'skip',
    reason: '站点已公网托管，非本地服务暴露',
  },
  {
    product: 'Browser Rendering',
    role: 'Headless Chrome',
    verdict: 'skip',
    reason: '无爬虫 / 截图自动化需求',
  },
  {
    product: 'Workflows',
    role: '长任务编排',
    verdict: 'skip',
    reason: '无多步持久工作流',
  },
  {
    product: 'Analytics Engine',
    role: '时序分析',
    verdict: 'skip',
    reason: 'research PV 已存 D1，量级够轻',
  },
]

export const STORAGE_COMPARE = [
  {
    name: 'D1',
    verdict: 'have',
    store: '行/列、SQL 查询、小文本密文',
    site: '已用：stomps、comments、shared_notes…',
    avoid: '别放：图片、视频、大 PDF',
  },
  {
    name: 'R2',
    verdict: 'later',
    store: 'S3 兼容对象存储，出流量免费',
    site: '适合：用户上传、音频、动态媒体库',
    avoid: '现在没绑，因为没有任何上传 API',
  },
  {
    name: 'KV',
    verdict: 'skip',
    store: '全球键值缓存，最终一致',
    site: '适合：配置、A/B、短 TTL 缓存',
    avoid: 'D1 已够轻；除非读极多且要省 D1 读次数',
  },
]

export const TRIGGER_RULES = [
  {
    trigger: '评论 / 留言要附图、用户上传头像',
    action: '加 R2；D1 只存元数据（key、owner、时间）',
  },
  {
    trigger: '语音任务存 mp3/wav 原音',
    action: 'R2 存音频；D1 存转写文本和索引',
  },
  {
    trigger: '调研文改成后台发布、不 deploy 就更新',
    action: 'R2 存 Markdown + 图片；可选 KV 做列表缓存',
  },
  {
    trigger: '要做服务端 Chat Agent / MCP',
    action: 'Agents SDK + Durable Objects；R2 可选存附件',
  },
  {
    trigger: 'D1 单条密文 > 几百 KB',
    action: '大 blob 迁 R2，D1 留 slug + envelope 元数据',
  },
  {
    trigger: '垃圾注册 / 刷接口明显增多',
    action: 'Turnstile + 现有 D1 限流双保险',
  },
]

export const MIN_STACK = ['Pages', 'Functions', 'Middleware', 'D1', 'Git 内容', 'Resend', 'GitHub OAuth']

export const SKIP_STACK = ['R2', 'KV', 'Durable Objects', 'Workers AI', 'Vectorize', 'Queues', 'Hyperdrive']

export const RELATED_LINKS = [
  {
    href: '/articles/research/topics/cloudflare-d1-vs-supabase',
    label: 'Cloudflare D1 vs Supabase',
    note: '平台选型',
  },
  {
    href: '/articles/research/topics/resend-email-otp-cloudflare-d1',
    label: 'Resend + D1 Auth',
    note: '本站 Auth 落地',
  },
  {
    href: '/articles/research/topics/2aran-owner-auth-practice',
    label: '2aran 私有鉴权',
    note: 'owner session',
  },
  {
    href: '/platform-framework-pairs',
    label: '平台 × 框架三极格局',
    note: '多维页面',
  },
]
