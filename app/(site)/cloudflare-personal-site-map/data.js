export const SHARE_COPY = {
  title: 'AI 商业项目设计地图 · 2aran.com 四维对照',
  lead: '从技术架构、安全防御、运营飞轮、市场设计四个维度，对照 2aran.com 真实代码与 Cloudflare 实装，看一个 AI 商业项目该怎么设计、个人站目前处在什么位置。',
  full: '技术架构覆盖 4/4 核心层（接入+计算+数据+存储），安全防御覆盖 2/5 层（网络+应用有，数据+模型+合规缺），运营闭环覆盖 1/2（有数据采集，缺飞轮闭环），市场设计覆盖 0/4（个人站无商业设计）。Cloudflare 栈继续 Pages + D1 + R2。',
}

// ─── 四维度覆盖度 ────────────────────────────────────────

export const DIMENSION_SCORES = [
  {
    id: 'arch',
    label: '技术架构',
    score: '4/4',
    summary: '接入+计算+数据+存储齐全',
    color: '#4a6fa5',
  },
  {
    id: 'security',
    label: '安全防御',
    score: '2/5',
    summary: '网络+应用有，数据+模型+合规缺',
    color: '#8b5a1f',
  },
  {
    id: 'ops',
    label: '运营飞轮',
    score: '1/2',
    summary: '有数据采集，缺飞轮闭环',
    color: '#374d34',
  },
  {
    id: 'market',
    label: '市场设计',
    score: '0/4',
    summary: '个人站无商业设计',
    color: '#63655f',
  },
]

// ─── 技术架构四层对照 ────────────────────────────────────

export const TECH_ARCH_LAYERS = [
  { name: '接入层', items: [
    { component: 'Web / H5', site: 'Pages CDN', verdict: 'have' },
    { component: 'iOS / Android', site: '无', verdict: 'skip' },
    { component: 'Open API', site: '无', verdict: 'skip' },
    { component: 'SDK / Plugin', site: '无', verdict: 'skip' },
  ]},
  { name: '应用层', items: [
    { component: '对话引擎', site: 'Web-LLM（浏览器端）', verdict: 'have' },
    { component: 'RAG', site: '无', verdict: 'later' },
    { component: 'Agent 编排', site: '无', verdict: 'later' },
    { component: '工作流引擎', site: '无', verdict: 'skip' },
    { component: '权限 / 计费', site: 'GitHub OAuth + 签名 Cookie', verdict: 'have' },
    { component: '多租户', site: '无', verdict: 'skip' },
    { component: '审计日志', site: '无', verdict: 'skip' },
  ]},
  { name: '模型层', items: [
    { component: 'LLM 网关路由', site: '无（浏览器端直连 HuggingFace）', verdict: 'skip' },
    { component: 'Prompt 管理', site: '无', verdict: 'skip' },
    { component: '微调 / LoRA', site: '无', verdict: 'skip' },
    { component: '评测基准', site: '无', verdict: 'skip' },
  ]},
  { name: '基础设施层', items: [
    { component: '向量数据库', site: '无', verdict: 'skip' },
    { component: '对象存储', site: 'R2', verdict: 'have' },
    { component: '消息队列', site: '无', verdict: 'skip' },
    { component: '容器编排', site: 'Workers / Functions', verdict: 'have' },
    { component: '可观测性', site: 'Cloudflare Analytics', verdict: 'have' },
    { component: 'GPU 集群', site: '无（浏览器端 WebGPU）', verdict: 'skip' },
    { component: 'CDN / WAF', site: 'Cloudflare CDN', verdict: 'have' },
    { component: '密钥管理', site: 'Cloudflare 环境变量', verdict: 'have' },
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
    { component: '限流', site: 'D1 基础限流', verdict: 'later' },
    { component: '输入校验', site: 'API 层基础校验', verdict: 'have' },
    { component: 'CSP', site: 'next.config.js headers', verdict: 'have' },
  ]},
  { name: '数据安全', items: [
    { component: 'AES-256 at rest', site: 'D1/R2 平台级加密', verdict: 'later' },
    { component: '数据脱敏', site: '无', verdict: 'skip' },
    { component: 'DLP', site: '无', verdict: 'skip' },
    { component: '审计日志', site: '无', verdict: 'skip' },
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
    { stage: '用户交互', site: '留言(stomp) + PV 存 D1', need: '完整行为埋点', verdict: 'later' },
    { stage: '反馈标注', site: '无', need: '人工/自动标注管线', verdict: 'skip' },
    { stage: '模型迭代', site: '浏览器端推理，无迭代', need: 'A/B 测试 + 模型灰度', verdict: 'skip' },
    { stage: '体验提升', site: '偶尔手动更新', need: '数据驱动迭代', verdict: 'skip' },
  ]},
  { loop: '增长飞轮', items: [
    { stage: '种子用户', site: 'GitHub OAuth 用户', need: '目标人群获客', verdict: 'later' },
    { stage: '口碑传播', site: '社交分享按钮', need: '推荐体系 + 裂变机制', verdict: 'later' },
    { stage: '付费转化', site: '无', need: '计费系统 + 订阅管理', verdict: 'skip' },
    { stage: '再投入', site: '无', need: '收入反哺产品', verdict: 'skip' },
  ]},
]

export const OPS_METRICS = [
  { category: '产品指标', items: ['留存率', 'Token 消耗', '任务完成率', 'NPS'] },
  { category: '商业指标', items: ['ARPU', 'CAC', 'LTV', '毛利率'] },
]

// ─── 市场设计对照 ────────────────────────────────────────

export const MARKET_DESIGN = [
  { tier: 'C 端市场', desc: '免费工具 → 高级订阅', site: '无 C 端产品', verdict: 'skip' },
  { tier: 'SMB 市场', desc: 'API/SDK → 按量计费', site: '无 API 产品', verdict: 'skip' },
  { tier: 'B 端市场', desc: '私有部署 → 年度合同', site: '无 B 端方案', verdict: 'skip' },
]

export const PRICING_MODELS = [
  { model: '按量计费', desc: 'Token / API 调用 / 存储量', verdict: 'skip' },
  { model: '订阅制', desc: '月/年费 + 阶梯权益', verdict: 'skip' },
  { model: '混合模式', desc: '基础订阅 + 超额按量', verdict: 'skip' },
  { model: '效果计费', desc: '按完成任务 / 节省成本分成', verdict: 'skip' },
]

export const MARKET_ENTRY = [
  { stage: '垂直场景突破', desc: '选一个高价值垂直场景，做到极致', site: '/web-llm 是 AI 体验入口' },
  { stage: '横向能力扩展', desc: '从单场景扩展到多场景覆盖', site: '调研内容体系可复用' },
  { stage: '平台生态构建', desc: '开放 API / SDK，引入第三方', site: '暂未启动' },
  { stage: '全球化', desc: '多语言 / 多区域 / 多币种', site: 'Middleware 已有 i18n 雏形' },
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
  { label: '已用', count: 4, verdict: 'have' },
  { label: '以后再说', count: 2, verdict: 'later' },
  { label: '暂不需要', count: 14, verdict: 'skip' },
]

export const SITE_FACTS = [
  { label: '部署', value: 'Cloudflare Pages + Functions' },
  { label: '动态数据', value: 'D1（留言 / 评论 / 用户 / 短链等）' },
  { label: '媒体文件', value: 'R2（壁纸 / 可下载资源；D1 存元数据，文件走公开 R2 域名）' },
  { label: '内容与静态资源', value: 'Git + public/（约 8.6MB）' },
  { label: '默认语言', value: '边缘 Middleware 读 cf-ipcountry：中国大陆→中文，海外→英文' },
  { label: 'AI 体验', value: '浏览器 WebGPU（不进 Cloudflare AI）' },
  { label: '四维覆盖', value: '技术 4/4 · 安全 2/5 · 运营 1/2 · 市场 0/4' },
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
    role: '结构化数据 + 小密文（22 张表：留言/评论/用户/短链/语音/笔记等）',
    verdict: 'have',
    note: 'binding = DB，单库使用中；元数据指向 R2 对象',
  },
  {
    layer: '对象存储',
    product: 'R2',
    role: '壁纸/可下载文件；D1 存元数据，文件本体走公开 R2 域名',
    verdict: 'have',
    note: 'binding = MEDIA，前缀 downloads/；出流量免费',
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
    personalUse: '壁纸库、可下载文件；D1 存元数据，文件走公开域名',
    verdict: 'have',
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
    verdict: 'have',
    store: 'S3 兼容对象存储，出流量免费',
    site: '已用：壁纸/可下载资源（binding MEDIA，前缀 downloads/）',
    avoid: '别放：高频小块写入（SQL 查询适合 D1）',
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
    action: '扩展现有 R2 用途；D1 只存元数据（key、owner、时间）',
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

export const MIN_STACK = ['Pages', 'Functions', 'Middleware', 'D1', 'R2', 'Git 内容', 'Resend', 'GitHub OAuth']

export const SKIP_STACK = ['KV', 'Durable Objects', 'Workers AI', 'Vectorize', 'Queues', 'Hyperdrive']

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
