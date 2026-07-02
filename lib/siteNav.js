/**
 * 站点导航分类（5 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：内容 / 资源 / 工具 / 社区 / 关于（平台化板块收敛，2026-07）
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；tag 用于少量精选菜单角标
 * nav: false 表示不出现在主导航，但仍保留在 /map 站点地图
 * 注意：section 的中文 title 是 SiteHeader TIER_SECTION_STYLES 的样式键，改名要同步
 */
export const SITE_CHANNELS = [
  {
    key: 'content',
    label: '内容',
    labelEn: 'Content',
    href: '/articles',
    match: (p) =>
      p?.startsWith('/articles') ||
      p?.startsWith('/feed') ||
      p?.startsWith('/diary') ||
      p?.startsWith('/people') ||
      p?.startsWith('/dad-stack'),
    sections: [
      {
        title: '专栏',
        titleEn: 'Column',
        items: [
          { href: '/feed', label: '灵感', labelEn: 'Inspiration', desc: '一点灵感、一点启发', descEn: 'A spark of inspiration', tag: 'New' },
          { href: '/articles?tab=posts', label: '精选文章', labelEn: 'Featured', desc: '个人判断与原创长文', descEn: 'Original essays & judgment' },
          { href: '/dad-stack', label: 'Dad Stack', labelEn: 'Dad Stack', desc: 'AI × 工程 × 父亲的育儿线', descEn: 'AI × engineering × fatherhood' },
          { href: '/articles/creation-calendar', label: '创作日历', labelEn: 'Writing Calendar', desc: '本站与掘金写作节奏', descEn: 'Cadence on this site & Juejin', nav: false },
          { href: '/diary', label: '网络日志', labelEn: 'Weblog', desc: '阶段性想法、生活片段与长期记录', descEn: 'Notes, life fragments & long-running records' },
        ],
      },
      {
        title: '调研',
        titleEn: 'Research',
        items: [
          { href: '/articles?tab=companies', label: '公司调研', labelEn: 'Company Research', desc: '公司画像与商业分析', descEn: 'Company profiles & analysis' },
          { href: '/articles?tab=topics', label: '事项调研', labelEn: 'Topic Research', desc: '技术、行业、市场与写作', descEn: 'Tech, industry, market & writing' },
          { href: '/articles?tab=people', label: '人物调研', labelEn: 'People Research', desc: '创作者、企业家与学者', descEn: 'Creators, founders & scholars' },
        ],
      },
    ],
  },
  {
    key: 'resources',
    label: '资源',
    labelEn: 'Resources',
    href: '/articles?tab=resources',
    match: (p) =>
      p?.startsWith('/bookmarks') ||
      p?.startsWith('/resources') ||
      p?.startsWith('/reading') ||
      p?.startsWith('/history') ||
      p?.startsWith('/classical-masterpieces') ||
      p?.startsWith('/ru-shi-dao') ||
      p?.startsWith('/china-politics'),
    sections: [
      {
        title: '资源',
        titleEn: 'Archive',
        items: [
          // 主导航下拉：资源库（全部）+ 资源库真实分类（与 /articles?tab=resources 的筛选一一对应）
          { href: '/articles?tab=resources', label: '资源库', labelEn: 'Library', desc: '原文、谱系与索引', descEn: 'Sources, lineage & index' },
          { href: '/articles?tab=resources&resource_type=ai-dev', label: 'AI 与开发', labelEn: 'AI & Dev', desc: '大模型教程、AI 工具与开发资源', descEn: 'LLM tutorials, AI tools & dev resources' },
          { href: '/articles?tab=resources&resource_type=humanities-politics', label: '人文与政经', labelEn: 'Humanities & Politics', desc: '古典名篇、思想体系与政经资料', descEn: 'Classics, thought systems & politics' },
          { href: '/articles?tab=resources&resource_type=external-archive', label: '外部收藏', labelEn: 'External Picks', desc: 'RSS、推特与 YouTube 收藏', descEn: 'RSS, X & YouTube picks' },
          { href: '/articles?tab=resources&resource_type=workplace', label: '职场资料', labelEn: 'Workplace', desc: '置身 X 内 · 大厂职场文本合集', descEn: 'Workplace text archive' },
          { href: '/resources/wallpapers', label: '壁纸下载', labelEn: 'Wallpapers', desc: '可下载壁纸资源', descEn: 'Downloadable wallpapers' },
          // 以下为具体资源页面，保留在 /map 站点地图，不进主导航下拉
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
    ],
  },
  {
    key: 'tools',
    label: '工具',
    labelEn: 'Tools',
    href: '/tools',
    match: (p) =>
      p?.startsWith('/tools') ||
      p?.startsWith('/works') ||
      p?.startsWith('/cancers-overview') ||
      p?.startsWith('/sun-moon-motion') ||
      p?.startsWith('/ai-token-usage-research') ||
      p?.startsWith('/zhang-juzheng-book') ||
      p?.startsWith('/platform-framework-pairs') ||
      p?.startsWith('/skill-center') ||
      p?.startsWith('/web-llm') ||
      p?.startsWith('/stock-analysis') ||
      p?.startsWith('/agent-world-cup') ||
      p?.startsWith('/public-opinion') ||
      p?.startsWith('/eatwhat') ||
      p?.startsWith('/xiaomoli-dad-todo') ||
      p?.startsWith('/voice-tasks') ||
      p?.startsWith('/context-memory') ||
      p?.startsWith('/downloads'),
    sections: [
      {
        title: '工具箱',
        titleEn: 'Toolbox',
        items: [
          { href: '/tools', label: '工具库', labelEn: 'Tools', desc: '站内工具、插件与工作流', descEn: 'Site tools, extensions & workflows' },
          { href: '/works#room-browser-extension', label: '浏览器扩展', labelEn: 'Browser Extensions', desc: '可下载的网页工作流小工具', descEn: 'Downloadable browser workflow tools', tag: 'New' },
          { href: '/eatwhat', label: '吃什么', labelEn: 'What to Eat', desc: '今天点什么的小工具', descEn: 'A tiny what-to-order tool', nav: false },
          { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', labelEn: 'Dad To-Do', desc: '日常 / 习惯 / 家庭节奏', descEn: 'Daily / habits / family rhythm', audience: 'owner' },
          { href: '/voice-tasks', label: '语音记事', labelEn: 'Voice Notes', desc: '随手说一段，落到文字', descEn: 'Speak a bit, save as text', audience: 'owner' },
        ],
      },
      {
        title: '系统',
        titleEn: 'Systems',
        items: [
          { href: '/works', label: '作品展厅', labelEn: 'Work Gallery', desc: '产品、AI 工程与长期系统', descEn: 'Products, AI engineering & systems' },
          { href: '/agent-world-cup', label: 'Agent世界杯', labelEn: 'Agent World Cup', desc: '2026世界杯赛程·分组·资讯', descEn: '2026 FIFA World Cup schedule & news', tag: 'Hot' },
          { href: '/skill-center', label: 'Skill 中心', labelEn: 'Skill Center', desc: '模型与智能体能力货架', descEn: 'Model & agent capability shelf' },
          { href: '/public-opinion', label: '舆情分析', labelEn: 'Public Opinion', desc: '公开内容采集与观点趋势工作台', descEn: 'Public monitoring & opinion trends', audience: 'owner', nav: false },
          { href: '/stock-analysis', label: '交易分析', labelEn: 'Trade Analysis', desc: '多标的 · 分钟级交易分析快照库', descEn: 'Multi-symbol, minute-level trade analysis snapshots', audience: 'owner', nav: false },
          { href: '/context-memory', label: '上下文记忆', labelEn: 'Context Memory', desc: '我的工作记忆架构', descEn: 'My working-memory architecture', nav: false },
        ],
      },
      {
        title: '多维页面',
        titleEn: 'Rich Pages',
        items: [
          { href: '/cancers-overview', label: '癌症全景', labelEn: 'Cancer Overview', desc: '10 种主要癌症 · 多维可视化', descEn: '10 major cancers · multi-view', nav: false },
          { href: '/platform-framework-pairs', label: 'AI Runtime 三极格局', labelEn: 'AI Runtime Tripolar', desc: '11 组配对可视化与研报', descEn: '11 pairings, visuals & report', nav: false },
          { href: '/ai-token-usage-research', label: 'AI Token 用量调研', labelEn: 'AI Token Usage', desc: '日耗 1 亿 / 4.5 亿 双账户对照', descEn: '100M vs 450M daily, two accounts', nav: false },
          { href: '/sun-moon-motion', label: '日月运行可视化', labelEn: 'Sun & Moon Motion', desc: '太阳轨迹 · 月相循环', descEn: 'Solar path · lunar phases', nav: false },
          { href: '/zhang-juzheng-book', label: '《张居正》写作工程', labelEn: '"Zhang Juzheng" Writing', desc: '长期富页面项目', descEn: 'Long-term rich-page project', nav: false },
        ],
      },
    ],
  },
  {
    key: 'community',
    label: '社区',
    labelEn: 'Community',
    href: '/community',
    match: (p) =>
      p?.startsWith('/community') ||
      p?.startsWith('/messages') ||
      p?.startsWith('/ranbi') ||
      p?.startsWith('/donate') ||
      p?.startsWith('/services') ||
      p?.startsWith('/project-manager') ||
      p?.startsWith('/writing-monetization-2026'),
    sections: [
      {
        title: '参与',
        titleEn: 'Participate',
        items: [
          { href: '/messages', label: '留言板', labelEn: 'Guestbook', desc: '给我留言，聊聊想法', descEn: 'Leave a message', tag: 'Login' },
          { href: '/community', label: '讨论中心', labelEn: 'Discussion Hub', desc: '评论动态、通知与社群入口', descEn: 'Comment feed, notifications & groups' },
          { href: '/ranbi', label: '燃币说明', labelEn: 'Ranbi Guide', desc: '留存、交流与资源权益', descEn: 'Retention, discussion & resource access' },
          { href: '/donate', label: '支持本站', labelEn: 'Support This Site', desc: '支持维护，也可私聊调整燃币', descEn: 'Support maintenance & Ranbi top-up', nav: false },
        ],
      },
      {
        title: '合作',
        titleEn: 'Collaborate',
        items: [
          { href: '/services', label: '合作说明', labelEn: 'Collaboration', desc: '咨询、调研与内容协作', descEn: 'Consulting, research & content' },
          { href: 'https://blogger-alliance.cn/', label: '博主联盟', labelEn: 'Blogger Alliance', desc: 'AI 产品方与技术博主', descEn: 'AI products ↔ tech bloggers', external: true },
          { href: 'https://frontendnext.com/', label: '前端周看', labelEn: 'Frontend Weekly', desc: '前端与 AI Agent 情报站', descEn: 'Frontend & AI Agent intel', external: true },
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
      p?.startsWith('/about') ||
      p?.startsWith('/publications') ||
      p?.startsWith('/traffic') ||
      p?.startsWith('/changelog') ||
      p?.startsWith('/map'),
    sections: [
      {
        title: '站点',
        titleEn: 'Site',
        items: [
          { href: '/site', label: '关于本站', labelEn: 'About This Site', desc: '这里是什么、如何参与', descEn: 'What this site is & how to participate', tag: 'New' },
          { href: '/map', label: '索引', labelEn: 'Index', desc: '全站结构化入口', descEn: 'Structured entry to the site' },
          { href: '/changelog', label: '更新记录', labelEn: 'Changelog', desc: '按周梳理本站演进', descEn: 'Weekly site evolution' },
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
  { href: '/services', label: '聊合作', labelEn: 'Collaborate', desc: '咨询 / 写作 / 推广', descEn: 'Consulting / writing / promotion' },
  { href: '/messages', label: '留言板', labelEn: 'Guestbook', desc: '给我留言', descEn: 'Leave a message' },
  { href: '/rss.xml', label: 'RSS', labelEn: 'RSS', desc: '订阅 RSS', descEn: 'Subscribe via RSS', external: true },
  { href: '/donate', label: '支持本站', labelEn: 'Support This Site', desc: '维护成本 / 燃币调整', descEn: 'Maintenance & Ranbi top-up' },
  { href: '/traffic', label: '流量统计', labelEn: 'Traffic', desc: '本站访问数据', descEn: 'Site visit stats' },
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
  return SITE_FOOTER_LINKS.filter((item) => isItemVisibleForAccount(item, account, overrides))
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
        (item) => item.nav !== false && isItemVisibleForAccount(item, account, overrides)
      ),
    }))
    .filter((section) => section.items.length > 0)
}

/** /map 等需要保留 nav:false 项目，但仍按 account 过滤可见性。 */
export function getChannelAllSections(channel, account = null, overrides = null) {
  return channel.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isItemVisibleForAccount(item, account, overrides)),
    }))
    .filter((section) => section.items.length > 0)
}
