export const TOOL_TYPE_META = [
  {
    id: 'direct',
    title: '可直接使用',
    titleEn: 'Ready to Use',
    description: '站内已经可以打开体验的小工具和互动页面。',
  },
  {
    id: 'extension',
    title: '插件与下载',
    titleEn: 'Extensions & Downloads',
    description: '可下载安装到本地环境的轻量工具。',
  },
  {
    id: 'ai-dev',
    title: 'AI 与开发工具',
    titleEn: 'AI & Dev Tools',
    description: '围绕 AI 工程、开发者工作流和工具链的入口。',
  },
  {
    id: 'index',
    title: '工具索引',
    titleEn: 'Tool Indexes',
    description: '按主题整理的外部工具、开发资源与选型地图。',
  },
]

export const TOOL_STATUS_META = {
  live: '可用',
  external: '外部',
  index: '索引',
  experiment: '实验',
}

export const TOOL_ITEMS = [
  {
    id: 'x-mutual-cleaner',
    title: 'X 互关清理助手',
    href: '/resources/x-mutual-cleaner-extension',
    type: 'extension',
    status: 'live',
    summary: 'Chrome 扩展：在 X Following 页面扫描没有回关你的账号，由用户确认后批量取消关注。',
    tags: ['Chrome 扩展', 'X/Twitter', '本地运行'],
    featured: true,
    priority: 100,
  },
  {
    id: 'short-link',
    title: '站内转短',
    href: '/works#site-tools',
    type: 'direct',
    status: 'live',
    summary: '把长链接转换成 2aran.com 短链，登录后可以保留自己的历史记录。',
    tags: ['短链', '登录可用', 'D1'],
    featured: true,
    priority: 96,
  },
  {
    id: 'web-llm',
    title: '端侧大模型实验台',
    href: '/web-llm',
    type: 'ai-dev',
    status: 'experiment',
    summary: '浏览器端运行大模型的实验页面，用来观察 WebGPU、端侧推理和前端 AI 运行时。',
    tags: ['WebGPU', 'Browser LLM', '端侧推理'],
    featured: true,
    priority: 92,
  },
  {
    id: 'syncblog',
    title: 'AI 分发大师',
    href: 'https://syncblog.cn',
    type: 'direct',
    status: 'external',
    summary: '一次创作，多平台同步分发，把重复发布流程交给 Agent。',
    tags: ['内容分发', 'Agent', '外部产品'],
    featured: true,
    priority: 90,
  },
  {
    id: 'skill-center',
    title: 'Skill 中心',
    href: '/skill-center',
    type: 'ai-dev',
    status: 'live',
    summary: '模型与智能体能力货架，集中展示可复用的技能、提示词和工作流模块。',
    tags: ['Skill', 'Agent', '工作流'],
    featured: true,
    priority: 88,
  },
  {
    id: 'toolkit-hub',
    title: '代码矿工',
    href: 'https://toolkit-hub.pages.dev/',
    type: 'ai-dev',
    status: 'external',
    summary: '面向开发者的工具集合与能力聚合入口。',
    tags: ['开发工具', '工具集合', 'Pages'],
    priority: 84,
  },
  {
    id: 'prompt-engineering',
    title: '提示词工程',
    href: 'https://awesome-prompt-seven.vercel.app/',
    type: 'ai-dev',
    status: 'external',
    summary: '围绕提示词整理、沉淀与复用的轻量产品实验。',
    tags: ['Prompt', 'AI 工具', '复用'],
    priority: 82,
  },
  {
    id: 'eatwhat',
    title: '吃什么',
    href: '/eatwhat',
    type: 'direct',
    status: 'live',
    summary: '帮你快速决定这一顿吃什么，适合做生活小工具的轻量入口。',
    tags: ['生活工具', '随机决策'],
    priority: 78,
  },
  {
    id: 'agent-world-cup',
    title: 'Agent 世界杯',
    href: '/agent-world-cup',
    type: 'direct',
    status: 'live',
    summary: '2026 世界杯赛程、分组和资讯的互动页面，可继续扩展成活动型工具。',
    tags: ['活动页', '赛事', '互动'],
    priority: 74,
  },
  {
    id: 'wallpapers',
    title: '壁纸下载',
    href: '/resources/wallpapers',
    type: 'direct',
    status: 'live',
    summary: '站内可下载壁纸资源入口，适合沉淀为视觉资源工具。',
    tags: ['下载', '视觉资源'],
    priority: 70,
  },
  {
    id: 'ai-tools',
    title: 'AI 工具索引',
    href: '/bookmarks/ai-tools',
    type: 'index',
    status: 'index',
    summary: '实用 AI 工具、产品与服务推荐，作为工具库的外部工具索引。',
    tags: ['AI 工具', '产品推荐', '索引'],
    priority: 68,
  },
  {
    id: 'dev-resources',
    title: '开发资源索引',
    href: '/bookmarks/dev-resources',
    type: 'index',
    status: 'index',
    summary: '前端、后端、DevOps、Cloudflare 和 AI 工程相关的开发资源与工具链。',
    tags: ['开发资源', 'DevOps', 'Cloudflare'],
    priority: 66,
  },
  {
    id: 'cloudflare-map',
    title: 'Cloudflare 选型地图',
    href: '/cloudflare-personal-site-map',
    type: 'index',
    status: 'index',
    summary: '面向个人站和轻量产品的 Cloudflare 平台能力选型地图。',
    tags: ['Cloudflare', '架构选型', '地图'],
    priority: 62,
  },
]

export const FEATURED_TOOL_ITEMS = TOOL_ITEMS
  .filter((item) => item.featured)
  .sort((a, b) => b.priority - a.priority)

export function getToolItemsByType(type) {
  return TOOL_ITEMS
    .filter((item) => item.type === type)
    .sort((a, b) => b.priority - a.priority)
}

export function getToolTypeMeta(type) {
  return TOOL_TYPE_META.find((item) => item.id === type) || null
}
