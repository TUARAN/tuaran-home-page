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
 *  - sections：工作台入口下的一级菜单；其中 items 是具体二级入口。
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
    label: '工作区',
    items: [
      {
        href: '/admin/content',
        label: '内容',
        shortLabel: '内容',
        icon: 'articles',
        desc: '写作、内容库、规范、阅读分析与 RSS 分发',
        activePaths: ['/admin/articles', '/admin/content-index', '/admin/recommendations', '/admin/research-style', '/admin/content-taxonomy', '/admin/content-weekly', '/admin/rss-feeds', '/admin/wallpapers'],
        sections: [
          {
            id: 'library',
            label: '内容资产',
            items: [
              { href: '/admin/articles', label: '内容管理', icon: 'articles' },
              { href: '/admin/content-index', label: '内容索引', icon: 'database', sidebar: false },
              { href: '/admin/wallpapers', label: '壁纸资源', icon: 'archive', sidebar: false },
            ],
          },
          {
            id: 'presentation',
            label: '推荐与展示',
            items: [
              { href: '/admin/recommendations', label: '推荐管理', icon: 'analytics' },
            ],
          },
          {
            id: 'governance',
            label: '分类与规范',
            items: [
              { href: '/admin/content-taxonomy', label: '分类管理', icon: 'researchStyle' },
              { href: '/admin/research-style', label: '调研风格', icon: 'researchStyle', sidebar: false },
            ],
          },
          {
            id: 'feedback',
            label: '反馈与分发',
            items: [
              { href: '/admin/content-weekly', label: '数据与反馈', icon: 'analytics' },
              { href: '/admin/rss-feeds', label: 'RSS 与分发', icon: 'rss' },
            ],
          },
        ],
      },
      {
        href: '/admin/automation',
        label: '自动化',
        shortLabel: '自动化',
        icon: 'ops',
        desc: '自动任务、内容流水线、模型服务与运行审计',
        activePaths: ['/admin/ai-workspace', '/admin/ops', '/admin/a-share-research', '/admin/crypto-research', '/admin/morning-greeting', '/admin/article-distribution', '/admin/quotes', '/admin/engagement-bots', '/admin/deepseek-tasks'],
        sections: [
          {
            id: 'control',
            label: '执行与审计',
            items: [
              { href: '/admin/ops', label: '自动化台账', icon: 'ops' },
              { href: '/admin/deepseek-tasks', label: '模型服务', icon: 'deepseekTasks' },
            ],
          },
          {
            id: 'pipelines',
            label: '内容流水线',
            items: [
              { href: '/admin/a-share-research', label: 'A 股研究自动化', icon: 'aShareResearch' },
              { href: '/admin/crypto-research', label: '加密调研自动化', icon: 'ops' },
              { href: '/admin/morning-greeting', label: 'X 发布任务', icon: 'morningGreeting' },
              { href: '/admin/article-distribution', label: '文章一键分发', icon: 'share' },
              { href: '/admin/quotes', label: '名言生成', icon: 'researchStyle' },
              { href: '/admin/engagement-bots', label: '路过互动', icon: 'ops' },
            ],
          },
        ],
      },
      {
        href: '/admin/projects',
        label: '项目与工程',
        shortLabel: '项目',
        icon: 'portfolio',
        desc: '项目规划、本站开发、技术架构与上下文资产',
        activePaths: ['/admin/planning', '/admin/portfolio', '/admin/site-dev', '/admin/integrations', '/admin/cloudflare-personal-site-map', '/admin/context-memory'],
        sections: [
          {
            id: 'governance',
            label: '项目治理',
            items: [
              { href: '/admin/planning', label: '规划中心', icon: 'planning' },
              { href: '/admin/portfolio', label: '项目总览', icon: 'portfolio' },
            ],
          },
          {
            id: 'engineering',
            label: '站点工程',
            items: [
              { href: '/admin/site-dev', label: '开发发布', icon: 'siteDev' },
              { href: '/admin/integrations', label: '集成密钥', icon: 'integrations' },
              { href: '/admin/cloudflare-personal-site-map', label: '站点架构', icon: 'database' },
            ],
          },
          {
            id: 'context',
            label: '工程上下文',
            items: [{ href: '/admin/context-memory', label: '上下文库', icon: 'memory' }],
          },
        ],
      },
      {
        href: '/admin/system',
        label: '站点运维',
        shortLabel: '站点',
        icon: 'ops',
        desc: '数据健康、站点治理、访问工具与资产存档',
        activePaths: ['/admin/db', '/admin/settings', '/admin/seo', '/admin/short-links', '/admin/archives', '/admin/reverse-lab'],
        sections: [
          {
            id: 'runtime',
            label: '运行与配置',
            items: [
              { href: '/admin/db', label: '数据健康', icon: 'database' },
              { href: '/admin/settings', label: '站点配置', icon: 'settings' },
            ],
          },
          {
            id: 'governance',
            label: '站点治理',
            items: [
              { href: '/admin/seo', label: 'SEO 管理', icon: 'seo' },
              { href: '/admin/short-links', label: '短链管理', icon: 'share' },
              { href: '/admin/archives', label: '存档管理', icon: 'archive' },
            ],
          },
          {
            id: 'experiments',
            label: '系统实验',
            items: [{ href: '/admin/reverse-lab', label: '逆向测试', icon: 'reverseLab' }],
          },
        ],
      },
      {
        href: '/admin/access',
        label: '用户与权限',
        shortLabel: '用户',
        icon: 'users',
        badgeKey: 'users',
        desc: '账号身份、授权关系、燃币权益与菜单可见性',
        activePaths: ['/admin/users', '/admin/access/grants', '/admin/points', '/admin/nav'],
        sections: [
          {
            id: 'identity',
            label: '账号与授权',
            items: [
              { href: '/admin/users', label: '账号与身份', icon: 'users' },
              { href: '/admin/access/grants', label: '授权管理', icon: 'integrations' },
            ],
          },
          {
            id: 'entitlements',
            label: '权益与可见性',
            items: [
              { href: '/admin/points', label: '燃币与权益', icon: 'ranbi' },
              { href: '/admin/nav', label: '菜单可见性', icon: 'nav' },
            ],
          },
        ],
      },
      {
        href: '/admin/private-data',
        label: '私密数据',
        shortLabel: '私密',
        icon: 'compass',
        desc: '个人密文、私密分析、密码保护分享与私有媒体资产',
        activePaths: ['/admin/long-compass', '/admin/soft-sticker', '/admin/self-regulation', '/admin/person-strawberry', '/admin/share', '/admin/information', '/admin/nsfw', '/admin/stock-analysis'],
        sections: [
          {
            id: 'vaults',
            label: '个人密文',
            items: [
              { href: '/admin/long-compass', label: '长期罗盘', icon: 'compass' },
              { href: '/admin/soft-sticker', label: '软贴空间', icon: 'flower' },
              { href: '/admin/information', label: '信息金库', icon: 'information' },
            ],
          },
          {
            id: 'distribution',
            label: '加密分发',
            items: [{ href: '/admin/share', label: '加密分享', icon: 'share' }],
          },
          {
            id: 'analysis',
            label: '私密分析',
            items: [{ href: '/admin/stock-analysis', label: '交易分析', icon: 'analytics' }],
          },
          {
            id: 'assets',
            label: '私有资产',
            items: [{ href: '/admin/nsfw', label: '私密媒体', icon: 'nsfw' }],
          },
        ],
      },
    ],
  },
]

/**
 * 规划中模块：只占位、不创建路由（避免 404）。
 * 以后填功能时，把条目从这里移到对应分组的 items 并加上路由即可。
 */
export const ADMIN_PLANNED = []

/** 拍平后的控制台清单（不含总览）——兼容旧消费者与遍历需求 */
export const ADMIN_CONSOLE_ITEMS = ADMIN_NAV_GROUPS.filter((group) => group.id !== 'overview').flatMap(
  (group) => group.items
)

/** 含总览的完整导航项（拍平）——供面包屑 / active 匹配用 */
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items)

/** 二级入口清单——供当前页标题优先匹配具体功能。 */
export const ADMIN_NAV_CHILD_ITEMS = ADMIN_NAV_ITEMS.flatMap((item) =>
  (item.sections || []).flatMap((section) => section.items || [])
)

/** 返回页面所在的工作区与具体入口；顶栏和侧栏共享同一套层级解析。 */
export function resolveAdminTrail(pathname) {
  const path = pathname || '/admin'
  const child = ADMIN_NAV_CHILD_ITEMS.find((item) =>
    isActiveAdminPath(path, item.matchPath || item.href)
  )
  if (child) {
    const parent = ADMIN_NAV_ITEMS.find((item) =>
      (item.sections || []).some((section) => (section.items || []).includes(child))
    )
    return parent ? [parent, child] : [child]
  }

  const parent = ADMIN_NAV_ITEMS.find((item) =>
    isActiveAdminPath(path, item.href, item.activePaths)
  )
  return parent ? [parent] : [ADMIN_NAV_ITEMS[0]]
}

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
  const trail = resolveAdminTrail(pathname)
  return trail[trail.length - 1]
}
