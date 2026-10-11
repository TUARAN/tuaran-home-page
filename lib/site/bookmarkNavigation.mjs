export const BOOKMARK_CATEGORIES = [
  { id: 'ai', label: 'AI 与智能体', description: '模型、Agent、生成式 AI、知识库与 AI 产品。' },
  { id: 'development', label: '开发与工程', description: '编程语言、框架、代码仓库、组件、API 与工程实践。' },
  { id: 'design', label: '设计与前端体验', description: '界面设计、图标、交互、视觉素材与站点范例。' },
  { id: 'content', label: '内容创作与分发', description: '写作、翻译、媒体发布、视频与内容平台。' },
  { id: 'community', label: '社区、博客与资讯', description: '社区、独立博客、行业资讯与聚合阅读。' },
  { id: 'product', label: '产品、商业与运营', description: '产品运营、市场、会员、专利、企业与商业服务。' },
  { id: 'finance', label: '金融、投资与 Web3', description: '股票、基金、加密资产、行情与投资研究。' },
  { id: 'productivity', label: '效率与协作工具', description: '文档、项目管理、GTD、浏览器与通用效率工具。' },
  { id: 'career', label: '学习、求职与职业', description: '课程、面试、刷题、兼职、外包与职业规划。' },
  { id: 'cloud', label: '云服务与基础设施', description: '云平台、托管、域名、网络、服务器与控制台。' },
  { id: 'work', label: '项目与工作资料', description: '历史项目、工作台备份、客户系统与内部资料入口。' },
  { id: 'life', label: '生活与兴趣', description: '生活服务、语言学习、校园资料与个人兴趣。' },
  { id: 'archive', label: '待整理归档', description: '暂时无法可靠判断主题的旧收藏和收件箱条目。' },
]

const CATEGORY_BY_ID = new Map(BOOKMARK_CATEGORIES.map((category) => [category.id, category]))

const RULES = [
  {
    id: 'work',
    path: ['工作台备份', '多益(', '亿荣(', '品牌汇', '药店联盟', '深华', '新城新特药', '在线经销模板开发', '佛山节水', '医护在线', '联动支付迁移', '优佳护'],
    text: ['jira', '禅道', 'internal project', '中国移动', 'gmcc', 'cmic.chinamobile'],
  },
  {
    id: 'career',
    path: ['职业生涯', '兼职', '外包', '刷题', '面试', '网课', '大学书签'],
    text: ['招聘', '求职', 'leetcode', '牛客网', 'boss直聘', '拉勾'],
  },
  {
    id: 'ai',
    path: ['ai', '大模型', 'llm', 'aigc'],
    text: ['chatgpt', 'openai', 'claude', 'gemini', 'deepseek', 'qwen', '通义千问', '智谱', 'kimi', 'grok', 'agent', '智能体', '人工智能', '机器之心', 'ai新智界', '大模型', 'aigc', 'pytorch', 'huggingface', 'ollama', 'comfyui', 'stable diffusion', 'midjourney', 'openclaw', 'moltbot', 'webgpu chat', 'ai-bot'],
  },
  {
    id: 'design',
    path: ['ued', '图标', '设计图', '牛逼的交互', '网站范例', '经典前端模板', '后台管理系统模板', 'bootstrap'],
    text: ['figma', 'dribbble', 'behance', 'iconfont', 'icon', '设计', '配色', '字体', '交互', 'ppt模板', 'ui ', 'ux ', 'unsplash', 'pixabay'],
  },
  {
    id: 'development',
    path: ['开发', 'github', '码云', 'coding', '开发语言', '插件组件', '小插件', '大组件', 'css', 'html', 'python', 'node', 'javascript', 'webgl', 'linux', 'uniapp', 'android', 'web app', '小程序', '模板引擎', '三大框架', 'api文档', '前端路径', '首屏加载', '压测', '爬虫'],
    text: ['github', 'gitlab', 'gitee', 'npm', 'react', 'vue', 'angular', 'next.js', 'node.js', 'javascript', 'typescript', 'python', 'golang', 'rust', 'java ', '开发', '编程', '代码', 'api', 'sdk', 'docker', 'kubernetes', 'stackoverflow', '掘金', 'segmentfault', 'web.dev', 'mdn'],
  },
  {
    id: 'content',
    path: ['掘金翻译', '我参与翻译', '我参与校对', '国外文章', '所选原文', '内容', '分发社区', '类博主联盟'],
    text: ['微信公众号', '公众号', '小红书', '抖音', 'youtube', 'bilibili', '知乎', 'medium', 'substack', '写作', '翻译', '发布', '投稿', '创作活动', '视频号', '番茄小说', '墨途文学'],
  },
  {
    id: 'community',
    path: ['社区博客', '社区', '博客', '聚合类', '日报类', '好文类', '最新资讯', '去中心'],
    text: ['社区', '论坛', '博客', 'blog', '前端周刊', 'news', 'newsletter', '资讯', '少数派', 'v2ex', 'reddit', 'hacker news', 'rss'],
  },
  {
    id: 'cloud',
    path: ['阿里云code', '平台', '服务器', '机场', '测速'],
    text: ['cloudflare', 'vercel', 'netlify', 'aliyun', '阿里云', '腾讯云', '华为云', '火山引擎', 'aws', 'azure', 'domain', '域名', 'dns', '服务器', '主机', '控制台', 'console.', 'resend'],
  },
  {
    id: 'productivity',
    path: ['文档', '项目管理', 'gtd', '工具类', '浏览器', '功能网站链接'],
    text: ['notion', 'obsidian', '飞书', '语雀', '腾讯文档', '石墨文档', 'trello', 'asana', 'todo', 'gtd', '时间管理', '效率', '在线工具', 'chrome extension', '浏览器'],
  },
  {
    id: 'product',
    path: ['天眼查', '专利', '管理团队', '充钱会员', '市场杂录', '代冲', '代理'],
    text: ['天眼查', '企查查', '专利', '运营', '营销', '市场', '增长', '电商', '会员', '支付', '充值', '订单', '商业', '公司'],
  },
  {
    id: 'finance',
    path: ['金融', '投资', '股票', '证券', '基金', '数字货币', 'web3'],
    text: ['coinmarketcap', 'coingecko', 'binance', 'bitcoin', '比特币', '数字货币', '加密货币', '股票', '证券', '基金', '财经', '投资', 'web3'],
  },
  {
    id: 'life',
    path: ['生活服务', '粤语学习', '百度浏览器书签', '创意类', '猎奇类'],
    text: ['生活', '地图', '旅游', '美食', '音乐', '电影', '游戏', 'emoji', '表情包', '粤语', '天气', '医院', '健康'],
  },
]

function decodeHtmlEntities(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' }
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+|#39);/gi, (match, name) => named[name.toLowerCase()] ?? match)
    .replace(/<[^>]*>/g, '')
    .trim()
}

function attr(attributes, name) {
  const match = String(attributes || '').match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))
  return match ? decodeHtmlEntities(match[1]) : ''
}

function categoryFor({ title, url, folderPath }) {
  const path = folderPath.join(' / ').toLowerCase()
  let hostname = ''
  try { hostname = new URL(url).hostname.toLowerCase() } catch { hostname = '' }
  const text = `${title} ${hostname} ${url}`.toLowerCase()

  for (const rule of RULES) {
    const pathMatch = rule.path?.some((keyword) => path.includes(keyword.toLowerCase()))
    const textMatch = rule.text?.some((keyword) => text.includes(keyword.toLowerCase()))
    if (pathMatch || textMatch) return rule.id
  }
  return 'archive'
}

function domainFor(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' }
}

function riskFlags(url, title) {
  const flags = []
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || ['localhost', '127.0.0.1', '::1'].includes(hostname)) flags.push('direct-host')
    const sensitiveKeys = ['token', 'access_token', 'secret', 'password', 'passwd', 'api_key', 'apikey', 'auth']
    if ([...parsed.searchParams.keys()].some((key) => sensitiveKeys.includes(key.toLowerCase()))) flags.push('sensitive-query')
    if (/\b(admin|console|control|后台|管理控制台)\b/i.test(`${title} ${parsed.pathname}`)) flags.push('management-entry')
  } catch {
    flags.push('invalid-url')
  }
  return [...new Set(flags)]
}

export function parseChromeBookmarks(html) {
  const source = String(html || '')
  const tokens = source.match(/<DT><H3\b[^>]*>.*?<\/H3>|<DT><A\b[^>]*>.*?<\/A>|<DL><p>|<\/DL><p>/gis) || []
  const stack = []
  const entries = []
  const seenUrls = new Set()
  let pendingFolder = null

  for (const token of tokens) {
    const folderMatch = token.match(/^<DT><H3\b([^>]*)>(.*?)<\/H3>$/is)
    if (folderMatch) {
      pendingFolder = decodeHtmlEntities(folderMatch[2])
      continue
    }
    if (/^<DL><p>$/i.test(token)) {
      stack.push(pendingFolder)
      pendingFolder = null
      continue
    }
    if (/^<\/DL><p>$/i.test(token)) {
      stack.pop()
      continue
    }
    const linkMatch = token.match(/^<DT><A\b([^>]*)>(.*?)<\/A>$/is)
    if (!linkMatch) continue
    const attributes = linkMatch[1]
    const url = attr(attributes, 'HREF')
    if (seenUrls.has(url)) continue
    seenUrls.add(url)
    const title = decodeHtmlEntities(linkMatch[2]) || url
    const folderPath = stack.filter(Boolean)
    const entry = {
      id: `bookmark-${String(entries.length + 1).padStart(4, '0')}`,
      title,
      url,
      domain: domainFor(url),
      folderPath,
      addedAt: attr(attributes, 'ADD_DATE') || null,
      category: categoryFor({ title, url, folderPath }),
      riskFlags: riskFlags(url, title),
    }
    entries.push(entry)
  }

  return entries
}

export function dedupeBookmarks(entries) {
  const seenUrls = new Set()
  const unique = []
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (seenUrls.has(entry.url)) continue
    seenUrls.add(entry.url)
    unique.push({
      ...entry,
      duplicateOf: null,
      riskFlags: (entry.riskFlags || []).filter((flag) => flag !== 'insecure-http'),
    })
  }
  return unique
}

export function summarizeBookmarks(entries) {
  const list = Array.isArray(entries) ? entries : []
  const categoryCounts = Object.fromEntries(BOOKMARK_CATEGORIES.map((category) => [category.id, 0]))
  const folders = new Set()
  const domains = new Set()
  const risks = {}

  for (const entry of list) {
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1
    if (entry.folderPath?.length) folders.add(entry.folderPath.join(' / '))
    if (entry.domain) domains.add(entry.domain)
    for (const flag of entry.riskFlags || []) risks[flag] = (risks[flag] || 0) + 1
  }

  return {
    total: list.length,
    uniqueUrls: new Set(list.map((entry) => entry.url)).size,
    duplicateEntries: 0,
    folderPaths: folders.size,
    domains: domains.size,
    categoryCounts,
    risks,
  }
}

export function bookmarkCategory(categoryId) {
  return CATEGORY_BY_ID.get(categoryId) || CATEGORY_BY_ID.get('archive')
}
