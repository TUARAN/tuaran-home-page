/** 旧 /agent-ops/* → /admin/* 映射（middleware 301 用） */
export const ADMIN_LEGACY_REDIRECTS = {
  '/agent-ops': '/admin',
  '/agent-ops/nav-admin': '/admin/nav',
  '/agent-ops/db-admin': '/admin/db',
  '/agent-ops/share-admin': '/admin/long-compass',
  '/agent-ops/ops-console': '/admin/ops',
  '/agent-ops/project-portfolio': '/admin/portfolio',
}

/** admin.2aran.com 允许的路径前缀 */
export const ADMIN_HOST = 'admin.2aran.com'
/** 主站 canonical host：admin 子域上的「主站页面」外链直接指向这里 */
export const CANONICAL_HOST = '2aran.com'
export const ADMIN_HOST_ALLOW_PREFIXES = [
  '/admin',
  '/api/admin',
  '/api/private-records',
  '/login',
  '/register',
  '/api/auth',
  '/api/me',
  '/data/memory',
]

/**
 * 后台导航注册表（分组结构）。
 *
 * 约定：
 *  - 这个模块被 middleware.js（Edge 运行时）引用，所以 **只能放纯数据**，
 *    `icon` 存字符串 key，真正的 React 组件映射在 lib/adminIcons.jsx。
 *  - 加新功能：往对应分组的 items 里加一条即可，sidebar / dashboard 会自动渲染。
 *  - children：一级菜单下的二级入口；分组 label 只作为视觉分隔标题。
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
    id: 'workspaces',
    label: '工作台',
    items: [
      {
        href: '/admin/content',
        label: '内容中心',
        shortLabel: '内容',
        icon: 'articles',
        desc: '写作、内容库、规范、阅读分析与 RSS 分发',
        activePaths: ['/admin/articles', '/admin/content-index', '/admin/recommendations', '/admin/quotes', '/admin/research-style', '/admin/content-taxonomy', '/admin/content-weekly', '/admin/rss-feeds', '/admin/engagement-bots'],
        children: [
          { href: '/admin/articles', label: '内容管理' },
          { href: '/admin/recommendations', label: '推荐管理' },
          { href: '/admin/quotes', label: '名言管理' },
          { href: '/admin/content-taxonomy', label: '分类管理' },
          { href: '/admin/content-weekly', label: '数据与反馈' },
          { href: '/admin/engagement-bots', label: '路过互动' },
          { href: '/admin/rss-feeds', label: 'RSS 与分发' },
        ],
      },
      {
        href: '/admin/projects',
        label: '项目与工程',
        shortLabel: '项目',
        icon: 'portfolio',
        desc: '项目治理、AI 协同、本站开发、技术架构与上下文资产',
        activePaths: ['/admin/planning', '/admin/portfolio', '/admin/ai-workspace', '/admin/model-dispatch', '/admin/deepseek-tasks', '/admin/a-share-research', '/admin/morning-greeting', '/admin/ops', '/admin/site-dev', '/admin/integrations', '/admin/cloudflare-personal-site-map', '/admin/context-memory'],
        children: [
          { href: '/admin/planning', label: '规划中心' },
          { href: '/admin/portfolio', label: '项目总览' },
          { href: '/admin/ops', label: '自动化台账' },
          { href: '/admin/a-share-research', label: 'A 股研究自动化' },
          { href: '/admin/morning-greeting', label: 'X 发布任务' },
          { href: '/admin/deepseek-tasks', label: '调用记录与审计' },
          { href: '/admin/site-dev', label: '开发与发布' },
          { href: '/admin/integrations', label: '集成与 API Keys' },
          { href: '/admin/cloudflare-personal-site-map', label: '站点架构' },
          { href: '/admin/context-memory', label: '上下文记忆' },
        ],
      },
      {
        href: '/admin/integrations',
        label: '集成与 API Keys',
        shortLabel: '集成',
        icon: 'integrations',
        desc: '外部服务凭证、Webhook 与定时任务',
        sidebar: false,
      },
    ],
  },
  {
    id: 'operations',
    label: '站点运营',
    items: [
      {
        href: '/admin/system',
        label: '系统运维',
        shortLabel: '运维',
        icon: 'ops',
        desc: '数据健康、站点治理、访问工具与资产存档',
        activePaths: ['/admin/db', '/admin/settings', '/admin/seo', '/admin/short-links', '/admin/archives', '/admin/reverse-lab'],
        children: [
          { href: '/admin/db', label: '数据健康' },
          { href: '/admin/settings', label: '站点配置' },
          { href: '/admin/seo', label: 'SEO 管理' },
          { href: '/admin/short-links', label: '短链管理' },
          { href: '/admin/archives', label: '存档管理' },
          { href: '/admin/reverse-lab', label: '逆向测试' },
        ],
      },
    ],
  },
  {
    id: 'access',
    label: '账户与权限',
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
        desc: '账户余额概览 / 资源权益设置 / 手动增减燃币',
      },
      {
        href: '/admin/nav',
        label: '菜单权限管理',
        shortLabel: '菜单',
        icon: 'nav',
        desc: '设置每个菜单项对谁可见（public / authed / owner）',
      },
    ],
  },
  {
    id: 'private',
    label: '私域',
    items: [
      {
        href: '/admin/long-compass',
        label: '私域与分享',
        shortLabel: '私域',
        icon: 'compass',
        desc: '长期罗盘强私密 + 密码保护分享分发入口',
      },
      {
        href: '/admin/information',
        label: '信息管理',
        shortLabel: '信息',
        icon: 'information',
        desc: '端到端加密保存账号、密保与其他敏感信息',
      },
      {
        href: '/admin/nsfw',
        label: 'NSFW 私有媒体库',
        shortLabel: 'NSFW',
        icon: 'nsfw',
        desc: '仅站长可访问的私有 R2 媒体库；不生成公开链接',
      },
    ],
  },
]

/**
 * 规划中模块：只占位、不创建路由（避免 404）。
 * 以后填功能时，把条目从这里移到对应分组的 items 并加上路由即可。
 */
export const ADMIN_PLANNED = [
  { id: 'audit', label: '通知 / 审计日志', icon: 'audit', desc: '操作日志、登录记录、告警' },
]

/** 拍平后的控制台清单（不含总览）——兼容旧消费者与遍历需求 */
export const ADMIN_CONSOLE_ITEMS = ADMIN_NAV_GROUPS.filter((group) => group.id !== 'overview').flatMap(
  (group) => group.items
)

/** 含总览的完整导航项（拍平）——供面包屑 / active 匹配用 */
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items)

/** 二级入口清单——供当前页标题优先匹配具体功能。 */
export const ADMIN_NAV_CHILD_ITEMS = ADMIN_NAV_ITEMS.flatMap((item) => item.children || [])

/** 主站私有工具：Dashboard 聚合入口，不迁入 admin 子域 */
export const ADMIN_PRIVATE_TOOL_LINKS = []

export function isAdminHostPathAllowed(pathname) {
  return ADMIN_HOST_ALLOW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** active 路径匹配：/admin 仅精确命中，其余允许子路径 */
export function isActiveAdminPath(pathname, href, activePaths = []) {
  const candidates = [href, ...(activePaths || [])]
  return candidates.some((candidate) => {
    if (candidate === '/admin') return pathname === '/admin'
    return pathname === candidate || pathname.startsWith(`${candidate}/`)
  })
}

/** 由当前路径解析出命中的导航项（找不到回落到总览） */
export function resolveActiveAdminItem(pathname) {
  const path = pathname || '/admin'
  return (
    ADMIN_NAV_CHILD_ITEMS.find((item) => isActiveAdminPath(path, item.href)) ||
    ADMIN_NAV_ITEMS.find((item) => isActiveAdminPath(path, item.href, item.activePaths)) ||
    ADMIN_NAV_ITEMS[0]
  )
}
