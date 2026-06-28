/** 旧 /agent-ops/* → /admin/* 映射（middleware 301 用） */
export const ADMIN_LEGACY_REDIRECTS = {
  '/agent-ops': '/admin',
  '/agent-ops/nav-admin': '/admin/nav',
  '/agent-ops/db-admin': '/admin/db',
  '/agent-ops/share-admin': '/admin/share',
  '/agent-ops/ops-console': '/admin/ops',
  '/agent-ops/project-portfolio': '/admin/portfolio',
}

/** admin.2aran.com 允许的路径前缀 */
export const ADMIN_HOST = 'admin.2aran.com'
export const ADMIN_HOST_ALLOW_PREFIXES = [
  '/admin',
  '/api/admin',
  '/api/private-records',
  '/login',
  '/register',
  '/api/auth',
  '/api/me',
]

/**
 * 后台导航注册表（分组结构）。
 *
 * 约定：
 *  - 这个模块被 middleware.js（Edge 运行时）引用，所以 **只能放纯数据**，
 *    `icon` 存字符串 key，真正的 React 组件映射在 lib/adminIcons.jsx。
 *  - 加新功能：往对应分组的 items 里加一条即可，sidebar / dashboard 会自动渲染。
 *  - badgeKey：对应 /api/admin/overview 返回里的计数字段（可选）。
 */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'overview',
    label: '',
    items: [
      {
        href: '/admin',
        label: '后台总览',
        shortLabel: '总览',
        icon: 'dashboard',
        desc: '状态、近期变更与快捷操作',
      },
    ],
  },
  {
    id: 'content',
    label: '内容',
    items: [
      {
        href: '/admin/articles',
        label: '文章编辑器',
        shortLabel: '文章',
        icon: 'articles',
        desc: '在线撰写、保存草稿并发布精选文章',
      },
      {
        href: '/admin/portfolio',
        label: 'AI 项目管理台',
        shortLabel: '项目',
        icon: 'portfolio',
        desc: '项目治理 / 整合路线图 / Codex 工作区归化',
      },
      {
        href: '/admin/research-style',
        label: '调研风格模版',
        shortLabel: '风格',
        icon: 'researchStyle',
        desc: '调研类内容历代分寸 / 措辞快照（v0 → 当前生效版）',
      },
      {
        href: '/admin/model-dispatch',
        label: 'Agent 协同测试',
        shortLabel: '协同',
        icon: 'modelDispatch',
        desc: '多代码模型选型 / 审计 / 策略迭代闭环',
      },
      {
        href: '/admin/deepseek-tasks',
        label: 'LLM API 任务管理',
        shortLabel: 'LLM',
        icon: 'deepseekTasks',
        desc: '调用记录 / Token / 规划审阅 / 状态管理',
      },
      {
        href: '/admin/content-weekly',
        label: '数据中心',
        shortLabel: '数据中心',
        icon: 'analytics',
        desc: '自建阅读统计：调研 / 资料 / 灵感被读 + 被赞 + 周趋势',
      },
    ],
  },
  {
    id: 'workbench',
    label: '分析工作台',
    items: [
      {
        href: '/public-opinion',
        label: '舆情分析',
        shortLabel: '舆情',
        icon: 'publicOpinion',
        desc: '公开内容采集 · 热点聚合 · 情绪与立场研判工作台',
      },
      {
        href: '/stock-analysis',
        label: '交易分析',
        shortLabel: '交易',
        icon: 'stockAnalysis',
        desc: '多标的 · 分钟级永续合约交易分析快照库',
      },
    ],
  },
  {
    id: 'access',
    label: '用户与访问',
    items: [
      {
        href: '/admin/users',
        label: '用户管理',
        shortLabel: '用户',
        icon: 'users',
        badgeKey: 'users',
        desc: '注册用户目录 / 角色与封禁（member / trusted / blocked）',
      },
      {
        href: '/admin/points',
        label: '燃币管理',
        shortLabel: '燃币',
        icon: 'ranbi',
        desc: '账户余额概览 / 资源门槛设置 / 手动增减燃币',
      },
      {
        href: '/admin/nav',
        label: '菜单权限管理',
        shortLabel: '菜单',
        icon: 'nav',
        desc: '设置每个菜单项对谁可见（public / authed / owner）',
      },
      {
        href: '/admin/share',
        label: '加密分享管理',
        shortLabel: '分享',
        icon: 'share',
        desc: 'E2E 加密的家庭文档分享链接',
      },
    ],
  },
  {
    id: 'system',
    label: '系统',
    items: [
      {
        href: '/admin/db',
        label: '数据库管理',
        shortLabel: '数据库',
        icon: 'database',
        desc: 'D1 状态 / 表统计 / 迁移检查',
      },
      {
        href: '/admin/ops',
        label: '自动化控制台',
        shortLabel: 'Ops',
        icon: 'ops',
        desc: '站内自动化入口 / owner-only 控制台',
      },
    ],
  },
  {
    id: 'private',
    label: '私域',
    items: [
      {
        href: '/admin/long-compass',
        label: '长期罗盘',
        shortLabel: '罗盘',
        icon: 'compass',
        desc: '加密私域 · 资产 / 复盘 / 行动框架',
      },
    ],
  },
]

/**
 * 规划中模块：只占位、不创建路由（避免 404）。
 * 以后填功能时，把条目从这里移到对应分组的 items 并加上路由即可。
 */
export const ADMIN_PLANNED = [
  { id: 'analytics', label: '分析 / 统计', icon: 'analytics', desc: 'PV / 留存 / 来源看板' },
  { id: 'audit', label: '通知 / 审计日志', icon: 'audit', desc: '操作日志、登录记录、告警' },
  { id: 'settings', label: '站点设置', icon: 'settings', desc: 'SEO / 元信息 / 备份 / 功能开关' },
  { id: 'integrations', label: '集成 / API keys', icon: 'integrations', desc: '外部服务凭证、Webhook、定时任务' },
]

/** 拍平后的控制台清单（不含总览）——兼容旧消费者与遍历需求 */
export const ADMIN_CONSOLE_ITEMS = ADMIN_NAV_GROUPS.filter((group) => group.id !== 'overview').flatMap(
  (group) => group.items
)

/** 含总览的完整导航项（拍平）——供面包屑 / active 匹配用 */
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items)

/** 主站私有工具：Dashboard 聚合入口，不迁入 admin 子域 */
export const ADMIN_PRIVATE_TOOL_LINKS = [
  { href: '/voice-tasks', label: '语音记事', desc: '随手说一段，落到文字' },
  { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', desc: '日常 / 习惯 / 家庭节奏' },
  { href: '/context-memory', label: '上下文记忆', desc: '工作记忆架构与快照' },
]

export function isAdminHostPathAllowed(pathname) {
  return ADMIN_HOST_ALLOW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** active 路径匹配：/admin 仅精确命中，其余允许子路径 */
export function isActiveAdminPath(pathname, href) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** 由当前路径解析出命中的导航项（找不到回落到总览） */
export function resolveActiveAdminItem(pathname) {
  const path = pathname || '/admin'
  return ADMIN_NAV_ITEMS.find((item) => isActiveAdminPath(path, item.href)) || ADMIN_NAV_ITEMS[0]
}
