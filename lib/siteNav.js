/**
 * 站点导航分类（4 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：阅读 / 作品 / 合作 / 关于
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；hot/new 用于在菜单里加角标
 * nav: false 表示不出现在主导航，但仍保留在 /map 站点地图
 */
export const SITE_CHANNELS = [
  {
    key: 'content',
    label: '阅读',
    labelEn: 'Reading',
    href: '/articles',
    match: (p) =>
      p?.startsWith('/articles') ||
      p?.startsWith('/works') ||
      p?.startsWith('/reading') ||
      p?.startsWith('/bookmarks') ||
      p?.startsWith('/history') ||
      p?.startsWith('/classical-masterpieces') ||
      p?.startsWith('/people') ||
      p?.startsWith('/ru-shi-dao') ||
      p?.startsWith('/china-politics'),
    sections: [
      {
        title: '专栏',
        titleEn: 'Column',
        items: [
          { href: '/articles?tab=posts', label: '精选文章', labelEn: 'Featured', desc: '个人判断与原创长文', descEn: 'Original essays & judgment' },
          { href: '/articles/creation-calendar', label: '创作日历', labelEn: 'Writing Calendar', desc: '本站与掘金写作节奏', descEn: 'Cadence on this site & Juejin', nav: false },
          { href: '/diary', label: '近期日志', labelEn: 'Recent Notes', desc: '阶段性想法与生活片段', descEn: 'Thoughts & life fragments' },
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
      {
        title: '资料',
        titleEn: 'Archive',
        items: [
          { href: '/articles?tab=resources', label: '资料库', labelEn: 'Library', desc: '原文、谱系与索引', descEn: 'Sources, lineage & index' },
          { href: '/classical-masterpieces', label: '古典名篇', labelEn: 'Classics', desc: '单篇作品谱系', descEn: 'Single-work lineage', tag: 'New' },
          { href: '/china-politics', label: '政经资料', labelEn: 'Politics & Economy', desc: '当代中国研究', descEn: 'Contemporary China studies' },
          { href: '/reading', label: '书目索引', labelEn: 'Reading List', desc: '阅读计划与笔记', descEn: 'Plans & notes' },
          { href: '/bookmarks', label: '资源收藏', labelEn: 'Bookmarks', desc: '外部材料、教程与工具', descEn: 'External material, tutorials & tools' },
          { href: '/resources/wallpapers', label: '壁纸下载', labelEn: 'Wallpapers', desc: '可下载壁纸资源', descEn: 'Downloadable wallpapers', tag: 'New' },
          { href: '/history/ming-qing', label: '历史笔记', labelEn: 'History Notes', desc: '明清、三国与长篇笔记', descEn: 'Ming-Qing, Three Kingdoms & more', nav: false },
          { href: '/ru-shi-dao', label: '儒释道', labelEn: 'Ru-Shi-Dao', desc: '思想体系笔记', descEn: 'Notes on thought systems', nav: false },
        ],
      },
    ],
  },
  {
    key: 'projects',
    label: '作品',
    labelEn: 'Work',
    href: '/works',
    match: (p) =>
      p === '/ai-projects' ||
      p?.startsWith('/works') ||
      p?.startsWith('/cancers-overview') ||
      p?.startsWith('/sun-moon-motion') ||
      p?.startsWith('/ai-token-usage-research') ||
      p?.startsWith('/zhang-juzheng-book') ||
      p?.startsWith('/skill-center') ||
      p?.startsWith('/web-llm') ||
      p?.startsWith('/eatwhat') ||
      p?.startsWith('/xiaomoli-dad-todo') ||
      p?.startsWith('/voice-tasks') ||
      p?.startsWith('/context-memory'),
    sections: [
      {
        title: '系统',
        titleEn: 'Systems',
        items: [
          { href: '/works', label: '作品展厅', labelEn: 'Work Gallery', desc: '产品、AI 工程与长期系统', descEn: 'Products, AI engineering & systems', tag: 'New' },
          { href: '/ai-projects', label: 'AI 项目图谱', labelEn: 'AI Project Map', desc: '作品展厅的 AI 视角', descEn: 'AI view of the work gallery' },
          { href: '/skill-center', label: 'Skill 中心', labelEn: 'Skill Center', desc: '模型与智能体能力货架', descEn: 'Model & agent capability shelf', tag: 'New' },
          { href: '/context-memory', label: '上下文记忆', labelEn: 'Context Memory', desc: '我的工作记忆架构', descEn: 'My working-memory architecture', nav: false },
        ],
      },
      {
        title: '多维页面',
        titleEn: 'Rich Pages',
        items: [
          { href: '/cancers-overview', label: '癌症全景', labelEn: 'Cancer Overview', desc: '10 种主要癌症 · 多维可视化', descEn: '10 major cancers · multi-view', tag: 'New', nav: false },
          { href: '/platform-framework-pairs', label: 'AI Runtime 三极格局', labelEn: 'AI Runtime Tripolar', desc: '11 组配对可视化与研报', descEn: '11 pairings, visuals & report', tag: 'Hot', nav: false },
          { href: '/ai-token-usage-research', label: 'AI Token 用量调研', labelEn: 'AI Token Usage', desc: '日耗 1 亿 / 4.5 亿 双账户对照', descEn: '100M vs 450M daily, two accounts', nav: false },
          { href: '/sun-moon-motion', label: '日月运行可视化', labelEn: 'Sun & Moon Motion', desc: '太阳轨迹 · 月相循环', descEn: 'Solar path · lunar phases', nav: false },
          { href: '/zhang-juzheng-book', label: '《张居正》写作工程', labelEn: '"Zhang Juzheng" Writing', desc: '长期富页面项目', descEn: 'Long-term rich-page project', nav: false },
        ],
      },
      {
        title: '生活 / 工具',
        titleEn: 'Life / Tools',
        items: [
          { href: '/eatwhat', label: '吃什么', labelEn: 'What to Eat', desc: '今天点什么的小工具', descEn: 'A tiny what-to-order tool', nav: false },
          { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', labelEn: 'Dad To-Do', desc: '日常 / 习惯 / 家庭节奏', descEn: 'Daily / habits / family rhythm', audience: 'owner' },
          { href: '/voice-tasks', label: '语音记事', labelEn: 'Voice Notes', desc: '随手说一段，落到文字', descEn: 'Speak a bit, save as text', audience: 'owner' },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: '合作',
    labelEn: 'Collaborate',
    href: '/services',
    match: (p) =>
      p?.startsWith('/services') ||
      p?.startsWith('/publications') ||
      p?.startsWith('/community') ||
      p?.startsWith('/project-manager') ||
      p?.startsWith('/writing-monetization-2026'),
    sections: [
      {
        title: '产品',
        titleEn: 'Products',
        items: [
          { href: 'https://blogger-alliance.cn/', label: '博主联盟', labelEn: 'Blogger Alliance', desc: 'AI 产品方与技术博主', descEn: 'AI products ↔ tech bloggers', external: true, tag: 'Hot' },
          { href: 'https://frontendnext.com/', label: '前端周看', labelEn: 'Frontend Weekly', desc: '前端与 AI Agent 情报站', descEn: 'Frontend & AI Agent intel', external: true, tag: 'Hot' },
          { href: 'https://publishlab.cc/', label: 'PublishLab', labelEn: 'PublishLab', desc: 'AI 写作与数字出版', descEn: 'AI writing & digital publishing', external: true, tag: 'New' },
        ],
      },
      {
        title: '服务',
        titleEn: 'Services',
        items: [
          { href: '/services', label: '合作说明', labelEn: 'Collaboration', desc: '咨询、调研与内容协作', descEn: 'Consulting, research & content' },
          { href: '/project-manager', label: '项目经理视角', labelEn: 'PM Perspective', desc: '团队、协作与交付', descEn: 'Team, collaboration & delivery', nav: false },
          { href: '/community', label: '社群', labelEn: 'Community', desc: '线上线下连接', descEn: 'Online & offline connections', nav: false },
        ],
      },
      {
        title: '作品',
        titleEn: 'Works',
        items: [
          { href: '/publications', label: '出版作品', labelEn: 'Publications', desc: '《程序员成长手记》等', descEn: '"A Programmer\'s Growth Notes" & more', nav: false },
        ],
      },
    ],
  },
  {
    key: 'about',
    label: '关于',
    labelEn: 'About',
    href: '/about',
    match: (p) =>
      p?.startsWith('/about') ||
      p?.startsWith('/diary') ||
      p?.startsWith('/messages') ||
      p?.startsWith('/donate') ||
      p?.startsWith('/traffic') ||
      p?.startsWith('/changelog') ||
      p?.startsWith('/map'),
    sections: [
      {
        title: '个人档案',
        titleEn: 'Profile',
        items: [
          { href: '/about', label: '关于', labelEn: 'About', desc: '自我介绍 / 履历', descEn: 'Bio & résumé' },
          { href: '/messages', label: '留言板', labelEn: 'Guestbook', desc: '给我留言', descEn: 'Leave a message', tag: 'Login', nav: false },
        ],
      },
      {
        title: '站点',
        titleEn: 'Site',
        items: [
          { href: '/map', label: '索引', labelEn: 'Index', desc: '全站结构化入口', descEn: 'Structured entry to the site', tag: 'New' },
          { href: '/changelog', label: '更新记录', labelEn: 'Changelog', desc: '按周梳理本站演进', descEn: 'Weekly site evolution' },
          { href: '/traffic', label: '流量', labelEn: 'Traffic', desc: '本站访问数据', descEn: 'Site visit stats', nav: false },
        ],
      },
      {
        title: '支持',
        titleEn: 'Support',
        items: [
          { href: '/donate', label: '请喝咖啡', labelEn: 'Buy Me a Coffee', desc: '支持我继续写', descEn: 'Support my writing', nav: false },
        ],
      },
    ],
  },
]

/** 顶部主导航「关于我」之后的站长入口（非下拉频道）。 */
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
  { href: '/about', label: '关于我', labelEn: 'About', desc: '自我介绍 / 履历', descEn: 'Bio & résumé' },
  { href: '/services', label: '聊合作', labelEn: 'Collaborate', desc: '咨询 / 写作 / 推广', descEn: 'Consulting / writing / promotion' },
  { href: '/messages', label: '留言板', labelEn: 'Guestbook', desc: '给我留言', descEn: 'Leave a message' },
  { href: '/rss.xml', label: 'RSS', labelEn: 'RSS', desc: '订阅 RSS', descEn: 'Subscribe via RSS', external: true },
  { href: '/donate', label: 'Buy Me a Coffee', labelEn: 'Buy Me a Coffee', desc: '支持我继续写', descEn: 'Support my writing' },
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
