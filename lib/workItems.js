import { ENGINEERING_WORKS } from './engineeringWorks'

export const WORK_TYPE_META = [
  {
    id: 'product',
    title: '对外产品',
    titleEn: 'Products',
    label: 'Product',
    description: '面向真实用户和商业协作的长期项目、品牌入口与服务载体。',
  },
  {
    id: 'ai-engineering',
    title: 'AI 工程',
    titleEn: 'AI Engineering',
    label: 'AI',
    description: '围绕 Agent、端侧推理、提示词与开发工具链的工程实验。',
  },
  {
    id: 'content-system',
    title: '内容系统',
    titleEn: 'Content Systems',
    label: 'System',
    description: '把写作、资料、出版和长期输入做成可持续运转的系统。',
  },
  {
    id: 'research-page',
    title: '研究页面',
    titleEn: 'Research Pages',
    label: 'Research',
    description: '带交互、数据和判断的富页面，不再只是文章。',
  },
  {
    id: 'tool-experiment',
    title: '工具实验',
    titleEn: 'Tool Experiments',
    label: 'Tool',
    description: '小型工具、视觉实验和可复用能力的验证场。',
  },
  {
    id: 'browser-extension',
    title: '浏览器扩展',
    titleEn: 'Browser Extensions',
    label: 'Extension',
    description: '可下载安装到浏览器里的轻量工具，优先解决高频网页工作流。',
  },
  {
    id: 'quant-analysis',
    title: '量化分析',
    titleEn: 'Quantitative Analysis',
    label: 'Quant',
    description: '基于数据驱动与量化方法的股票、市场与投资分析。',
  },
]

export const WORK_STATUS_META = {
  operating: '运营中',
  building: '打磨中',
  experiment: '实验',
  shipped: '已上线',
  archived: '归档',
}

export const DOMAIN_ASSETS = [
  {
    domain: 'tuaran.me',
    href: 'https://tuaran.me',
    role: '301 -> 2aran.com',
    related: '2aran.com',
  },
  {
    domain: 'bzlm.net',
    href: 'https://bzlm.net',
    role: '博主联盟备用域',
    related: 'blogger-alliance.cn',
  },
  {
    domain: 'qdzk.site',
    href: 'https://qdzk.site',
    role: '前端周刊历史/实验域',
    related: 'frontendnext.com',
  },
  {
    domain: 'frontend2aiagent.com',
    href: 'https://frontend2aiagent.com',
    role: '前端 -> Agent 转型叙事域',
    related: 'frontendnext.com',
  },
  {
    domain: 'iamvibecoder.cn',
    href: 'https://iamvibecoder.cn',
    role: 'Vibe Coding 品牌实验域',
    related: 'frontendnext.com',
  },
]

export const WORK_STRATEGY_PARAGRAPHS = [
  '「真正的壁垒，建立在对 Token 成本的极致抠门（Prompt Cache 优化）、对多状态机协同的流式调度（Coordinator 与 Fork 机制）、对用户意图容错与安全干预的平衡（YOLO Classifier），以及对宿主操作系统深度的文件流集成上。」',
]

export const PRODUCT_WORK_ITEMS = [
  {
    id: 'webhp',
    title: '2aran.com',
    href: '/',
    type: 'product',
    status: 'operating',
    role: '个人门户 / 内容系统 / 项目总览',
    summary: '个人网络日志、调研知识库、作品入口和长期创作内容的总入口。',
    tags: ['Personal Site', 'Knowledge Base', 'Cloudflare'],
    domains: ['2aran.com'],
    featured: true,
    priority: 98,
  },
  {
    id: 'blogger-alliance',
    title: '博主联盟',
    href: 'https://blogger-alliance.cn',
    type: 'product',
    status: 'operating',
    role: '产品 / 增长 / 协作网络',
    summary: '连接 AI 产品方与技术博主，把产品曝光、内容种草和真实转化放进长期协作网络。',
    tags: ['AI Growth', 'Community', 'Creator Network'],
    domains: ['blogger-alliance.cn', 'bzlm.net'],
    featured: true,
    priority: 100,
  },
  {
    id: 'frontend-next',
    title: '前端周看 Frontend Next',
    href: 'https://frontendnext.com',
    type: 'content-system',
    status: 'operating',
    role: '技术情报站 / 转型决策系统',
    summary: '面向前端工程师的 AI Agent、LLM 与工程趋势情报站，帮助读者做转型判断。',
    tags: ['Frontend', 'AI Agent', 'Newsletter'],
    domains: ['frontendnext.com', 'frontendweekly.cn'],
    featured: true,
    priority: 99,
  },
  {
    id: 'syncblog',
    title: 'AI分发大师',
    href: 'https://syncblog.cn',
    type: 'product',
    status: 'building',
    role: '内容同步 / 多平台分发智能体',
    summary: '一次创作，自动同步分发到多个平台，把多平台发布流程交给 Agent。',
    tags: ['Content Sync', 'Multi-platform', 'Agent'],
    domains: ['syncblog.cn'],
    featured: true,
    priority: 97,
  },
  {
    id: 'open-claude-code',
    title: 'Open Claude Code',
    href: 'https://openclaudecode.site/',
    type: 'content-system',
    status: 'operating',
    role: '学习站 / Agent 方法论拆解',
    summary: '系统拆解 Claude Code 的 Agent 循环、工具系统与多智能体协作。',
    tags: ['Claude Code', 'Agent Loop', 'Learning'],
    domains: ['openclaudecode.site'],
    priority: 90,
  },
  {
    id: 'matrixlink',
    title: 'MatrixLink',
    href: 'https://matrixlink.tech',
    type: 'product',
    status: 'operating',
    role: '公司官网 / 技术服务入口',
    summary: '企业品牌展示与技术服务介绍，承接工程咨询、内容服务和产品化协作。',
    tags: ['Company Site', 'Services'],
    domains: ['matrixlink.tech'],
    priority: 84,
  },
]

export const AI_EXPERIMENT_WORK_ITEMS = [
  {
    id: 'claude-code-unpacked',
    title: 'Claude Code Unpacked',
    href: 'https://ccunpacked-zh.pages.dev/',
    type: 'ai-engineering',
    status: 'shipped',
    role: 'Agent Loop 可视化',
    summary: '用交互式页面和动画拆解 Claude Code 的 agent loop、工具系统与多 Agent 编排。',
    tags: ['Agent Loop', 'Visualization'],
    priority: 88,
  },
  {
    id: 'web-llm',
    title: '端侧大模型实验台',
    href: '/web-llm',
    type: 'ai-engineering',
    status: 'experiment',
    role: 'WebGPU / Browser LLM',
    summary: '浏览器端运行大模型的工程实验，把端侧推理从概念验证落到可访问、可体验的页面。',
    tags: ['WebGPU', 'Browser LLM', 'Transformers.js'],
    priority: 87,
  },
  {
    id: 'ai-learning-pdfs',
    title: '安东尼学 AI',
    href: 'https://matrix-ai-pdfs.pages.dev/',
    type: 'content-system',
    status: 'experiment',
    role: 'AI 学习资料入口',
    summary: 'AI 学习资料整理与阅读入口，面向系统化学习与持续积累。',
    tags: ['AI Learning', 'Reading'],
    priority: 78,
  },
  {
    id: 'prompt-engineering',
    title: '提示词工程',
    href: 'https://awesome-prompt-seven.vercel.app/',
    type: 'ai-engineering',
    status: 'experiment',
    role: 'Prompt 沉淀与复用',
    summary: '围绕提示词整理、沉淀与复用的轻量产品实验。',
    tags: ['Prompt', 'Workflow'],
    priority: 74,
  },
  {
    id: 'code-miner',
    title: '代码矿工',
    href: 'https://toolkit-hub.pages.dev/',
    type: 'tool-experiment',
    status: 'experiment',
    role: '开发者工具集合',
    summary: '面向开发者的工具集合与能力聚合入口。',
    tags: ['Dev Tools', 'Toolkit'],
    priority: 70,
  },
  {
    id: 'banana-gallery',
    title: 'banana-gallery',
    href: 'https://banana-gallery.pages.dev/',
    type: 'tool-experiment',
    status: 'experiment',
    role: '视觉内容产品验证',
    summary: '轻量化的图片与内容展示实验，用于验证视觉内容产品的交互形态。',
    tags: ['Gallery', 'Visual'],
    priority: 68,
  },
  {
    id: 'stock-analysis',
    title: '股票量化分析',
    href: '/stock-analysis',
    type: 'quant-analysis',
    status: 'operating',
    role: '量化分析 / 数据驱动',
    summary: '基于技术指标与量化方法的股票分析，涵盖趋势判断、信号识别与风险可视化。',
    tags: ['Quant', 'Stock', 'Data Analysis'],
    priority: 76,
  },
]

export const BROWSER_EXTENSION_WORK_ITEMS = [
  {
    id: 'x-mutual-cleaner',
    title: 'X 互关清理助手',
    href: '/resources/x-mutual-cleaner-extension',
    type: 'browser-extension',
    status: 'shipped',
    role: 'Chrome 扩展 / X Following 列表清理',
    summary: '在 X Following 页面扫描没有显示 Follows you 的账号，由用户确认后批量取消关注，内置数量上限、间隔和停止按钮。',
    tags: ['Chrome Extension', 'X/Twitter', 'Social Ops'],
    domains: ['x.com', 'twitter.com'],
    actionLabel: '打开下载页',
    download: false,
    sourcePath: 'tools/x-mutual-cleaner-extension',
    priority: 86,
  },
]

function mapEngineeringCategoryToType(category) {
  if (category === 'ai-engineering') return 'ai-engineering'
  if (category === 'long-term-project') return 'content-system'
  return 'research-page'
}

export const RESEARCH_PAGE_WORK_ITEMS = ENGINEERING_WORKS.filter((work) => work.id !== 'web-llm').map((work, index) => ({
  id: work.id,
  title: work.title,
  href: work.href,
  type: mapEngineeringCategoryToType(work.category),
  status: work.badge === 'New' ? 'shipped' : 'operating',
  role: work.kind || '富页面',
  summary: work.summary,
  tags: [work.kind, work.badge].filter(Boolean),
  date: work.date,
  canvasId: work.canvasId,
  priority: 72 - index,
}))

export const WORK_ITEMS = [
  ...PRODUCT_WORK_ITEMS,
  ...AI_EXPERIMENT_WORK_ITEMS,
  ...BROWSER_EXTENSION_WORK_ITEMS,
  ...RESEARCH_PAGE_WORK_ITEMS,
].sort((a, b) => (b.priority || 0) - (a.priority || 0))

export const FEATURED_WORK_ITEM_IDS = ['blogger-alliance', 'frontend-next', 'syncblog']

export const AI_PROJECT_WORK_ITEMS = WORK_ITEMS.filter((item) =>
  ['ai-engineering', 'content-system', 'tool-experiment'].includes(item.type)
)

export function getWorkTypeMeta(type) {
  return WORK_TYPE_META.find((item) => item.id === type)
}

export function getWorkStatusLabel(status) {
  return WORK_STATUS_META[status] || status || '进行中'
}

export function getWorkItemsByType(type) {
  return WORK_ITEMS.filter((item) => item.type === type)
}
