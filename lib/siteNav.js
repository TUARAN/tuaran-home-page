/**
 * 站点导航分类（5 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：内容 / 工具 / 系统 / 圈子 / 关于（2026-07；资源归入内容）
 * 内容频道按“入口 / 内容主题 / 内容类型”组织。
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；tag 用于少量精选菜单角标
 * featured: true 表示频道总入口，在分组网格中轻量强调
 * nav: false 表示不出现在主导航，但仍保留在 /map 站点地图
 * 注意：section 的中文 title 是 SiteHeader TIER_SECTION_STYLES 的样式键，改名要同步
 */

import { ENGINEERING_WORKS } from './engineeringWorks'
import { COMMUNITY_TOPICS, COMMUNITY_TOPIC_NAV_ITEMS } from './communityTopics'

const TOOL_RESOURCE_PATHS = new Set([
  '/resources/x-mutual-cleaner-extension',
  '/resources/x-tweet-to-pdf-extension',
  '/resources/2aran-desktop',
])

function isToolResourcePath(pathname) {
  const path = String(pathname || '')
  return TOOL_RESOURCE_PATHS.has(path)
}

export const SITE_CHANNELS = [
  {
    key: 'content',
    label: '内容',
    labelEn: 'Content',
    href: '/articles',
    match: (p, searchParams) =>
      (p?.startsWith('/articles') && !p?.startsWith('/articles/creation-calendar')) ||
      p?.startsWith('/feed') ||
      p?.startsWith('/originals') ||
      p?.startsWith('/diary') ||
      p?.startsWith('/people') ||
      p?.startsWith('/dad-stack') ||
      p?.startsWith('/bookmarks') ||
      (p?.startsWith('/resources') && !isToolResourcePath(p)) ||
      p?.startsWith('/reading') ||
      p?.startsWith('/history') ||
      p?.startsWith('/classical-masterpieces') ||
      p?.startsWith('/ru-shi-dao') ||
      p?.startsWith('/rich-pages') ||
      p?.startsWith('/a-share-research') ||
      p?.startsWith('/adsense-content-check') ||
      p?.startsWith('/china-politics'),
    sections: [
      {
        title: '入口',
        titleEn: 'Start',
        items: [
          { href: '/articles', label: '全部内容', labelEn: 'All Content', desc: '统一浏览、搜索和筛选', descEn: 'Browse, search and filter' },
          { href: '/frontend-weekly', label: '前端周看', labelEn: 'Frontend Weekly', desc: '前端、AI Agent 与工程情报', descEn: 'Frontend, AI Agent & engineering intel', tag: 'Auto' },
          { href: '/a-share-research', label: 'A股调研', labelEn: 'A-Share Research', desc: '每天一家 A 股上市公司', descEn: 'One listed company at a time', tag: 'Auto' },
        ],
      },
      {
        title: '内容主题',
        titleEn: 'By Topic',
        items: [
          { href: '/articles?subject=ai_dev', label: 'AI 与开发', labelEn: 'AI & Development', desc: '模型、Agent、AI 编程与工具', descEn: 'Models, agents, coding and tools', tag: 'Hot' },
          { href: '/articles?subject=web_cloud', label: 'Web 与云', labelEn: 'Web & Cloud', desc: '前端、架构、网络与平台', descEn: 'Frontend, architecture, network and platforms' },
          { href: '/articles?subject=product_experience', label: '产品与体验', labelEn: 'Product & Experience', desc: '产品、用户、需求与体验', descEn: 'Products, users, needs and experience' },
          { href: '/articles?subject=business_market', label: '商业与市场', labelEn: 'Business & Markets', desc: '行业、市场、增长与投资', descEn: 'Industries, markets, growth and investment' },
          { href: '/articles?subject=company_research', label: '公司调研', labelEn: 'Company Research', desc: '公司画像、业务与竞争位置', descEn: 'Company profiles, businesses and positioning' },
          { href: '/articles?subject=content_creation', label: '内容创作', labelEn: 'Content Creation', desc: '写作、传播、视觉与创作者', descEn: 'Writing, distribution, visuals and creators', nav: false },
          { href: '/articles?subject=workplace_org', label: '职场与组织', labelEn: 'Work & Organizations', desc: '团队、社区与职业观察', descEn: 'Teams, communities and work', nav: false },
          { href: '/articles?subject=humanities_history', label: '人文与历史', labelEn: 'Humanities & History', desc: '人物、制度、思想与历史资料', descEn: 'People, institutions, ideas and history', nav: false },
          { href: '/articles?subject=life_family', label: '生活与家庭', labelEn: 'Life & Family', desc: '生活记录、育儿与长期选择', descEn: 'Life, parenting and long-term choices', nav: false },
          // 以下为固定系列与具体内容页，保留在 /map 站点地图，不进主导航下拉。
          { href: '/rich-pages', label: '互动专题', labelEn: 'Interactives', desc: '可阅读、可筛选、可操作的内容作品', descEn: 'Readable and interactive content', nav: false },
          { href: '/resources/rss', label: 'RSS 订阅', labelEn: 'RSS Feeds', desc: '订阅墙、推荐源与站内阅读器', descEn: 'Feed directory and reader', nav: false },
          { href: '/resources/wallpapers', label: '壁纸下载', labelEn: 'Wallpapers', desc: '可下载视觉素材', descEn: 'Downloadable visuals', nav: false },
          { href: '/resources/ai-learning-library', label: '安东尼学 AI', labelEn: 'AI Learning', desc: 'AI 书目与学习资料', descEn: 'AI books and learning resources', nav: false },
          { href: '/dad-stack', label: 'Dad Stack', labelEn: 'Dad Stack', desc: 'AI、工程与育儿系列', descEn: 'AI, engineering and parenting', audience: 'owner', nav: false },
          { href: '/diary', label: '浮生日记', labelEn: 'Weblog', desc: '阶段总结与生活记录', descEn: 'Reviews and life notes', nav: false },
          { href: '/resources/codex-learning-resource-map-yichen', label: 'Codex 学习', labelEn: 'Codex Learning', desc: '逸尘 X 链接帖归档', descEn: 'Curated Codex resource map', nav: false },
          { href: '/resources/shen-zhi-ding-nei', label: '置身 X 内', labelEn: 'Workplace Archive', desc: '大厂职场文本合集', descEn: 'Workplace text archive', nav: false },
          { href: '/bookmarks/llm-tutorials', label: '大模型教程', labelEn: 'LLM Tutorials', desc: 'LLM 教程与技术文档', descEn: 'LLM guides & docs', nav: false },
          { href: '/bookmarks/twitter', label: '推特资讯', labelEn: 'X Notes', desc: 'X/Twitter 前沿动态与观点', descEn: 'X/Twitter signals & notes', nav: false },
          { href: '/reading', label: '书目索引', labelEn: 'Reading List', desc: '阅读计划与笔记', descEn: 'Plans & notes', nav: false },
          { href: '/classical-masterpieces', label: '古典名篇', labelEn: 'Classics', desc: '单篇作品谱系', descEn: 'Single-work lineage', nav: false },
          { href: '/china-politics', label: '政经资料', labelEn: 'Politics & Economy', desc: '当代中国研究', descEn: 'Contemporary China studies', nav: false },
          { href: '/bookmarks/youtube', label: 'YouTube 收藏', labelEn: 'YouTube', desc: '影像、纪录片与延伸资料', descEn: 'Video archive & references', nav: false },
          { href: '/bookmarks/ai-tools', label: 'AI 工具', labelEn: 'AI Tools', desc: 'AI 工具与产品推荐', descEn: 'AI tools & products', nav: false },
          { href: '/bookmarks/dev-resources', label: '开发资源', labelEn: 'Dev Resources', desc: '前端、后端与 DevOps 工具链', descEn: 'Frontend, backend & DevOps', nav: false },
          { href: '/history/ming-qing', label: '历史笔记', labelEn: 'History Notes', desc: '明清、三国与长篇笔记', descEn: 'Ming-Qing, Three Kingdoms & more', nav: false },
          { href: '/ru-shi-dao', label: '儒释道', labelEn: 'Ru-Shi-Dao', desc: '思想体系笔记', descEn: 'Notes on thought systems', nav: false },
        ],
      },
      {
        title: '内容类型',
        titleEn: 'Type',
        items: [
          { href: '/articles?group=article', label: '文章', labelEn: 'Articles', desc: '观点、记录与长文', descEn: 'Essays, notes and long-form writing' },
          { href: '/articles?group=analysis', label: '分析', labelEn: 'Analysis', desc: '深度分析、核验与对象档案', descEn: 'Analysis, verification and profiles' },
          { href: '/articles?group=practice', label: '实践', labelEn: 'Practice', desc: '工程案例、实作记录与指南', descEn: 'Cases, build logs and guides' },
          { href: '/rich-pages', label: '互动', labelEn: 'Interactives', desc: '可阅读、可筛选、可操作的内容作品', descEn: 'Readable, filterable and interactive works', tag: '作品' },
          { href: '/articles?group=resource', label: '资源', labelEn: 'Resources', desc: '档案、下载、订阅与收藏', descEn: 'Archives, downloads and subscriptions' },
        ],
      },
    ],
  },
  {
    key: 'tools',
    label: '工具',
    labelEn: 'Tools',
    href: '/tools',
    match: (p) =>
      p?.startsWith('/tools') ||
      p?.startsWith('/browser-extensions') ||
      p?.startsWith('/desktop-apps') ||
      isToolResourcePath(p) ||
      p?.startsWith('/cancers-overview') ||
      p?.startsWith('/sun-moon-motion') ||
      p?.startsWith('/ai-token-usage-research') ||
      p?.startsWith('/network-access-guide') ||
      p?.startsWith('/zhang-juzheng-book') ||
      p?.startsWith('/x-mutual-aid-circle') ||
      p?.startsWith('/platform-framework-pairs') ||
      p?.startsWith('/web-llm') ||
      p?.startsWith('/stock-analysis') ||
      p?.startsWith('/public-opinion') ||
      p?.startsWith('/eatwhat') ||
      p?.startsWith('/xiaomoli-dad-todo') ||
      p?.startsWith('/voice-tasks') ||
      p?.startsWith('/downloads'),
    sections: [
      {
        title: '工具',
        titleEn: 'Tools',
        items: [
          { href: '/tools', label: '工具库', labelEn: 'Tool Library', desc: '在线工具、扩展、应用与开发实验', descEn: 'Online tools, extensions, apps & experiments', featured: true },
          { href: '/tools#online', label: '在线工具', labelEn: 'Online Tools', desc: '网页可用工具目录', descEn: 'Browser-based tools' },
          { href: '/tools#downloads', label: '插件下载', labelEn: 'Downloads', desc: '扩展与客户端目录', descEn: 'Extensions and apps', nav: false },
          { href: '/tools#x-platform', label: 'X 平台工具', labelEn: 'X Platform', desc: '内容与账号辅助工具', descEn: 'Content and account utilities', nav: false },
          { href: '/browser-extensions', label: '浏览器扩展', labelEn: 'Extensions', desc: '网页工作流插件', descEn: 'Browser workflow add-ons' },
          { href: '/desktop-apps', label: '桌面应用', labelEn: 'Desktop', desc: 'Windows / macOS', descEn: 'Windows / macOS', tag: 'New' },
        ],
      },
      {
        title: '分析',
        titleEn: 'Analysis',
        items: [
          { href: '/tools#analysis', label: '分析工具', labelEn: 'Analysis Tools', desc: '监测与研判目录', descEn: 'Monitoring and insights', nav: false },
          { href: '/public-opinion', label: '舆情分析', labelEn: 'Public Opinion', desc: '公开内容与趋势', descEn: 'Public signals and trends' },
          { href: '/stock-analysis', label: '交易分析', labelEn: 'Trading', desc: '分钟级交易快照', descEn: 'Minute-level snapshots' },
        ],
      },
      {
        title: '开发',
        titleEn: 'Build',
        items: [
          { href: '/tools#ai-dev', label: '开发工具', labelEn: 'Dev Tools', desc: 'AI 工程与工作流目录', descEn: 'AI engineering workflows', nav: false },
          { href: '/tools#indexes', label: '索引工具', labelEn: 'Tool Indexes', desc: '外部工具目录', descEn: 'External tool directories', nav: false },
          { href: 'https://toolkit-hub.pages.dev/', label: '代码矿工', labelEn: 'Code Miner', desc: '开发者工具集合', descEn: 'Developer tool collection', external: true },
          { href: '/web-llm', label: '端侧大模型', labelEn: 'On-device LLM', desc: '浏览器端大模型实验', descEn: 'In-browser LLM lab' },
        ],
      },
      {
        title: '互动专题',
        titleEn: 'Interactives',
        items: ENGINEERING_WORKS.map((work) => ({
          href: work.href,
          label: work.title,
          desc: work.kind || work.summary,
          audience: work.audience,
          nav: false,
        })),
      },
    ],
  },
  {
    key: 'systems',
    label: '系统',
    labelEn: 'Systems',
    href: '/works',
    match: (p) =>
      p?.startsWith('/works') ||
      p?.startsWith('/skill-center') ||
      p?.startsWith('/mcp-center') ||
      p?.startsWith('/prompt-center') ||
      p?.startsWith('/context-memory'),
    sections: [
      {
        title: '系统',
        titleEn: 'Systems',
        items: [
          { href: '/works', label: '作品展厅', labelEn: 'Work Gallery', desc: '产品、AI 工程与长期系统', descEn: 'Products, AI engineering & systems', featured: true },
          { href: '/skill-center', label: 'Skill 中心', labelEn: 'Skill Center', desc: '模型与智能体能力货架', descEn: 'Model & agent capability shelf' },
          { href: '/mcp-center', label: 'MCP 中心', labelEn: 'MCP Center', desc: '智能体可连接的服务货架', descEn: 'Connectable services for AI agents' },
          { href: '/prompt-center', label: 'Prompt 中心', labelEn: 'Prompt Center', desc: '提示词经验与任务模板', descEn: 'Prompt patterns & task templates' },
          { href: '/context-memory', label: '上下文记忆', labelEn: 'Context Memory', desc: '我的工作记忆架构', descEn: 'My working-memory architecture', nav: false },
        ],
      },
    ],
  },
  {
    key: 'community',
    label: '圈子',
    labelEn: 'Community',
    href: '/community',
    match: (p) =>
      p?.startsWith('/community') ||
      p?.startsWith('/messages') ||
      p?.startsWith('/notifications') ||
      p?.startsWith('/ranbi') ||
      p?.startsWith('/donate') ||
      p?.startsWith('/services') ||
      p?.startsWith('/project-manager') ||
      COMMUNITY_TOPICS.some((topic) => p?.startsWith(topic.href)) ||
      p?.startsWith('/writing-monetization-2026'),
    sections: [
      {
        title: '参与',
        titleEn: 'Participate',
        items: [
          { href: '/community', label: '讨论中心', labelEn: 'Discussion Hub', desc: '留言、评论动态、通知与社群入口', descEn: 'Messages, comments, notifications & groups', featured: true },
          { href: '/ranbi', label: '燃币说明', labelEn: 'Ranbi Guide', desc: '留存、交流与资源权益', descEn: 'Retention, discussion & resource access', nav: false },
          { href: '/donate', label: '支持本站', labelEn: 'Support This Site', desc: '支持维护，也可私聊调整燃币', descEn: 'Support maintenance & Ranbi top-up', nav: false },
        ],
      },
      {
        title: '专题圈子',
        titleEn: 'Topic Circles',
        items: COMMUNITY_TOPIC_NAV_ITEMS,
      },
      {
        title: '合作',
        titleEn: 'Collaborate',
        items: [
          { href: '/services', label: '合作说明', labelEn: 'Collaboration', desc: '咨询、分析与内容协作', descEn: 'Consulting, analysis & content' },
          { href: 'https://blogger-alliance.cn/', label: '博主联盟', labelEn: 'Blogger Alliance', desc: 'AI 产品方与技术博主', descEn: 'AI products ↔ tech bloggers', external: true },
          { href: 'https://frontendnext.com/', label: '前端周看', labelEn: 'Frontend Weekly', desc: '前端与 AI Agent 情报站', descEn: 'Frontend & AI Agent intel', external: true, nav: false },
          { href: 'https://syncblog.cn/', label: 'AI分发大师', labelEn: 'SyncBlog', desc: '一次创作，多平台同步分发', descEn: 'Write once, sync everywhere', external: true, tag: 'New' },
          { href: '/project-manager', label: '项目经理视角', labelEn: 'PM Perspective', desc: '团队、协作与交付', descEn: 'Team, collaboration & delivery', nav: false },
        ],
      },
    ],
  },
  {
    key: 'about',
    label: '关于',
    labelEn: 'About',
    href: '/site',
    match: (p) =>
      p?.startsWith('/site') ||
      p?.startsWith('/help') ||
      p?.startsWith('/about') ||
      p?.startsWith('/privacy') ||
      p?.startsWith('/editorial') ||
      p?.startsWith('/contact') ||
      p?.startsWith('/publications') ||
      p?.startsWith('/traffic') ||
      p?.startsWith('/changelog') ||
      p?.startsWith('/map') ||
      p?.startsWith('/articles/creation-calendar'),
    sections: [
      {
        title: '站点',
        titleEn: 'Site',
        items: [
          { href: '/site', label: '关于本站', labelEn: 'About This Site', desc: '这里是什么、如何参与', descEn: 'What this site is & how to participate', featured: true },
          { href: '/help', label: '使用帮助', labelEn: 'Help', desc: '账号、评论、资源与常见问题', descEn: 'Accounts, comments, resources & troubleshooting' },
          { href: '/articles/creation-calendar', label: '创作日历', labelEn: 'Writing Calendar', desc: '本站与掘金写作节奏', descEn: 'Cadence on this site & Juejin', nav: false },
          { href: '/map', label: '全站导航', labelEn: 'Site Map', desc: '全站结构化入口', descEn: 'Structured entry to the site' },
          { href: '/privacy', label: '隐私政策', labelEn: 'Privacy', desc: '数据、Cookie 与广告说明', descEn: 'Data, cookies & ads' },
          { href: '/editorial', label: '内容说明', labelEn: 'Editorial Policy', desc: '作者责任、工具使用与更正机制', descEn: 'Authorship, tools & corrections' },
          { href: '/contact', label: '联系方式', labelEn: 'Contact', desc: '邮件、微信与合作入口', descEn: 'Email, WeChat & collaboration' },
          { href: '/changelog', label: '更新记录', labelEn: 'Changelog', desc: '按周、月、季、年查看本站演进', descEn: 'Site evolution by week, month, quarter, or year', nav: false },
          { href: '/traffic', label: '流量', labelEn: 'Traffic', desc: '本站访问数据', descEn: 'Site visit stats', nav: false },
        ],
      },
      {
        title: '站长',
        titleEn: 'Owner',
        items: [
          { href: '/about', label: '关于站长', labelEn: 'About the Owner', desc: '站长介绍 / 履历', descEn: 'Owner bio & résumé' },
          { href: '/publications', label: '出版作品', labelEn: 'Publications', desc: '《程序员成长手记》等', descEn: '"A Programmer\'s Growth Notes" & more', nav: false },
        ],
      },
    ],
  },
]

/** 顶部主导航「关于」频道之后的站长入口（非下拉频道）。 */
export const SITE_ADMIN_NAV_LINK = {
  href: '/admin',
  label: '后台管理',
  labelEn: 'Admin',
  desc: '站长控制台 · D1 / Ops / 配置',
  descEn: 'Owner console · D1 / Ops / Config',
  audience: 'owner',
}

/** 按当前语言取导航项 label（en 缺省回落中文）。 */
export function navLabel(item, locale) {
  return locale === 'en' && item?.labelEn ? item.labelEn : item?.label
}

/** 按当前语言取导航项 desc（en 缺省回落中文）。 */
export function navDesc(item, locale) {
  return locale === 'en' && item?.descEn ? item.descEn : item?.desc
}

/** 按当前语言取分组标题（en 缺省回落中文；中文标题仍是样式/匹配键）。 */
export function navSectionTitle(section, locale) {
  return locale === 'en' && section?.titleEn ? section.titleEn : section?.title
}

export function isAdminNavPath(pathname) {
  return pathname?.startsWith('/admin') || pathname?.startsWith('/agent-ops')
}

export function isAdminNavVisible(account, overrides = null) {
  if (!account || account.loading) return false
  return isItemVisibleForAccount(SITE_ADMIN_NAV_LINK, account, overrides)
}

/**
 * 页脚链接：和主导航共用同一套 audience + overrides 体系，
 * 也会出现在后台管理面板里，可被站长按需调整可见性。
 */
export const SITE_FOOTER_LINKS = [
  { href: '/site', label: '关于本站', labelEn: 'About Site', desc: '站点说明 / 参与方式', descEn: 'Site guide / participation' },
  { href: '/about', label: '关于站长', labelEn: 'About the Owner', desc: '站长介绍 / 履历', descEn: 'Owner bio & résumé' },
  { href: '/editorial', label: '内容说明', labelEn: 'Editorial Policy', desc: '作者责任 / 工具 / 更正', descEn: 'Authorship / tools / corrections' },
  { href: '/privacy', label: '隐私政策', labelEn: 'Privacy', desc: '数据 / Cookie / 广告', descEn: 'Data / cookies / ads' },
  { href: '/contact', label: '联系', labelEn: 'Contact', desc: '邮件 / 微信 / 合作', descEn: 'Email / WeChat / collaboration' },
  { href: '/services', label: '聊合作', labelEn: 'Collaborate', desc: '咨询 / 写作 / 推广', descEn: 'Consulting / writing / promotion' },
  { href: '/community', label: '讨论中心', labelEn: 'Discussion Hub', desc: '留言、评论与社群', descEn: 'Messages, comments & groups' },
  { href: '/rss.xml', label: 'RSS', labelEn: 'RSS', desc: '订阅 RSS', descEn: 'Subscribe via RSS', external: true },
  { href: '/donate', label: '支持本站', labelEn: 'Support This Site', desc: '维护成本 / 燃币调整', descEn: 'Maintenance & Ranbi top-up' },
  { href: '/traffic', label: '流量统计', labelEn: 'Traffic', desc: '本站访问数据', descEn: 'Site visit stats' },
  { href: '/articles/creation-calendar', label: '创作日历', labelEn: 'Writing Calendar', desc: '个人创作实验', descEn: 'Personal writing experiment' },
  { href: '/changelog', label: '更新记录', labelEn: 'Changelog', desc: '站点迭代归档', descEn: 'Site iteration archive' },
  { href: '/context-memory', label: '上下文记忆', labelEn: 'Context Memory', desc: '个人智能体实验', descEn: 'Personal agent experiment', audience: 'owner' },
]

/**
 * 解析单项最终生效的 audience：
 *  1. 优先 overrides[href]（站长后台 D1 覆盖）
 *  2. 否则用 item.audience
 *  3. 默认 'public'
 */
export function resolveItemAudience(item, overrides) {
  const fromOverride = overrides && item?.href ? overrides[item.href] : null
  return fromOverride || item?.audience || 'public'
}

/**
 * 判定某个导航 item 是否对当前 account 可见。
 * - audience 缺省 / 'public'：所有访客可见
 * - audience: 'owner'：仅站长（account.isOwner）可见
 * - audience: 'authed'：任意登录用户（account.user）可见
 *
 * 设计原则：菜单和站点地图都按用户身份过滤，不向普通访客暴露他们点进去也只会被
 * gate 拦截的私域入口；站长登录后这些入口才出现。
 */
export function isItemVisibleForAccount(item, account, overrides = null) {
  const audience = resolveItemAudience(item, overrides)
  if (audience === 'public') return true
  if (!account) return false
  if (audience === 'owner') return Boolean(account.isOwner)
  if (audience === 'authed') return Boolean(account.user)
  return true
}

/** 扁平展开所有路由，供 /map 等使用；传入 account 时按身份过滤。 */
export function flattenChannelRoutes(account = null, overrides = null) {
  const fromChannels = SITE_CHANNELS.flatMap((channel) =>
    channel.sections.flatMap((section) =>
      section.items
        .filter((item) => isItemVisibleForAccount(item, account, overrides))
        .map((item) => ({
          channel: channel.label,
          section: section.title,
          ...item,
          effectiveAudience: resolveItemAudience(item, overrides),
        }))
    )
  )
  if (!isItemVisibleForAccount(SITE_ADMIN_NAV_LINK, account, overrides)) return fromChannels
  return [
    ...fromChannels,
    {
      channel: '顶部导航',
      section: '站长',
      ...SITE_ADMIN_NAV_LINK,
      effectiveAudience: resolveItemAudience(SITE_ADMIN_NAV_LINK, overrides),
    },
  ]
}

/** 不做身份过滤，专给后台/调试列出全部 item + 生效 audience 用。 */
export function flattenChannelRoutesRaw(overrides = null) {
  const fromChannels = SITE_CHANNELS.flatMap((channel) =>
    channel.sections.flatMap((section) =>
      section.items.map((item) => ({
        scope: 'channel',
        channel: channel.label,
        channelKey: channel.key,
        section: section.title,
        href: item.href,
        label: item.label,
        desc: item.desc || '',
        tag: item.tag || '',
        external: Boolean(item.external),
        navHidden: item.nav === false,
        defaultAudience: item.audience || 'public',
        effectiveAudience: resolveItemAudience(item, overrides),
        overridden: Boolean(overrides && overrides[item.href]),
      }))
    )
  )
  const fromTopNav = [
    {
      scope: 'top-nav',
      channel: '顶部导航',
      channelKey: 'admin',
      section: '站长',
      href: SITE_ADMIN_NAV_LINK.href,
      label: SITE_ADMIN_NAV_LINK.label,
      desc: SITE_ADMIN_NAV_LINK.desc || '',
      tag: '',
      external: false,
      navHidden: false,
      defaultAudience: SITE_ADMIN_NAV_LINK.audience || 'public',
      effectiveAudience: resolveItemAudience(SITE_ADMIN_NAV_LINK, overrides),
      overridden: Boolean(overrides && overrides[SITE_ADMIN_NAV_LINK.href]),
    },
  ]
  const fromFooter = SITE_FOOTER_LINKS.map((item) => ({
    scope: 'footer',
    channel: '页脚',
    channelKey: 'footer',
    section: '页脚链接',
    href: item.href,
    label: item.label,
    desc: item.desc || '',
    tag: item.tag || '',
    external: Boolean(item.external),
    navHidden: false,
    defaultAudience: item.audience || 'public',
    effectiveAudience: resolveItemAudience(item, overrides),
    overridden: Boolean(overrides && overrides[item.href]),
  }))
  return [...fromChannels, ...fromTopNav, ...fromFooter]
}

/** 页脚链接按 account/overrides 过滤后输出。 */
export function getFooterLinks(account = null, overrides = null) {
  return SITE_FOOTER_LINKS.filter((item) =>
    isItemVisibleForAccount(item, account, overrides)
  )
}

/**
 * 主导航只展示精选入口；/map 继续展示完整入口。
 * 传入 account 时按身份再过滤一层（owner-only 项目仅对站长展示）。
 */
export function getChannelNavSections(channel, account = null, overrides = null) {
  return channel.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.nav !== false
          && isItemVisibleForAccount(item, account, overrides)
      ),
    }))
    .filter((section) => section.items.length > 0)
}

/** /map 等需要保留 nav:false 项目，但仍按 account 过滤可见性。 */
export function getChannelAllSections(channel, account = null, overrides = null) {
  return channel.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        isItemVisibleForAccount(item, account, overrides)
      ),
    }))
    .filter((section) => section.items.length > 0)
}
