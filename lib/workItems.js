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
    id: 'openclaw-pr-90517',
    title: 'OpenClaw PR #90517',
    href: 'https://github.com/openclaw/openclaw/pull/90517',
    type: 'ai-engineering',
    status: 'shipped',
    role: '开源贡献 / Gateway 修复',
    summary:
      '贡献并合并到 openclaw:main：修复 web login 缺少外部插件时的提示路径，让错误信息能给出官方 external plugin 安装或 openclaw doctor --fix 指引。',
    tags: ['Open Source', 'OpenClaw', 'Gateway', 'Merged PR'],
    domains: ['github.com/openclaw/openclaw'],
    actionLabel: '查看合并 PR',
    priority: 92,
  },
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

export const DESKTOP_APP_WORK_ITEMS = [
  {
    id: '2aran-desktop',
    title: '2aran 桌面应用',
    href: '/resources/2aran-desktop',
    type: 'desktop-app',
    status: 'building',
    role: 'Windows / macOS 桌面客户端',
    summary: '面向 Windows 和 macOS 的桌面应用入口，后续承接站内工具、资源领取、通知和本地工作流。',
    tags: ['Desktop App', 'Windows', 'macOS'],
    platforms: ['Windows', 'macOS'],
    actionLabel: '查看下载',
    download: false,
    priority: 88,
  },
]

export const WORK_ITEMS = [
  ...PRODUCT_WORK_ITEMS,
  ...AI_EXPERIMENT_WORK_ITEMS,
].sort((a, b) => (b.priority || 0) - (a.priority || 0))

export const FEATURED_WORK_ITEM_IDS = ['blogger-alliance', 'syncblog', 'openclaw-pr-90517', 'webhp']

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
