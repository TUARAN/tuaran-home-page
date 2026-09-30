/** 旧 /agent-ops/* → /admin/* 映射（middleware 301 用） */
export const ADMIN_LEGACY_REDIRECTS = {
  '/agent-ops': '/admin',
  '/agent-ops/nav-admin': '/admin/nav',
  '/agent-ops/db-admin': '/admin/db',
  '/agent-ops/share-admin': '/admin/soft-sticker?tab=long-compass',
  '/agent-ops/ops-console': '/admin/ops',
  '/agent-ops/project-portfolio': '/admin/portfolio',
  '/admin/ai-workspace': '/admin/automation',
  '/admin/content-index': '/admin/articles',
  '/admin/model-dispatch': '/admin/planning?tab=dispatch',
  '/admin/person-strawberry': '/admin/soft-sticker?tab=strawberry',
  '/admin/self-regulation': '/admin/soft-sticker?tab=self-regulation',
  '/admin/long-compass': '/admin/soft-sticker?tab=long-compass',
  '/admin/system': '/admin/projects',
  '/admin/portfolio': '/admin/planning?tab=portfolio',
  '/admin/integrations': '/admin/settings?tab=integrations',
  '/admin/deepseek-tasks': '/admin/settings?tab=models',
  '/admin/db': '/admin/site-health?tab=data',
  '/admin/site-status': '/admin/site-health?tab=incidents',
  '/admin/blogger-eye': '/admin/site-health?tab=probe',
  '/admin/logs': '/admin/ops?tab=runs',
}

/** admin.2aran.com 允许的路径前缀 */
export const ADMIN_HOST = 'admin.2aran.com'
/** 主站 canonical host：admin 子域上的「主站页面」外链直接指向这里 */
export const CANONICAL_HOST = '2aran.com'
export const ADMIN_HOST_ALLOW_PREFIXES = [
  '/admin',
  '/api/admin',
  '/api/private-records',
  '/api/bookmark-navigation',
  '/login',
  '/register',
  '/api/auth',
  '/api/me',
  // 监控和周报通知打开后落在后台域名。已读请求必须留在这里，否则红点不会消失。
  '/api/notifications',
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
        desc: '内容生产、组织治理、分发触达、数据复盘与资源归档',
        hubDescription: '把内容生产、组织、触达、复盘和沉淀放进同一条内容生命周期。',
        eyebrow: '内容生命周期',
        flow: ['生产入库', '组织治理', '分发触达', '数据复盘'],
        activePaths: ['/admin/articles', '/admin/articles/research-import', '/admin/recommendations', '/admin/research-style', '/admin/content-taxonomy', '/admin/content-weekly', '/admin/rss-feeds', '/admin/wallpapers', '/admin/seo', '/admin/short-links', '/admin/archives', '/admin/article-distribution', '/admin/quotes'],
        sections: [
          {
            id: 'production',
            label: '内容生产',
            desc: '管理内容正本、创作入口和需要人工确认的调研稿。',
            items: [
              { href: '/admin/articles', label: '内容管理', icon: 'articles', desc: '统一查看三种文章来源：仓库历史文章、D1 后台文章和 research 调研文章，并按各自流程编辑。', note: '来源说明 + 列表' },
              { href: '/admin/articles/research-import', label: '审批调研', icon: 'approval', desc: '核对 GitHub 上的调研正文，审批发布或撤回。', note: 'Git 正本核对后写入线上' },
            ],
          },
          {
            id: 'governance',
            label: '组织治理',
            desc: '维护分类边界和首页呈现规则，避免内容组织与推荐策略分散。',
            items: [
              { href: '/admin/content-taxonomy', label: '分类管理', icon: 'researchStyle', desc: '维护分类定义，查看主题分布与待治理内容，持续校正分类边界。', note: '稳定 ID + 主题定义 + 分类审计' },
              { href: '/admin/recommendations', label: '推荐管理', icon: 'analytics', desc: '配置首页推荐来源、内容权重、换一批策略与人工置顶。', note: '规则保存后无需重新构建' },
            ],
          },
          {
            id: 'distribution',
            label: '分发与触达',
            desc: '管理内容被发现、分享、订阅和写入外部平台草稿的渠道。',
            items: [
              { href: '/admin/article-distribution', label: '文章分发', icon: 'share', desc: '选择站内文章，通过浏览器插件写入六个平台草稿。', note: '人工确认后写入草稿，不自动发布' },
              { href: '/admin/seo', label: 'SEO 管理', icon: 'seo', desc: '维护内容索引、Metadata、结构化数据与 Sitemap。' },
              { href: '/admin/short-links', label: '短链管理', icon: 'share', desc: '管理内容分享短链、访问映射与点击统计。' },
              { href: '/admin/rss-feeds', label: 'RSS 与分发', icon: 'rss', desc: '维护公开 RSS 订阅墙，并查看 RSS 请求记录。' },
            ],
          },
          {
            id: 'analytics',
            label: '数据复盘',
            desc: '根据访问、阅读、来源和互动数据校正内容与分发策略。',
            items: [
              { href: '/admin/content-weekly', label: '数据统计', icon: 'analytics', desc: '集中查看站点访问、有效阅读与边缘流量，并按统一时间窗对照统计差异。' },
            ],
          },
          {
            id: 'assets',
            label: '资源与归档',
            desc: '维护可复用内容资产，并记录已经下线的页面与保留入口。',
            items: [
              { href: '/admin/wallpapers', label: '壁纸资源', icon: 'archive', desc: '上传和维护公开壁纸画廊使用的 R2 资源。' },
              { href: '/admin/quotes', label: '短句内容', icon: 'researchStyle', desc: '维护既有原创短句和前台随机展示内容；自动生成已暂停。', note: '自动生成已暂停' },
              { href: '/admin/archives', label: '存档管理', icon: 'archive', desc: '记录活动页面下线范围、历史入口与保留资产。' },
            ],
          },
        ],
      },
      {
        href: '/admin/automation',
        label: '自动化',
        shortLabel: '自动化',
        icon: 'ops',
        desc: '任务调度、运行观测、自动研究与社交发布',
        hubDescription: '从任务登记、执行观测到自动内容产出，按一条运行链路组织。',
        eyebrow: '从任务到复盘',
        flow: ['登记任务', '自动执行', '运行观测', '人工复核'],
        activePaths: ['/admin/ai-workspace', '/admin/ops', '/admin/a-share-research', '/admin/crypto-research', '/admin/morning-greeting', '/admin/x-replies', '/admin/engagement-bots', '/admin/logs'],
        sections: [
          {
            id: 'operations',
            label: '调度与观测',
            desc: '在一个入口查看任务台账、最近运行和模型调用，减少清单与日志之间的重复跳转。',
            items: [
              { href: '/admin/ops', label: '任务中心', icon: 'ops', desc: '统一查看云端与本地任务、最近运行和模型调用记录。', note: '任务台账 + 运行记录 + 调用记录' },
            ],
          },
          {
            id: 'research',
            label: '自动研究',
            desc: '管理有明确选题、联网检索、复核窗口和发布结果的调研任务。',
            items: [
              { href: '/admin/a-share-research', label: 'A 股研究自动化', icon: 'aShareResearch', desc: '每日选题、联网检索草稿、复核窗口、自动发布与运行日志。' },
              { href: '/admin/crypto-research', label: '加密调研自动化', icon: 'ops', desc: '按市值每天一个币种，覆盖背景、技术、代币经济、治理、安全与监管。', note: '每天 01:30' },
            ],
          },
          {
            id: 'social',
            label: '发布与互动',
            desc: '管理定时发布和站内互动任务；人工文章分发已归回内容工作区。',
            items: [
              { href: '/admin/morning-greeting', label: 'X 发布任务', icon: 'morningGreeting', desc: '管理每日早午安、互关交友和蓝 V 交流的自动发布。' },
              { href: '/admin/x-replies', label: 'X 回复任务', icon: 'morningGreeting', desc: '准备通用短回复，人工确认后通过 X API 发布。', note: '仅限已召唤账号的帖子' },
              { href: '/admin/engagement-bots', label: '路过互动', icon: 'ops', desc: '管理人设、每日随机点赞、DeepSeek 评论与运行记录。', note: '每天 10:23' },
            ],
          },
        ],
      },
      {
        href: '/admin/projects',
        label: '工程与运维',
        shortLabel: '工程',
        icon: 'portfolio',
        desc: '项目管理、研发建设、运行保障、配置安全与工程实验',
        hubDescription: '把项目规划、工程交付、站点运行和配置治理放进同一条持续演进链路。',
        eyebrow: '从规划到运行',
        flow: ['项目规划', '研发交付', '运行观测', '持续治理'],
        activePaths: ['/admin/planning', '/admin/portfolio', '/admin/site-dev', '/admin/subsites', '/admin/integrations', '/admin/deepseek-tasks', '/admin/cloudflare-personal-site-map', '/admin/context-memory', '/admin/db', '/admin/site-status', '/admin/settings', '/admin/design', '/admin/site-health', '/admin/security-self-check', '/admin/reverse-lab', '/admin/blogger-eye'],
        sections: [
          {
            id: 'projects',
            label: '项目管理',
            desc: '统一管理项目组合、规划事项、路线图和 AI 分派。',
            items: [{ href: '/admin/planning', label: '项目管理', icon: 'planning', desc: '查看项目组合、规划待办、路线图、执行历史与 AI 分派。' }],
          },
          {
            id: 'engineering',
            label: '研发建设',
            desc: '推进代码交付，并维护设计规范、技术架构与工程上下文。',
            items: [
              { href: '/admin/site-dev', label: '开发发布', icon: 'siteDev', desc: '同步 GitHub / npm，处理 Issue、PR 与发布状态。' },
              { href: '/admin/design', label: 'UI 设计', icon: 'researchStyle', desc: '查看设计规范、交互审计和改造验收记录。' },
              { href: '/admin/cloudflare-personal-site-map', label: '站点架构', icon: 'database', desc: '查看 Cloudflare 架构、运行时边界与演进方向。' },
              { href: '/admin/context-memory', label: '上下文库', icon: 'memory', desc: '管理项目背景、关键决策和长期工程记忆。' },
            ],
          },
          {
            id: 'runtime',
            label: '运行保障',
            desc: '管理站点关系，集中查看数据、可用性、体检和故障处置。',
            items: [
              { href: '/admin/subsites', label: '二级站点', icon: 'portfolio', desc: '维护子域站点、部署归属和服务依赖关系。' },
              { href: '/admin/site-health', label: '运行中心', icon: 'audit', desc: '统一查看站点体检、数据健康、可用性探测与故障公告。' },
            ],
          },
          {
            id: 'configuration',
            label: '配置与安全',
            desc: '集中管理站点开关、外部集成和公开前风险检查。',
            items: [
              { href: '/admin/settings', label: '配置中心', icon: 'settings', desc: '管理站点功能开关、第三方服务、模型密钥、凭证与 Webhook。' },
              { href: '/admin/security-self-check', label: '涉密自检', icon: 'audit', desc: '核对仓库公开前的秘密、隐私、架构信息与历史风险。' },
            ],
          },
          {
            id: 'experiments',
            label: '工程实验',
            desc: '保留与生产运行隔离的授权学习和验证工具。',
            items: [{ href: '/admin/reverse-lab', label: '逆向测试', icon: 'reverseLab', desc: '在自有或明确授权样本上进行静态分析与最小动态验证。' }],
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
        activePaths: ['/admin/users', '/admin/access/grants', '/admin/points', '/admin/rewards', '/admin/nav'],
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
              { href: '/admin/rewards', label: '签到礼物', icon: 'ranbi', desc: '管理礼物库存、燃币兑换和实物履约。' },
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
        activePaths: ['/admin/personal-profile', '/admin/contract-renewal', '/admin/soft-sticker', '/admin/self-regulation', '/admin/person-strawberry', '/admin/share', '/admin/information', '/admin/nsfw', '/admin/bookmark-nav', '/admin/stock-analysis'],
        sections: [
          {
            id: 'vaults',
            label: '个人密文',
            items: [
              { href: '/admin/personal-profile', label: '个人画像', icon: 'personProfile' },
              { href: '/admin/contract-renewal', label: '续签述职', icon: 'briefing' },
              { href: '/admin/information', label: '信息金库', icon: 'information' },
              { href: '/admin/soft-sticker', label: '软贴空间', icon: 'flower' },
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
            items: [
              { href: '/admin/nsfw', label: '私密媒体', icon: 'nsfw' },
              { href: '/admin/bookmark-nav', label: '书签导航', icon: 'bookmark' },
            ],
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

export function getAdminWorkspace(href) {
  return ADMIN_CONSOLE_ITEMS.find((item) => item.href === href) || null
}

export function listWorkspaceChildren(item) {
  return (item?.sections || []).flatMap((section) => section.items || [])
}

/** 一级工作台入口页与侧栏共用同一套分组，避免两边各自维护一份名单。 */
export function getWorkspaceHubProps(href) {
  const item = getAdminWorkspace(href)
  if (!item) return { title: '', description: '', sections: [] }
  return {
    title: item.label,
    description: item.hubDescription || item.desc || '',
    eyebrow: item.eyebrow,
    flow: item.flow,
    sections: (item.sections || []).map((section) => ({
      title: section.label,
      description: section.desc,
      items: (section.items || []).map((entry) => ({
        href: entry.href,
        title: entry.label,
        description: entry.desc,
        icon: entry.icon,
        note: entry.note,
      })),
    })),
  }
}

/** 命中多个子入口时取路径更长的那条，避免 /admin/articles 盖住其下的审批页。 */
export function resolveActiveAdminChild(pathname) {
  const path = pathname || '/admin'
  return ADMIN_NAV_CHILD_ITEMS.reduce((best, item) => {
    const target = item.matchPath || item.href
    if (!isActiveAdminPath(path, target)) return best
    if (!best) return item
    const bestTarget = best.matchPath || best.href
    return target.length > bestTarget.length ? item : best
  }, null)
}

/** 返回页面所在的工作区与具体入口；顶栏和侧栏共享同一套层级解析。 */
export function resolveAdminTrail(pathname) {
  const path = pathname || '/admin'
  const child = resolveActiveAdminChild(path)
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
