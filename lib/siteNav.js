/**
 * 站点导航分类（4 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：内容 / 项目 / 商业 / 关于
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；hot/new 用于在菜单里加角标
 * nav: false 表示不出现在主导航，但仍保留在 /map 站点地图
 */
export const SITE_CHANNELS = [
  {
    key: 'content',
    label: '读文章',
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
        items: [
          { href: '/articles?tab=posts', label: '精选文章', desc: '个人判断 / 原创长文' },
          { href: '/works', label: '多维页面', desc: '可视化 / 富页面 / 长期工程' },
          { href: '/articles/creation-calendar', label: '创作日历', desc: '本站与掘金写作节奏与产出记录', nav: false },
        ],
      },
      {
        title: '调研',
        items: [
          { href: '/articles?tab=companies', label: '公司调研', desc: '公司画像 / 商业分析' },
          { href: '/articles?tab=topics', label: '事项调研', desc: '技术 / 行业 / 市场 / 写作' },
          { href: '/articles?tab=people', label: '人物调研', desc: '创作者 / 企业家 / 学者' },
        ],
      },
      {
        title: '资料',
        items: [
          { href: '/articles?tab=resources', label: '站内资料', desc: '原文 / 谱系 / 索引' },
          { href: '/classical-masterpieces', label: '古典名篇', desc: '单篇封神作品谱系', tag: 'New' },
          { href: '/china-politics', label: '政经资料', desc: '当代中国研究' },
          { href: '/reading', label: '书目索引', desc: '正在读 / 想读 / 笔记' },
          { href: '/bookmarks', label: '资源收藏', desc: '外部材料 / 教程 / 工具' },
          { href: '/history/ming-qing', label: '历史', desc: '明清 / 三国 / 长篇笔记', nav: false },
          { href: '/ru-shi-dao', label: '儒释道', desc: '思想体系笔记', nav: false },
        ],
      },
    ],
  },
  {
    key: 'projects',
    label: '看项目',
    href: '/ai-projects',
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
        title: 'AI 系统',
        items: [
          { href: '/ai-projects', label: 'AI 项目', desc: '公开图谱 / 私有管理台' },
          { href: '/skill-center', label: 'Skill 中心', desc: '模型 / 智能体能力货架', tag: 'New' },
          { href: '/context-memory', label: '上下文记忆', desc: '我的工作记忆架构', nav: false },
        ],
      },
      {
        title: '多维页面',
        items: [
          { href: '/works', label: '多维页面', desc: '富数据可视化 / 实测 / 长期工程', tag: 'New' },
          { href: '/cancers-overview', label: '癌症全景', desc: '10 种主要癌症 · 多维可视化', tag: 'New', nav: false },
          { href: '/platform-framework-pairs', label: 'Anthropic×Bun · CF×VoidZero · Vercel×Next 三极割据', desc: 'AI 公司下场抢 runtime · 10 节研报 + 11 组配对可视化', tag: 'Hot', nav: false },
          { href: '/ai-token-usage-research', label: 'AI Token 用量调研', desc: '日耗 1 亿 / 4.5 亿 双账户对照', nav: false },
          { href: '/sun-moon-motion', label: '日月运行可视化', desc: '太阳轨迹 · 月相循环', nav: false },
          { href: '/zhang-juzheng-book', label: '《张居正》写作工程', desc: '长期富页面项目', nav: false },
        ],
      },
      {
        title: '生活 / 工具',
        items: [
          { href: '/eatwhat', label: '吃什么', desc: '今天点什么的小工具', nav: false },
          { href: '/xiaomoli-dad-todo', label: '茉莉奶爸待办', desc: '日常 / 习惯 / 家庭节奏', audience: 'owner' },
          { href: '/voice-tasks', label: '语音记事', desc: '随手说一段，落到文字', audience: 'owner' },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: '聊合作',
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
        items: [
          { href: 'https://blogger-alliance.cn/', label: '博主联盟', desc: 'AI 产品方 ↔ 技术博主', external: true, tag: 'Hot' },
          { href: 'https://frontendnext.com/', label: '前端周看', desc: '前端 / AI Agent 情报站', external: true, tag: 'Hot' },
          { href: 'https://publishlab.cc/', label: 'PublishLab', desc: 'AI 写作 / 内容创作 / 数字出版', external: true, tag: 'New' },
        ],
      },
      {
        title: '服务',
        items: [
          { href: '/services', label: '合作说明', desc: '咨询 / 调研 / 内容协作' },
          { href: '/project-manager', label: '项目经理视角', desc: '团队 / 协作 / 交付', nav: false },
          { href: '/community', label: '社群', desc: '线上 / 线下圈子', nav: false },
        ],
      },
      {
        title: '作品',
        items: [
          { href: '/publications', label: '出版作品', desc: '《程序员成长手记》等', nav: false },
        ],
      },
    ],
  },
  {
    key: 'about',
    label: '关于我',
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
        items: [
          { href: '/about', label: '关于', desc: '自我介绍 / 履历' },
          { href: '/diary', label: '日志', desc: '近期想法与片段' },
          { href: '/messages', label: '留言板', desc: '给我留言', tag: 'Login', nav: false },
        ],
      },
      {
        title: '站点',
        items: [
          { href: '/map', label: '索引', desc: '全站结构化入口', tag: 'New' },
          { href: '/changelog', label: '更新记录', desc: '按周梳理本站演进' },
          { href: '/traffic', label: '流量', desc: '本站访问数据', nav: false },
        ],
      },
      {
        title: '支持',
        items: [
          { href: '/donate', label: '请喝咖啡', desc: '支持我继续写', nav: false },
        ],
      },
    ],
  },
]

/** 顶部主导航「关于我」之后的站长入口（非下拉频道）。 */
export const SITE_ADMIN_NAV_LINK = {
  href: '/admin',
  label: '后台管理',
  desc: '站长控制台 · D1 / Ops / 配置',
  audience: 'owner',
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
  { href: '/about', label: '关于我', desc: '自我介绍 / 履历' },
  { href: '/services', label: '聊合作', desc: '咨询 / 写作 / 推广' },
  { href: '/messages', label: '留言板', desc: '给我留言' },
  { href: '/rss.xml', label: 'RSS', desc: '订阅 RSS', external: true },
  { href: '/donate', label: 'Buy Me a Coffee', desc: '支持我继续写' },
  { href: '/traffic', label: '流量统计', desc: '本站访问数据' },
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
