import { ENGINEERING_WORKS } from './engineeringWorks'
import { buildArticleOgUrl } from './articleOg'

export const SITE_URL = 'https://2aran.com'

const AUTHOR_NAME = '涂阿燃 / Tuaran'
const AUTHOR_URL = `${SITE_URL}/about`
const TWITTER_HANDLE = '@Anthony404'

const SEO_OVERRIDES = {
  'margin-account-313m-loss-investigation': {
    metadataTitle: '月亏3.13亿：一张同花顺两融截图背后的十亿级资金谜局',
    description: '核验2026年7月21日同花顺两融账户截图：复算指数、净资产、回本涨幅和融资敞口，区分行情真实、账户数据真实与账户身份真实，并追查相关游资传闻的证据边界。',
    ogTitle: '月亏3.13亿：十亿级两融账户是谁？',
    ogDescription: '9.23亿元隐含期初净资产、约两倍风险敞口，以及无法被截图证明的账户身份。',
    twitterDescription: '一张截图能证明行情，却不能证明账户主人。完整复算与证据分层。',
    keywords: ['同花顺两融', '月亏3.13亿', '融资融券', '游资', '账户截图', '净资产收益率', '财经调查', '龙虎榜'],
    image: { url: '/images/margin-account-313m-loss/screenshot.png', width: 552, height: 1200, alt: '2026年7月21日同花顺两融资产分析截图' },
    about: ['融资融券', 'A股', '证券账户截图', '游资传闻', '财经调查'],
  },
  'ai-agent-communications-industry-report': {
    metadataTitle: 'AI智能体通信行业报告：OpenClaw Channel、通信 Skill 与 Token 经济',
    description: '2026 AI 智能体通信行业研究：量化 OpenClaw 29 个 Channel、通信类 Skill 数量与下载、OpenClaw 用户代理指标、WorkBuddy、豆包、微信小微及 Token 消耗，并逐项解释数据定义、时间与来源。',
    ogTitle: 'AI 智能体通信能力行业报告 2026',
    ogDescription: 'Channel 抢入口，Skill 封装动作，Token 计量执行。所有关键数据均附定义、时间、来源与不可外推边界。',
    twitterDescription: 'OpenClaw Channel、通信 Skill、WorkBuddy、豆包、微信小微与 Token 经济的一页式数据研究。',
    keywords: ['AI 智能体通信', 'OpenClaw Channel', 'OpenClaw Skill', '通信 Skill', 'Agent Channel', 'Skill 市场规模', 'Skill 调用量', 'Token 消耗', 'WorkBuddy', '豆包月活', '微信小微', 'AI Agent 行业报告'],
    about: ['AI 智能体通信', 'OpenClaw', 'Agent Skill', 'Agent Channel', 'Token 经济'],
    image: { url: '/images/ai-agent-communications-industry-report/og.png', width: 1731, height: 909, alt: 'AI 智能体通信能力行业报告：Channel、Skill 与 Token' },
  },
  'x-platform-intelligence': {
    metadataTitle: 'X 值不值得做？中文科技创作者经营指南与数据事实',
    description: '面向中文科技创作者的 X（Twitter）经营指南：判断 X 在影响力、同行关系与业务转化中的角色，给出可执行的内容节奏，并核验用户规模、市场信号、平台风险与证据。',
    ogTitle: 'X 值不值得做？给中文科技创作者的结论版',
    ogDescription: '在 X 发现人、建立关系；在自有阵地沉淀内容、完成转化。经营判断、行动系统与证据边界一次讲清。',
    keywords: ['X 平台', 'Twitter 运营', 'X 创作者', '科技创作者', '个人品牌', 'X 用户数据', '内容经营', '社交媒体策略'],
    schemaType: 'Dataset',
    about: ['X', 'Twitter', '科技创作者', '内容经营', '创作者经济'],
  },
  'wisdom-frontier': {
    metadataTitle: '智慧边界｜全球顶级奖项与人类成就图谱',
    description: '覆盖自然科学、数学、计算机、工程、医学、设计、人文、艺术等 15 个领域的 33 项全球顶级奖项，认识代表人物、关键成就与持续学习路径。',
    ogDescription: '从 15 个领域、33 项全球顶级奖项出发，追踪那些拓展人类智慧边界的人与成就。',
    keywords: ['智慧边界', '全球顶级奖项', '诺贝尔奖', '图灵奖', '菲尔兹奖', '普利兹克奖', '科学家', '人类成就', '学习地图'],
    schemaType: 'CollectionPage',
    ogType: 'website',
  },
  'guoqi-guodan': {
    metadataTitle: '国企过单是什么意思？走单、空转贸易、融资性贸易全流程与风险详解',
    description: '深度拆解国企与民企“过单”的定义、三类交易场景、双方动机、四流核验、融资性贸易与空转走单风险，以及合规供应链业务的判断边界。',
    twitterDescription: '一页看懂“货、权、钱、票、险”：什么是正常供应链，什么可能是融资性贸易或空转走单。',
    keywords: ['过单是什么意思', '国企过单', '走单', '空转贸易', '融资性贸易', '国企贸易风险', '供应链贸易合规', '四流一致'],
    image: { url: '/images/guoqi-guodan/og.png', width: 1731, height: 909, alt: '国企“过单”是什么意思：走单、空转贸易、融资性贸易' },
    about: ['国企贸易合规', '融资性贸易', '空转贸易', '供应链业务'],
  },
  'global-ai-governance': {
    description: '从西方先发平台、联合国体系、全球南方到区域协作，横向比较 14 个 AI 治理组织、进程、战略与研究网络。',
  },
  'workbuddy-harness': {
    description: '从技术博主视角拆解 WorkBuddy Harness：九维 Agent 基础设施、HookRunner、记忆、安全、评测与多 Agent 编排，以及它真正解决的问题和当前边界。',
    ogDescription: '模型负责思考，Harness 负责让它有记忆、守规矩、能协作、可评测。',
    twitterDescription: '九维基础设施、运行引擎、评测闭环与工程边界，一页讲清。',
    keywords: ['WorkBuddy Harness', 'AI Agent', 'Harness Engineering', 'Hook Runner', 'Agent 评测', '多 Agent'],
  },
  'network-access-guide': {
    description: '红海 Pro、平行网、脉动云、火烧云、鱼云的当前状态、套餐、协议、节点、公开来源与购买风险横向研究。',
    ogTitle: '5 个网络加速服务：先看证据，再看价格',
    ogDescription: '红海 Pro、平行网、脉动云、火烧云、鱼云公开信息横向核验。',
    twitterDescription: '不做虚构测速，先分清当前状态、信息来源和购买风险。',
    keywords: ['红海 Pro', '平行网', '脉动云', '火烧云', '鱼云', 'SakanaCloud', '网络加速服务', '公开信息核验'],
    image: { url: '/images/network-access-guide/og.png', width: 1731, height: 909, alt: '5 个网络加速服务：先看证据，再看价格' },
  },
  'xiaomoli-dad-todo': {
    description: '好习惯，增强动线，让琐碎生活少点折磨。登录后按日勾选同一套清单，数据存服务器。',
    robots: { index: false, follow: false },
    schemaType: 'WebApplication',
    ogType: 'website',
  },
  eatwhat: {
    description: '帮你决定爸爸妈妈这一顿吃什么；小茉莉那边按 1 岁宝宝的口感单独维护一套清单。',
    schemaType: 'WebApplication',
    ogType: 'website',
  },
  'web-llm': {
    metadataTitle: '端侧大模型',
    description: '记录端侧大模型部署、本地推理运行时、浏览器 WebGPU、Ollama、移动端与边缘设备智能实践。',
    schemaType: 'WebApplication',
    ogType: 'website',
  },
  'skill-market-research': {
    description: '结合作者实践、公开资料与案例核验，分析 Codex / Claude / OpenClaw / ClawHub / GitHub / X 的 Skill 制作、上架、宣发与回流路径。',
    ogDescription: '一个 Skill 如何从文件变成多维页面：制作、上架、宣发、回流。',
  },
  'platform-framework-pairs': {
    metadataTitle: 'Anthropic × Bun + Cloudflare × VoidZero + Vercel × Next：三极割据，AI 公司直接下场抢 Web Runtime',
    description: '2025-12 Anthropic 收购 Bun + 2026-06 Cloudflare 收购 VoidZero + 2016 起 Vercel × Next：三极割据成形。AI 模型公司直接下场抢 runtime —— 这是新形态。10 节研报框架 + 11 组「平台 × 框架」配对可视化。',
  },
  'cancers-overview': {
    metadataTitle: '癌症全景 · 发病 / 死亡 / 生存 / 风险因子可视化',
    description: '10 种主要癌症的发病率、死亡率、5 年生存率、性别 / 年龄分布与关键风险因子，数据基于 GLOBOCAN 2022 与 US SEER；支持筛选与分享。本页为科普整理，不构成医学建议。',
  },
  'tang-ping-map': {
    description: '基于 Tang Ping Map 公开点位整理的低总价房源多维页面：按城市、省份、总价、面积、租金、租售比和地理分布筛选观察。',
    ogDescription: '121 个低总价房源点位的地图、筛选、排行和回本周期观察。数据源自 Tang Ping Map 公开页面。',
  },
  'x-mutual-aid-circle': {
    description: '「X 互帮互助」微信圈子主页：从蓝 V 互关一周涨粉 1k 的实测观察出发，记录中文 X 小圈层如何靠真实表达、点赞评论和持续互动形成社交；圈子配套互关清理 Chrome 插件、发帖时段热力图、Tweepcred 评分、可见性检测和违规提示自查工具。',
    keywords: ['X 互帮互助群', 'Twitter 互助群', '推文互动 微信群', 'X 涨粉', 'X 早期互动', 'X 取消未回关 插件', 'X 发帖最佳时间', 'Tweepcred 评分', 'X ghostban 检测', 'X shadowban 检测', 'X 违规提示自查', 'Twitter 运营工具'],
  },
  'sun-moon-motion': {
    description: '个人富页面研究用的日月运行交互可视化：用日心视角探索太阳中心、地球公转与自转、月球绕地运行与月相变化。',
  },
  'ai-token-usage-research': {
    description: '用 0.1B、0.45B、10B、20B tokens/day 四个锚点，对照个人重度使用、极重度自报与 OpenClaw agent-heavy 工作流，拆解成本、可信度和 vibe coding 能力信号。',
  },
  'zhang-juzheng-book': {
    description: '《张居正：一个改革者的成事与代价》写作出版工程：主线、人物关系、关键事件、12 章目录、20 篇连载、写作方法、出版路径与 12 个月节奏。',
    keywords: ['涂阿燃', 'tuaran', '张居正', '万历新政', '历史写作', '写作出版', '考成法', '一条鞭法', '改革', '人物传记', 'Markdown 写作'],
  },
}

function absoluteUrl(value) {
  if (!value) return undefined
  return value.startsWith('http') ? value : `${SITE_URL}${value}`
}

function dateToIso(date) {
  if (!date) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00+08:00` : date
}

export const RICH_PAGE_SEO = Object.freeze(Object.fromEntries(
  ENGINEERING_WORKS.map((work) => {
    const override = SEO_OVERRIDES[work.id] || {}
    return [work.id, Object.freeze({
      ...work,
      ...override,
      metadataTitle: override.metadataTitle || work.title,
      description: override.description || work.summary,
      canonical: work.href,
      url: `${SITE_URL}${work.href}`,
      publishedTime: override.publishedTime || dateToIso(work.date),
      modifiedTime:
        override.modifiedTime || dateToIso(work.updated) || override.publishedTime || dateToIso(work.date),
      modifiedDate: override.modifiedDate || work.updated || work.date,
      schemaType: override.schemaType || 'Article',
    })]
  }),
))

export function getRichPageSeo(pageId) {
  const page = RICH_PAGE_SEO[pageId]
  if (!page) throw new Error(`Unknown rich page SEO id: ${pageId}`)
  return page
}

export function createRichPageMetadata(pageId) {
  const page = getRichPageSeo(pageId)
  const ogTitle = page.ogTitle || page.metadataTitle
  const ogDescription = page.ogDescription || page.description
  const twitterTitle = page.twitterTitle || ogTitle
  const twitterDescription = page.twitterDescription || ogDescription
  const image = page.image || {
    url: buildArticleOgUrl({
      title: ogTitle,
      description: ogDescription,
      category: page.category || '专题',
      date: page.modifiedDate || page.date,
    }),
    width: 1200,
    height: 630,
    alt: `${ogTitle} 分享卡片`,
  }
  const openGraph = {
    type: page.ogType || 'article',
    siteName: '2aran.com',
    title: ogTitle,
    description: ogDescription,
    url: page.url,
    locale: 'zh_CN',
  }

  if (openGraph.type === 'article') {
    openGraph.publishedTime = page.publishedTime
    openGraph.modifiedTime = page.modifiedTime
    openGraph.authors = [AUTHOR_NAME]
  }

  openGraph.images = [image]

  return {
    title: page.metadataTitle,
    description: page.description,
    ...(page.keywords ? { keywords: page.keywords } : {}),
    alternates: { canonical: page.canonical },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      creator: TWITTER_HANDLE,
      site: TWITTER_HANDLE,
      images: [image.url],
    },
    ...(page.robots ? { robots: page.robots } : {}),
  }
}

export function createRichPageJsonLd(pageId) {
  const page = getRichPageSeo(pageId)
  const image = absoluteUrl(page.image?.url)

  return {
    '@context': 'https://schema.org',
    '@type': page.schemaType,
    name: page.metadataTitle,
    headline: page.metadataTitle,
    description: page.description,
    url: page.url,
    mainEntityOfPage: page.url,
    inLanguage: 'zh-CN',
    datePublished: page.publishedTime,
    dateModified: page.modifiedTime,
    author: { '@type': 'Person', name: AUTHOR_NAME, url: AUTHOR_URL },
    publisher: { '@type': 'Person', name: AUTHOR_NAME, url: SITE_URL },
    ...(image ? { image } : {}),
    ...(page.keywords ? { keywords: page.keywords.join(', ') } : {}),
    ...(page.about ? { about: page.about } : {}),
  }
}

export function listRichPageSitemapEntries() {
  return Object.values(RICH_PAGE_SEO)
    .filter((page) => page.robots?.index !== false)
    .map((page) => ({
      url: page.url,
      lastModified: page.modifiedDate,
    }))
}

export function listRichPagePaths() {
  return Object.values(RICH_PAGE_SEO).map((page) => page.canonical)
}
