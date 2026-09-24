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
    description: '围绕 Agent、开源协作与开发工具链的代表性工程成果。',
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
    role: '个人门户 / 项目总入口',
    summary: '把个人主页、项目入口、账号体系、燃币和工具能力收束到同一个长期运行的网站。',
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
]

export {
  BROWSER_EXTENSION_WORK_ITEMS,
  DESKTOP_APP_WORK_ITEMS,
} from './downloadItems'

export const WORK_ITEMS = [
  ...PRODUCT_WORK_ITEMS,
  ...AI_EXPERIMENT_WORK_ITEMS,
].sort((a, b) => (b.priority || 0) - (a.priority || 0))

export const FEATURED_WORK_ITEM_IDS = ['blogger-alliance', 'syncblog', 'webhp']

export const AI_PROJECT_WORK_ITEMS = WORK_ITEMS.filter((item) =>
  item.type === 'ai-engineering'
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
