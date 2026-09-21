import ShowcaseDirectory from '../components/ShowcaseDirectory'

export const dynamic = 'force-static'

export const metadata = {
  title: '能力集',
  description: '集中查看可复用的 Skill、可连接的 MCP 服务、Prompt 模板与 WorkBuddy 能力包。',
  keywords: ['能力集', 'Skill', 'MCP', 'Prompt', 'AI Agent', 'WorkBuddy'],
  alternates: { canonical: '/capabilities' },
}

// 三个展示集合共用 ShowcaseDirectory；能力集沿用工具集的紧凑目录布局。
// 每张卡片指向现有完整内容页，保留详情、配置和旧链接。
const CATEGORIES = [
  { id: 'skill', title: 'Skill', description: '可安装、可复用的任务方法与工作流。' },
  { id: 'mcp', title: 'MCP', description: '可连接的数据与工具服务。' },
  { id: 'prompt', title: 'Prompt', description: '可复制、可检验的任务模板。' },
  { id: 'publishing', title: 'WorkBuddy', description: '可下载的 Skill 与 MCP 能力包。' },
]

const VISUALS = {
  skill: {
    eyebrow: 'DO', icon: 'brain',
    cover: 'from-[#e2e6f2] via-[#f1f1f7] to-[#e8dff1] text-[#4f5876] dark:from-[#1a2438] dark:via-[#202535] dark:to-[#30243c] dark:text-[#c5cbea]',
  },
  mcp: {
    eyebrow: 'CONNECT', icon: 'cpu',
    cover: 'from-[#dce5f0] via-[#ecf0ee] to-[#e1eadc] text-[#405b6d] dark:from-[#172a3c] dark:via-[#1d2b2c] dark:to-[#263522] dark:text-[#b9d0de]',
  },
  prompt: {
    eyebrow: 'DESCRIBE', icon: 'code',
    cover: 'from-[#eee5ca] via-[#f6f1df] to-[#e5dcc5] text-[#69582f] dark:from-[#332b18] dark:via-[#292719] dark:to-[#38311f] dark:text-[#e0cc94]',
  },
  publishing: {
    eyebrow: 'PUBLISH', icon: 'download',
    cover: 'from-[#dcece8] via-[#edf4eb] to-[#f2e7cf] text-[#315c56] dark:from-[#14312f] dark:via-[#1e2c29] dark:to-[#332b1d] dark:text-[#b7d9d1]',
  },
}

const ITEMS = [
  {
    id: 'skill-center', title: 'Skill 中心', href: '/skill-center', category: 'skill', categoryLabel: 'Skill',
    coverLabel: '任务方法', meta: ['Skill'], summary: '浏览可复用的任务能力、工作流和安装说明。',
    tags: ['智能体', '工作流', '安装'], footerLabel: '方法与执行规范', metricLabel: '查看 Skill',
  },
  {
    id: 'mcp-center', title: 'MCP 中心', href: '/mcp-center', category: 'mcp', categoryLabel: 'MCP',
    coverLabel: '服务连接', meta: ['MCP'], summary: '查看公开服务、本地 Demo、连接配置和权限边界。',
    tags: ['连接器', '服务', 'OAuth'], footerLabel: '数据与工具连接', metricLabel: '查看服务',
  },
  {
    id: 'prompt-center', title: 'Prompt 中心', href: '/prompt-center', category: 'prompt', categoryLabel: 'Prompt',
    coverLabel: '任务模板', meta: ['Prompt'], summary: '复制有明确输入、输出和验收要求的任务模板。',
    tags: ['提示词', '模板', '任务'], footerLabel: '表达与验收', metricLabel: '查看模板',
  },
  {
    id: 'workbuddy-publish-center', title: 'WorkBuddy 能力包', href: '/workbuddy-publish-center', category: 'publishing', categoryLabel: 'WorkBuddy',
    coverLabel: '能力包', meta: ['WorkBuddy'], summary: '浏览适用于 WorkBuddy 的 Skill 与 MCP 能力包，查看用途、来源和下载状态。',
    tags: ['WorkBuddy', 'Skill', 'MCP'], footerLabel: '安装与下载', metricLabel: '查看能力包',
  },
]

const CONFIG = {
  eyebrow: 'Capabilities', title: '能力集',
  description: '可复用的方法、可连接的服务和可复制的任务模板集中在这里。按能力类型查找，再进入对应页面使用或配置。',
  countLabel: '个入口', filterAriaLabel: '筛选能力集', searchPlaceholder: '搜索能力、类型或用途',
  resultTitle: '全部能力', actionLabel: '查看详情', layout: 'catalog',
  analyticsSurface: 'capability_directory', analyticsEvent: 'capability_open', destinationKind: 'capability',
}

export default function CapabilitiesPage() {
  return <ShowcaseDirectory items={ITEMS} categories={CATEGORIES} visuals={VISUALS} config={CONFIG} />
}
