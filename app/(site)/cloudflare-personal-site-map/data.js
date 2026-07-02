export const SHARE_COPY = {
  title: 'Cloudflare 个人站技术地图 · 2aran.com 2026-07',
  lead: '把 2aran.com 最近一次 Cloudflare 架构优化摊开：Pages Worker 体积治理、public/admin/API 边界、D1/R2 数据分层、评论通知与内容索引，放回技术架构、安全防御、运营飞轮、市场设计四个维度里对照。',
  full: '2026-07 快照：技术架构仍覆盖接入、计算、数据、存储 4/4；安全从网络/应用扩到基础数据治理，约 3/5；运营从 PV 统计扩展到评论、通知、content_index 与社区入口，约 2/3；市场设计有燃币/赞助雏形但未形成产品化，约 1/4。Cloudflare 栈从“Pages + D1 + R2”推进到“公开 Pages Worker + 独立 admin + 轻 API Worker”的边界治理阶段。',
}

// ─── 四维度覆盖度 ────────────────────────────────────────

export const DIMENSION_SCORES = [
  {
    id: 'arch',
    label: '技术架构',
    score: '4/4',
    summary: 'Pages + Functions + D1 + R2，开始拆边界',
    color: '#4a6fa5',
  },
  {
    id: 'security',
    label: '安全防御',
    score: '3/5',
    summary: '网络/应用/基础数据治理已有',
    color: '#8b5a1f',
  },
  {
    id: 'ops',
    label: '运营飞轮',
    score: '2/3',
    summary: '评论/通知/content_index 已接入',
    color: '#374d34',
  },
  {
    id: 'market',
    label: '市场设计',
    score: '1/4',
    summary: '有燃币/赞助雏形，未产品化',
    color: '#63655f',
  },
]

// ─── 技术架构四层对照 ────────────────────────────────────

export const TECH_ARCH_LAYERS = [
  { name: '接入层', items: [
    { component: 'Web / H5', site: 'Pages CDN', verdict: 'have' },
    { component: 'iOS / Android', site: '无', verdict: 'skip' },
    { component: 'Open API', site: 'api.2aran.com 规划中，先收敛前台评论/通知/积分 API', verdict: 'later' },
    { component: 'SDK / Plugin', site: '无', verdict: 'skip' },
  ]},
  { name: '应用层', items: [
    { component: '对话引擎', site: 'Web-LLM（浏览器端）', verdict: 'have' },
    { component: 'RAG', site: '无', verdict: 'later' },
    { component: 'Agent 编排', site: '无', verdict: 'later' },
    { component: '工作流引擎', site: '内容同步、通知批处理后续可用 Workflows/Queues', verdict: 'later' },
    { component: '权限 / 计费', site: 'GitHub OAuth + 签名 Cookie + Ranbi 雏形', verdict: 'have' },
    { component: '多租户', site: '无', verdict: 'skip' },
    { component: '审计日志', site: '后台操作日志未系统化', verdict: 'later' },
  ]},
  { name: '模型层', items: [
    { component: 'LLM 网关路由', site: '浏览器 Web-LLM 为主；后台模型任务不进公开 Worker', verdict: 'later' },
    { component: 'Prompt 管理', site: '后台任务已有散点，未形成版本化 prompt registry', verdict: 'later' },
    { component: '微调 / LoRA', site: '无', verdict: 'skip' },
    { component: '评测基准', site: '无', verdict: 'skip' },
  ]},
  { name: '基础设施层', items: [
    { component: '向量数据库', site: '文章详情仍走构建期 Markdown；RAG 搜索后再考虑 Vectorize', verdict: 'later' },
    { component: '对象存储', site: 'R2：downloads/ 与 feed/ 大文件', verdict: 'have' },
    { component: '消息队列', site: '通知/邮件/内容索引异步化后再加', verdict: 'later' },
    { component: '容器编排', site: 'Pages Functions；public/admin/API 边界拆分中', verdict: 'have' },
    { component: '可观测性', site: 'Cloudflare Analytics + 构建体积/路由数记录', verdict: 'have' },
    { component: 'GPU 集群', site: '无（浏览器端 WebGPU）', verdict: 'skip' },
    { component: 'CDN / WAF', site: 'Cloudflare CDN', verdict: 'have' },
    { component: '密钥管理', site: 'Cloudflare 环境变量 / Secrets', verdict: 'have' },
  ]},
]

// ─── 安全防御五层对照 ────────────────────────────────────

export const SECURITY_LAYERS = [
  { name: '网络安全', items: [
    { component: 'TLS 1.3', site: 'Cloudflare 自动 TLS', verdict: 'have' },
    { component: 'WAF', site: 'Cloudflare 内置', verdict: 'have' },
    { component: 'DDoS 防护', site: 'Cloudflare L3/L4/L7', verdict: 'have' },
    { component: 'IP 白名单', site: '无', verdict: 'skip' },
  ]},
  { name: '应用安全', items: [
    { component: 'OAuth 2.0', site: 'GitHub OAuth + 签名 Cookie', verdict: 'have' },
    { component: 'RBAC', site: 'owner-only（AdminPageGate）', verdict: 'have' },
    { component: '限流', site: '评论/访客接口有 D1 基础限流，垃圾量上来再加 Turnstile', verdict: 'have' },
    { component: '输入校验', site: 'API 层基础校验', verdict: 'have' },
    { component: 'CSP', site: 'next.config.js headers', verdict: 'have' },
  ]},
  { name: '数据安全', items: [
    { component: 'AES-256 at rest', site: 'D1/R2 平台级加密', verdict: 'have' },
    { component: '数据脱敏', site: '公开展示字段和后台字段已分层，未做统一脱敏库', verdict: 'later' },
    { component: 'DLP', site: '无', verdict: 'skip' },
    { component: '审计日志', site: '后台拆出后应单独补操作审计', verdict: 'later' },
    { component: '备份', site: 'D1 导出 + Git 仓库', verdict: 'have' },
  ]},
  { name: '模型安全', items: [
    { component: 'Prompt 注入防御', site: '无（浏览器端推理）', verdict: 'skip' },
    { component: '越狱防护', site: '无', verdict: 'skip' },
    { component: '数据泄露防护', site: '无', verdict: 'skip' },
    { component: '幻觉监控', site: '无', verdict: 'skip' },
    { component: '模型水印', site: '无', verdict: 'skip' },
    { component: '对齐测试', site: '无', verdict: 'skip' },
  ]},
  { name: '合规框架', items: [
    { component: 'GDPR', site: '无', verdict: 'skip' },
    { component: '数据安全法', site: '无', verdict: 'skip' },
    { component: '算法备案', site: '无', verdict: 'skip' },
    { component: '隐私影响评估', site: '无', verdict: 'skip' },
  ]},
]

// ─── 运营飞轮对照 ────────────────────────────────────────

export const OPS_FLYWHEEL = [
  { loop: '数据飞轮', items: [
    { stage: '用户交互', site: '留言、评论、点赞、通知、社区最新评论、PV 存 D1', need: '完整行为埋点', verdict: 'have' },
    { stage: '反馈标注', site: '评论/点赞是弱反馈，尚未进入内容推荐', need: '人工/自动标注管线', verdict: 'later' },
    { stage: '模型迭代', site: '浏览器端推理，无迭代', need: 'A/B 测试 + 模型灰度', verdict: 'skip' },
    { stage: '体验提升', site: 'Worker 体积、评论入口、R2 视频等已由真实问题驱动优化', need: '数据驱动迭代', verdict: 'later' },
  ]},
  { loop: '增长飞轮', items: [
    { stage: '种子用户', site: 'GitHub/Google 登录用户 + 讨论中心', need: '目标人群获客', verdict: 'later' },
    { stage: '口碑传播', site: '社交分享、RSS、社区最新评论', need: '推荐体系 + 裂变机制', verdict: 'later' },
    { stage: '付费转化', site: '赞助和 Ranbi 雏形，未形成权益', need: '计费系统 + 订阅管理', verdict: 'later' },
    { stage: '再投入', site: '无', need: '收入反哺产品', verdict: 'skip' },
  ]},
]

export const OPS_METRICS = [
  { category: '产品指标', items: ['评论数', '通知点击', '社区回访', '文章跳转', 'PV'] },
  { category: '商业指标', items: ['赞助转化', 'Ranbi 消耗', '订阅意愿', '内容复访'] },
]

// ─── 市场设计对照 ────────────────────────────────────────

export const MARKET_DESIGN = [
  { tier: 'C 端市场', desc: '免费内容/工具 → 赞助/会员权益', site: '个人内容、Web-LLM、讨论中心已有入口', verdict: 'later' },
  { tier: 'SMB 市场', desc: 'API/SDK → 按量计费', site: 'api.2aran.com 仅规划为轻前台 API，不作为商业 API', verdict: 'skip' },
  { tier: 'B 端市场', desc: '私有部署 → 年度合同', site: '无 B 端方案', verdict: 'skip' },
]

export const PRICING_MODELS = [
  { model: '按量计费', desc: 'Token / API 调用 / 存储量；本站暂不开放商业 API', verdict: 'skip' },
  { model: '订阅制', desc: '月/年费 + 阶梯权益；可与 Ranbi/赞助结合', verdict: 'later' },
  { model: '混合模式', desc: '基础订阅 + 超额按量', verdict: 'skip' },
  { model: '效果计费', desc: '按完成任务 / 节省成本分成', verdict: 'skip' },
]

export const MARKET_ENTRY = [
  { stage: '垂直场景突破', desc: '选一个高价值垂直场景，做到极致', site: '/web-llm 是 AI 体验入口' },
  { stage: '横向能力扩展', desc: '从单场景扩展到多场景覆盖', site: '调研内容体系可复用' },
  { stage: '平台生态构建', desc: '开放 API / SDK，引入第三方', site: '先拆 api.2aran.com，只服务本站前台' },
  { stage: '全球化', desc: '多语言 / 多区域 / 多币种', site: 'Middleware 有 i18n 雏形；默认语言仍在边缘判断' },
]

// ─── 原有 Cloudflare 选型数据（保留） ──────────────────

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
  { label: '已用', count: 6, verdict: 'have' },
  { label: '以后再说', count: 9, verdict: 'later' },
  { label: '暂不需要', count: 7, verdict: 'skip' },
]

export const RECENT_UPDATES = [
  {
    date: '2026-07-02',
    title: 'Pages Worker 体积治理',
    detail: '删掉动态 next/og 路由，middleware 与前台 API 不再 import 完整文章 catalog；完整构建 Edge Function Routes 从 86 降到 83，估算 gzip 约 2.38MB。',
  },
  {
    date: '2026-07-02',
    title: '公开站点与后台边界拆分',
    detail: '新增 pages:build:public 构建脚本，临时排除 app/(admin) 与 app/api/admin；公开 Worker 路由降到 43，估算 gzip 约 1.25MB。',
  },
  {
    date: '2026-07-02',
    title: 'R2 承接 feed 大视频',
    detail: '灵感流机器人视频从本地 public 大文件迁到 R2 feed/ 前缀，避免 Pages 静态资源与仓库体积继续膨胀。',
  },
  {
    date: '2026-07-01',
    title: '讨论中心与通知链路',
    detail: '/community 从二维码介绍页改成讨论中心，展示最新评论并跳回原文章；通知、评论、点赞开始成为前台主功能。',
  },
]

export const SITE_FACTS = [
  { label: '部署', value: 'Cloudflare Pages + Functions；公开构建已准备 pages:build:public' },
  { label: 'Worker 边界', value: '完整构建 83 个 Edge Routes / 约 2.38MB；公开构建 43 个 Routes / 约 1.25MB' },
  { label: '后台拆分', value: '2aran.com /admin/* 已准备跳转 admin.2aran.com；独立后台部署待切换' },
  { label: '动态数据', value: 'D1（留言 / 评论 / 通知 / 用户 / 短链 / content_index 等）' },
  { label: '媒体文件', value: 'R2（downloads/ 壁纸和资源；feed/ 大视频；D1 存元数据或引用）' },
  { label: '内容与静态资源', value: 'Markdown 详情仍在构建期；标题/摘要/标签开始用 D1 content_index 解耦' },
  { label: '默认语言', value: '边缘 Middleware 读 cf-ipcountry：中国大陆→中文，海外→英文' },
  { label: 'AI 体验', value: '浏览器 WebGPU（不进 Cloudflare AI）' },
  { label: '四维覆盖', value: '技术 4/4 · 安全 3/5 · 运营 2/3 · 市场 1/4' },
]

export const WORKER_BUNDLE_METRICS = [
  { stage: '问题现场', routes: '86', packageSize: '> 3MiB', note: '后台、API、评论、通知、文章动态页都进入同一个 Pages Worker，触到免费计划边界。' },
  { stage: '第一批收束', routes: '83', packageSize: '~2.38MB gzip', note: '移除动态 OG 路由，前台 API 改用轻量 content key，不再拉完整 catalog。' },
  { stage: '公开构建', routes: '43', packageSize: '~1.25MB gzip', note: 'pages:build:public 排除后台页面与后台 API，贴着边界继续跑公开站。' },
]

export const RUNTIME_SURFACES = [
  {
    surface: '2aran.com',
    current: '公开内容、社区、少量前台 API 仍由 Pages 承载',
    next: '使用 pages:build:public 部署公开站点，避免 admin 代码进入访客 Worker',
    verdict: 'have',
  },
  {
    surface: 'admin.2aran.com',
    current: 'middleware 已准备 /admin/* 跳转；目录仍在同仓库',
    next: '单独 Cloudflare Pages/Worker 项目，绑定同一个 D1/R2，只给 owner 使用',
    verdict: 'later',
  },
  {
    surface: 'api.2aran.com',
    current: '评论、通知、积分等前台 API 仍主要是 Next route',
    next: '用 Hono 或原生 Worker 收敛成轻 API Worker，公开站只负责页面',
    verdict: 'later',
  },
  {
    surface: '内容系统',
    current: 'Markdown 详情仍在构建期，部分列表元数据进入 content_index',
    next: 'title/summary/tags/href 放 D1，正文按体积放 D1 或 R2，减少构建耦合',
    verdict: 'later',
  },
]

export const CORE_STACK = [
  {
    layer: '入口 & 托管',
    product: 'Pages',
    role: 'Next.js SSR、静态资源 CDN、公开站点宿主',
    verdict: 'have',
    note: '项目主战场；新增 pages:build:public 用于排除后台，避免公开 Worker 继续膨胀',
  },
  {
    layer: '边缘计算',
    product: 'Workers / Functions',
    role: '前台 API、OAuth、Edge Session、Middleware',
    verdict: 'have',
    note: 'next-on-pages 仍有运行时包装成本；短期靠 public build 贴边，长期拆 admin/API Workers',
  },
  {
    layer: '关系型数据',
    product: 'D1',
    role: '结构化数据 + 小密文 + 内容索引',
    verdict: 'have',
    note: 'binding = DB；留言、评论、通知、短链、content_index 等共用，元数据指向 R2 对象',
  },
  {
    layer: '对象存储',
    product: 'R2',
    role: '壁纸、下载资源、feed 大视频',
    verdict: 'have',
    note: 'binding = MEDIA；downloads/ 与 feed/ 前缀，D1/代码只保留 key 或 URL',
  },
]

export const STORAGE_PRODUCTS = [
  {
    product: 'D1',
    type: 'SQL（SQLite）',
    personalUse: '留言、评论、点赞、通知、短链、邮箱注册、PV、content_index',
    verdict: 'have',
  },
  {
    product: 'R2',
    type: '对象存储（S3 兼容）',
    personalUse: '壁纸库、可下载文件、feed 大视频；D1 存元数据或引用',
    verdict: 'have',
  },
  {
    product: 'KV',
    type: '键值缓存',
    personalUse: '全站配置缓存、feature flag、轻量内容列表缓存',
    verdict: 'later',
  },
  {
    product: 'Durable Objects',
    type: '强一致有状态',
    personalUse: '实时聊天室、WebSocket Agent、多人协作',
    verdict: 'later',
  },
  {
    product: 'Queues',
    type: '异步队列',
    personalUse: '批量邮件、异步转码、离线任务',
    verdict: 'later',
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
    verdict: 'later',
    reason: '如果后台模型任务和公开 AI 能力需要统一路由，再从 admin/API Worker 外挂',
  },
  {
    product: 'Vectorize',
    role: '向量检索 / RAG',
    verdict: 'later',
    reason: '文章 catalog 外置后，若做语义搜索或 RAG，再补向量索引',
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
    reason: 'feed 视频数量少，R2 直出已够；只有转码、试看、防盗链需求明显时再换 Stream',
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
    verdict: 'later',
    reason: '内容索引、通知汇总、RSS/邮件批处理可以后置到 Workflows',
  },
  {
    product: 'Analytics Engine',
    role: '时序分析',
    verdict: 'later',
    reason: '目前 PV/评论可存在 D1；若行为事件高频增长，再迁时序数据',
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
    verdict: 'have',
    store: 'S3 兼容对象存储，出流量免费',
    site: '已用：壁纸/可下载资源/feed 视频（binding MEDIA，前缀 downloads/、feed/）',
    avoid: '别放：高频小块写入（SQL 查询适合 D1）',
  },
  {
    name: 'KV',
    verdict: 'later',
    store: '全球键值缓存，最终一致',
    site: '适合：配置、A/B、短 TTL 内容列表缓存',
    avoid: 'content_index 刚落 D1，先不引入第二套读路径',
  },
]

export const TRIGGER_RULES = [
  {
    trigger: '评论 / 留言要附图、用户上传头像',
    action: '扩展现有 R2 用途；D1 只存元数据（key、owner、时间）',
  },
  {
    trigger: '语音任务存 mp3/wav 原音',
    action: 'R2 存音频；D1 存转写文本和索引',
  },
  {
    trigger: '调研文改成后台发布、不 deploy 就更新',
    action: 'title/summary/tags/href 进 D1 content_index；正文按体积放 D1 或 R2；可选 KV 做列表缓存',
  },
  {
    trigger: 'Pages Worker 再接近 3MiB',
    action: '继续拆 admin.2aran.com 与 api.2aran.com，公开站只保留页面和极少数读 API',
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

export const MIN_STACK = ['Pages', 'pages:build:public', 'Functions', 'Middleware', 'D1', 'content_index', 'R2', 'Resend', 'GitHub OAuth']

export const SKIP_STACK = ['Workers AI', 'Stream', 'Images', 'Hyperdrive', 'Browser Rendering']

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
