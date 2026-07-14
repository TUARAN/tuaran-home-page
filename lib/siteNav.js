/**
 * 站点导航分类（5 频道两级菜单 + /map 站点地图共享数据源）
 *
 * 一级频道：内容 / 工具 / 系统 / 圈子 / 关于（2026-07；资源归入内容）
 * 每个 channel 含 sections（折叠分组）和扁平 routes 列表（/map 用）
 *
 * external: true 表示外链；tag 用于少量精选菜单角标
 * nav: false 表示不出现在主导航，但仍保留在 /map 站点地图
 * 注意：section 的中文 title 是 SiteHeader TIER_SECTION_STYLES 的样式键，改名要同步
 */

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
      p?.startsWith('/china-politics'),
    sections: [
      {
        title: '创作',
        titleEn: 'Writing',
        items: [
          { href: '/articles', label: '文章与分析', labelEn: 'Writing & Analysis', desc: '原创文章、专题分析与资源总索引', descEn: 'Writing, analysis & archives' },
          { href: '/feed', label: '灵感', labelEn: 'Inspiration', desc: '一点灵感、一点启发', descEn: 'A spark of inspiration' },
          { href: '/articles?tab=column', label: '创作库', labelEn: 'Creation Library', desc: '全部文章与多维页面', descEn: 'All writing & rich pages', nav: false },
          { href: '/rich-pages', label: '多维页面', labelEn: 'Rich Pages', desc: '交互分析、宣发与内容展示', descEn: 'Interactive analysis, launch & content pages' },
          { href: '/articles?tab=posts', label: '精选文章', labelEn: 'Featured', desc: '个人判断与原创长文', descEn: 'Original essays & judgment' },
          { href: '/frontend-weekly', label: '前端周看', labelEn: 'Frontend Weekly', desc: '周刊、每日精选与每时新闻', descEn: 'Weekly, daily picks & hourly news', tag: 'New' },
          { href: '/dad-stack', label: 'Dad Stack', labelEn: 'Dad Stack', desc: 'AI × 工程 × 父亲的育儿线', descEn: 'AI × engineering × fatherhood', audience: 'owner', nav: false },
          { href: '/diary', label: '浮生日记', labelEn: 'Weblog', desc: '阶段性想法、生活片段、年中年终总结与长期记录', descEn: 'Notes, periodic reviews & long-running records', nav: false },
        ],
      },
      {
        title: '分析',
        titleEn: 'Analysis',
        items: [
          { href: '/articles?tab=research', label: '全部分析', labelEn: 'All Analysis', desc: '观点、实践、专题与观察', descEn: 'Opinions, practice, topics & profiles' },
          { href: '/articles?tab=companies', label: '公司观察', labelEn: 'Company Analysis', desc: '公司画像与商业分析', descEn: 'Company profiles & analysis' },
          { href: '/articles?tab=topics', label: '专题', labelEn: 'Topics', desc: '技术、行业、市场与写作', descEn: 'Tech, industry, market & writing', tag: 'Hot' },
          { href: '/articles?tab=people', label: '人物', labelEn: 'People', desc: '创作者、企业家与学者', descEn: 'Creators, founders & scholars' },
        ],
      },
      {
        title: '资源',
        titleEn: 'Archive',
        items: [
          // 主导航下拉与资源页的一级筛选一一对应。
          { href: '/articles?tab=resources', label: '资源库', labelEn: 'Library', desc: '全部内容、收藏与下载资源', descEn: 'All content, saved picks & downloads' },
          { href: '/articles?tab=resources&resource_group=content', label: '内容资源', labelEn: 'Content Resources', desc: 'AI 与开发、人文政经、职场与 AI 音乐', descEn: 'AI, humanities, workplace & music' },
          { href: '/articles?tab=resources&resource_group=external', label: '国外资源', labelEn: 'Global Resources', desc: 'RSS、推特与 YouTube 收藏', descEn: 'RSS, X & YouTube picks' },
          { href: '/articles?tab=resources&resource_group=downloads', label: '壁纸收藏', labelEn: 'Wallpaper Collection', desc: '可下载壁纸资源', descEn: 'Downloadable wallpapers', tag: 'New' },
          { href: '/resources/ai-learning-library', label: '安东尼学 AI', labelEn: 'Anthony Learns AI', desc: 'AI 书目与学习资料', descEn: 'AI books and learning resources', tag: 'Hot' },
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
      p?.startsWith('/browser-extensions') ||
      p?.startsWith('/desktop-apps') ||
      isToolResourcePath(p) ||
      p?.startsWith('/cancers-overview') ||
      p?.startsWith('/sun-moon-motion') ||
      p?.startsWith('/ai-token-usage-research') ||
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
          { href: '/tools#online', label: '在线工具', labelEn: 'Online Tools', desc: '网页可用工具目录', descEn: 'Browser-based tools' },
          { href: '/tools#downloads', label: '插件下载', labelEn: 'Downloads', desc: '扩展与客户端目录', descEn: 'Extensions and apps' },
          { href: '/browser-extensions', label: '浏览器扩展', labelEn: 'Extensions', desc: '网页工作流插件', descEn: 'Browser workflow add-ons' },
          { href: '/desktop-apps', label: '桌面应用', labelEn: 'Desktop', desc: 'Windows / macOS', descEn: 'Windows / macOS', tag: 'New' },
        ],
      },
      {
        title: '分析',
        titleEn: 'Analysis',
        items: [
          { href: '/tools#analysis', label: '分析工具', labelEn: 'Analysis Tools', desc: '监测与研判目录', descEn: 'Monitoring and insights' },
          { href: '/public-opinion', label: '舆情分析', labelEn: 'Public Opinion', desc: '公开内容与趋势', descEn: 'Public signals and trends' },
          { href: '/stock-analysis', label: '交易分析', labelEn: 'Trading', desc: '分钟级交易快照', descEn: 'Minute-level snapshots' },
        ],
      },
      {
        title: '开发',
        titleEn: 'Build',
        items: [
          { href: '/tools#ai-dev', label: '开发工具', labelEn: 'Dev Tools', desc: 'AI 工程与工作流目录', descEn: 'AI engineering workflows' },
          { href: '/tools#indexes', label: '索引工具', labelEn: 'Tool Indexes', desc: '外部工具目录', descEn: 'External tool directories' },
          { href: 'https://toolkit-hub.pages.dev/', label: '代码矿工', labelEn: 'Code Miner', desc: '开发者工具集合', descEn: 'Developer tool collection', external: true },
          { href: '/web-llm', label: '端侧大模型', labelEn: 'On-device LLM', desc: '浏览器端大模型实验', descEn: 'In-browser LLM lab' },
        ],
      },
      {
        title: '多维页面',
        titleEn: 'Rich Pages',
        items: [
          { href: '/cancers-overview', label: '癌症全景', labelEn: 'Cancer Overview', desc: '10 种主要癌症 · 多维可视化', descEn: '10 major cancers · multi-view', nav: false },
          { href: '/tang-ping-map', label: '躺平地图', labelEn: 'Tang Ping Map', desc: '低总价房源 · 地图筛选', descEn: 'Low-price housing map', nav: false },
          { href: '/platform-framework-pairs', label: 'AI Runtime 三极格局', labelEn: 'AI Runtime Tripolar', desc: '11 组配对可视化与研报', descEn: '11 pairings, visuals & report', nav: false },
          { href: '/ai-token-usage-research', label: 'AI Token 用量调研', labelEn: 'AI Token Usage', desc: '日耗 1 亿 / 4.5 亿 双账户对照', descEn: '100M vs 450M daily, two accounts', nav: false },
          { href: '/x-mutual-aid-circle', label: 'X 互帮互助', labelEn: 'X Creator Circle', desc: '社群增长工具页', descEn: 'Creator growth toolkit', nav: false },
          { href: '/sun-moon-motion', label: '日月运行可视化', labelEn: 'Sun & Moon Motion', desc: '太阳轨迹 · 月相循环', descEn: 'Solar path · lunar phases', nav: false },
          { href: '/zhang-juzheng-book', label: '《张居正》写作工程', labelEn: '"Zhang Juzheng" Writing', desc: '长期富页面项目', descEn: 'Long-term rich-page project', nav: false },
          { href: '/xiaomoli-dad-todo', label: '小茉莉的爸爸带娃清单', labelEn: 'Dad To-Do', desc: '日常 / 习惯 / 家庭节奏', descEn: 'Daily / habits / family rhythm', audience: 'owner', nav: false },
          { href: '/eatwhat', label: '吃什么', labelEn: 'What to Eat', desc: '家庭餐食决策与宝宝菜单', descEn: 'Family meal decisions & baby menu', nav: false },
        ],
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
      p?.startsWith('/agent-world-cup') ||
      p?.startsWith('/skill-center') ||
      p?.startsWith('/context-memory'),
    sections: [
      {
        title: '系统',
        titleEn: 'Systems',
        items: [
          { href: '/works', label: '作品展厅', labelEn: 'Work Gallery', desc: '产品、AI 工程与长期系统', descEn: 'Products, AI engineering & systems' },
          { href: '/agent-world-cup', label: 'Agent世界杯', labelEn: 'Agent World Cup', desc: '2026世界杯赛程·分组·资讯', descEn: '2026 FIFA World Cup schedule & news', tag: 'Hot' },
          { href: '/skill-center', label: 'Skill 中心', labelEn: 'Skill Center', desc: '模型与智能体能力货架', descEn: 'Model & agent capability shelf' },
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
          { href: '/community', label: '讨论中心', labelEn: 'Discussion Hub', desc: '留言、评论动态、通知与社群入口', descEn: 'Messages, comments, notifications & groups' },
          { href: '/ranbi', label: '燃币说明', labelEn: 'Ranbi Guide', desc: '留存、交流与资源权益', descEn: 'Retention, discussion & resource access' },
          { href: '/donate', label: '支持本站', labelEn: 'Support This Site', desc: '支持维护，也可私聊调整燃币', descEn: 'Support maintenance & Ranbi top-up', nav: false },
        ],
      },
      {
        title: '合作',
        titleEn: 'Collaborate',
        items: [
          { href: '/services', label: '合作说明', labelEn: 'Collaboration', desc: '咨询、分析与内容协作', descEn: 'Consulting, analysis & content' },
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
          { href: '/site', label: '关于本站', labelEn: 'About This Site', desc: '这里是什么、如何参与', descEn: 'What this site is & how to participate', tag: 'New' },
          { href: '/articles/creation-calendar', label: '创作日历', labelEn: 'Writing Calendar', desc: '本站与掘金写作节奏', descEn: 'Cadence on this site & Juejin' },
          { href: '/map', label: '全站导航', labelEn: 'Site Map', desc: '全站结构化入口', descEn: 'Structured entry to the site' },
          { href: '/privacy', label: '隐私政策', labelEn: 'Privacy', desc: '数据、Cookie 与广告说明', descEn: 'Data, cookies & ads' },
          { href: '/editorial', label: '内容说明', labelEn: 'Editorial Policy', desc: '作者责任、工具使用与更正机制', descEn: 'Authorship, tools & corrections' },
          { href: '/contact', label: '联系方式', labelEn: 'Contact', desc: '邮件、微信与合作入口', descEn: 'Email, WeChat & collaboration' },
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
  { href: '/originals', label: '原创内容', labelEn: 'Originals', desc: '原创文章 / 分析 / 作品', descEn: 'Writing / analysis / works' },
  { href: '/editorial', label: '内容说明', labelEn: 'Editorial Policy', desc: '作者责任 / 工具 / 更正', descEn: 'Authorship / tools / corrections' },
  { href: '/privacy', label: '隐私政策', labelEn: 'Privacy', desc: '数据 / Cookie / 广告', descEn: 'Data / cookies / ads' },
  { href: '/contact', label: '联系', labelEn: 'Contact', desc: '邮件 / 微信 / 合作', descEn: 'Email / WeChat / collaboration' },
  { href: '/services', label: '聊合作', labelEn: 'Collaborate', desc: '咨询 / 写作 / 推广', descEn: 'Consulting / writing / promotion' },
  { href: '/community', label: '讨论中心', labelEn: 'Discussion Hub', desc: '留言、评论与社群', descEn: 'Messages, comments & groups' },
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
