export const PUBLIC_OPINION_STACK = [
  {
    name: 'Crawlee',
    type: '采集编排',
    role: '面向 JavaScript/TypeScript 的网页采集与浏览器自动化任务框架',
    integration: '用于公开网页、搜索结果页、话题页的队列、重试、去重与代理策略。',
    url: 'https://crawlee.dev/',
    maturity: '生产可用',
  },
  {
    name: 'Scrapy',
    type: '采集框架',
    role: 'Python 生态的结构化网页抓取框架',
    integration: '适合新闻站、论坛、公告页和可分页内容的批量抓取。',
    url: 'https://scrapy.org/',
    maturity: '成熟',
  },
  {
    name: 'Apache Nutch',
    type: '搜索爬虫',
    role: '可扩展、可插拔的开源 Web 爬虫',
    integration: '用于长周期全网发现、站点 frontier 管理和增量索引。',
    url: 'https://nutch.apache.org/',
    maturity: '成熟',
  },
  {
    name: 'RSSHub',
    type: '公开订阅',
    role: '把公开网页内容转成 RSS/Atom 的开源项目',
    integration: '优先接新闻、博客、开发者社区、视频站公开频道，降低页面解析成本。',
    url: 'https://docs.rsshub.app/',
    maturity: '高覆盖',
  },
  {
    name: 'Transformers.js',
    type: '文本分析',
    role: '在浏览器或 Node.js 中运行 Transformer 模型',
    integration: '用于情绪分类、观点抽取、摘要、嵌入向量和主题聚类前处理。',
    url: 'https://huggingface.co/docs/transformers.js',
    maturity: '快速迭代',
  },
  {
    name: 'HanLP',
    type: '中文 NLP',
    role: '中文分词、词性、命名实体、依存句法与语义分析工具包',
    integration: '补齐中文观点抽取、实体识别、关键词和立场触发词识别。',
    url: 'https://hanlp.hankcs.com/',
    maturity: '中文友好',
  },
]

export const SOURCE_CONNECTORS = [
  {
    id: 'news',
    label: '新闻 / RSS',
    scope: '公开新闻站、机构公告、行业媒体、RSSHub 路由',
    collector: 'RSSHub + Scrapy',
    refresh: '5-15 分钟',
    compliance: '遵守 robots.txt、保留来源链接、按站点限速',
  },
  {
    id: 'social',
    label: '社交公开页',
    scope: '公开话题页、热搜榜、公开评论区、公开短帖',
    collector: 'Crawlee + Playwright',
    refresh: '10-30 分钟',
    compliance: '仅采集无需登录可见内容，不采集私信、好友圈和受限内容',
  },
  {
    id: 'video',
    label: '视频 / 弹幕公开区',
    scope: '公开视频标题、简介、评论摘要、榜单与搜索结果',
    collector: 'Crawlee + 站点公开接口',
    refresh: '30-60 分钟',
    compliance: '控制并发，只存分析所需字段和来源 URL',
  },
  {
    id: 'forum',
    label: '论坛 / 社区',
    scope: '开发者社区、问答站、公开贴吧/论坛、产品社区',
    collector: 'Scrapy + feed parser',
    refresh: '15-60 分钟',
    compliance: '按版块白名单采集，过滤个人敏感信息',
  },
]

export const OPINION_TOPICS = [
  {
    id: 'ai-search',
    title: 'AI 搜索改版',
    category: '产品体验',
    risk: '中',
    keywords: ['答案可信度', '广告标识', '传统搜索', '引用来源'],
    summary: '讨论集中在“答案更快”与“来源不透明”的拉扯，付费用户更关注引用质量。',
  },
  {
    id: 'ev-battery',
    title: '新能源电池召回',
    category: '消费安全',
    risk: '高',
    keywords: ['安全', '补偿', '售后', '质保'],
    summary: '负面情绪由安全担忧驱动，核心分歧是厂商是否应扩大补偿范围。',
  },
  {
    id: 'city-marathon',
    title: '城市马拉松中签',
    category: '城市活动',
    risk: '低',
    keywords: ['名额', '交通', '报名费', '体验'],
    summary: '整体偏正向，吐槽点主要来自抽签透明度和比赛日交通安排。',
  },
  {
    id: 'creator-policy',
    title: '内容平台创作者分成调整',
    category: '创作者经济',
    risk: '中',
    keywords: ['分成', '流量', '原创', '补贴'],
    summary: '创作者群体偏负面，普通用户更关注内容质量是否会下降。',
  },
]

export const OPINION_POSTS = [
  {
    id: 'p01',
    topicId: 'ai-search',
    sourceId: 'social',
    platform: '微博公开话题',
    time: '08:20',
    sentiment: 0.55,
    stance: 'support',
    engagement: 2480,
    text: '新搜索确实省时间，但希望每条答案都能直接看到来源。',
    viewpoint: '效率提升被认可，引用透明度是关键条件。',
  },
  {
    id: 'p02',
    topicId: 'ai-search',
    sourceId: 'forum',
    platform: '开发者社区',
    time: '09:10',
    sentiment: -0.28,
    stance: 'question',
    engagement: 620,
    text: '模型会把旧资料和广告混在一起，搜索产品不能只追求生成速度。',
    viewpoint: '质疑生成答案的时效性与商业排序。',
  },
  {
    id: 'p03',
    topicId: 'ai-search',
    sourceId: 'news',
    platform: '科技媒体',
    time: '10:15',
    sentiment: 0.12,
    stance: 'neutral',
    engagement: 910,
    text: '多家搜索产品开始强化 AI 摘要，引用和版权机制仍在调整。',
    viewpoint: '行业趋势明确，但规则未定。',
  },
  {
    id: 'p04',
    topicId: 'ai-search',
    sourceId: 'video',
    platform: '视频评论区',
    time: '11:35',
    sentiment: 0.33,
    stance: 'support',
    engagement: 1460,
    text: '教程类问题很好用，复杂问题还是会回去点原文。',
    viewpoint: '低风险查询满意，高风险查询仍需要原文验证。',
  },
  {
    id: 'p05',
    topicId: 'ev-battery',
    sourceId: 'social',
    platform: '微博公开话题',
    time: '08:45',
    sentiment: -0.82,
    stance: 'oppose',
    engagement: 5820,
    text: '召回可以理解，但补偿方案太轻，车主的时间成本谁负责？',
    viewpoint: '召回态度可以接受，补偿范围被认为不足。',
  },
  {
    id: 'p06',
    topicId: 'ev-battery',
    sourceId: 'news',
    platform: '财经媒体',
    time: '09:50',
    sentiment: -0.46,
    stance: 'question',
    engagement: 2140,
    text: '企业公告强调主动召回，但没有解释缺陷批次如何界定。',
    viewpoint: '批次边界和信息披露仍需解释。',
  },
  {
    id: 'p07',
    topicId: 'ev-battery',
    sourceId: 'forum',
    platform: '车主论坛',
    time: '10:30',
    sentiment: -0.64,
    stance: 'oppose',
    engagement: 1880,
    text: '售后电话一直打不通，担心排队时间超过官方承诺。',
    viewpoint: '服务承接能力成为第二波风险。',
  },
  {
    id: 'p08',
    topicId: 'ev-battery',
    sourceId: 'video',
    platform: '短视频评论',
    time: '12:05',
    sentiment: -0.36,
    stance: 'neutral',
    engagement: 1720,
    text: '先看后续检测结果，安全问题别靠公关话术压下去。',
    viewpoint: '要求用检测结果而非口径回应。',
  },
  {
    id: 'p09',
    topicId: 'city-marathon',
    sourceId: 'social',
    platform: '微博同城',
    time: '07:55',
    sentiment: 0.74,
    stance: 'support',
    engagement: 1320,
    text: '终于中签了，希望今年补给点不要排长队。',
    viewpoint: '参与热情高，体验细节影响满意度。',
  },
  {
    id: 'p10',
    topicId: 'city-marathon',
    sourceId: 'news',
    platform: '本地新闻',
    time: '09:25',
    sentiment: 0.48,
    stance: 'support',
    engagement: 730,
    text: '赛事路线公布，沿线商圈准备推出配套活动。',
    viewpoint: '城市活动带动商业和公共参与。',
  },
  {
    id: 'p11',
    topicId: 'city-marathon',
    sourceId: 'forum',
    platform: '本地论坛',
    time: '11:05',
    sentiment: -0.22,
    stance: 'question',
    engagement: 560,
    text: '交通管制能不能更早提醒？上次临时绕路很麻烦。',
    viewpoint: '公共通知与交通组织需要前置。',
  },
  {
    id: 'p12',
    topicId: 'city-marathon',
    sourceId: 'video',
    platform: '运动视频社区',
    time: '13:00',
    sentiment: 0.63,
    stance: 'support',
    engagement: 860,
    text: '路线比去年更友好，适合第一次跑全马的人。',
    viewpoint: '路线体验被认为改善。',
  },
  {
    id: 'p13',
    topicId: 'creator-policy',
    sourceId: 'social',
    platform: '微博公开话题',
    time: '08:15',
    sentiment: -0.51,
    stance: 'oppose',
    engagement: 3420,
    text: '平台说扶持原创，结果分成口径越来越复杂。',
    viewpoint: '创作者对分成规则透明度不满。',
  },
  {
    id: 'p14',
    topicId: 'creator-policy',
    sourceId: 'forum',
    platform: '创作者社区',
    time: '09:40',
    sentiment: -0.68,
    stance: 'oppose',
    engagement: 1980,
    text: '流量奖励变少可以接受，但不要让优质长内容和搬运号同一套规则。',
    viewpoint: '希望区分原创质量与搬运内容。',
  },
  {
    id: 'p15',
    topicId: 'creator-policy',
    sourceId: 'news',
    platform: '行业媒体',
    time: '10:55',
    sentiment: 0.08,
    stance: 'neutral',
    engagement: 900,
    text: '平台调整补贴结构，目标是把预算转向高留存内容。',
    viewpoint: '政策目标与创作者感知存在落差。',
  },
  {
    id: 'p16',
    topicId: 'creator-policy',
    sourceId: 'video',
    platform: '视频评论区',
    time: '12:30',
    sentiment: -0.18,
    stance: 'question',
    engagement: 1190,
    text: '如果收入下降，大家可能会更偏标题党，用户体验也会变差。',
    viewpoint: '担忧激励变化影响内容生态。',
  },
]

export const TREND_POINTS = [
  { time: '08:00', heat: 41, positive: 44, negative: 29 },
  { time: '09:00', heat: 58, positive: 40, negative: 36 },
  { time: '10:00', heat: 67, positive: 38, negative: 41 },
  { time: '11:00', heat: 74, positive: 35, negative: 46 },
  { time: '12:00', heat: 69, positive: 37, negative: 43 },
  { time: '13:00', heat: 82, positive: 42, negative: 39 },
]

const SENTIMENT_LABELS = [
  { id: 'positive', label: '正向', test: (score) => score >= 0.25 },
  { id: 'neutral', label: '中性', test: (score) => score > -0.25 && score < 0.25 },
  { id: 'negative', label: '负向', test: (score) => score <= -0.25 },
]

export function getSentimentBucket(score) {
  return SENTIMENT_LABELS.find((bucket) => bucket.test(score))?.id || 'neutral'
}

export function getSentimentLabel(score) {
  return SENTIMENT_LABELS.find((bucket) => bucket.test(score))?.label || '中性'
}

export function formatPercent(value) {
  return `${Math.round(value)}%`
}

export function buildPublicOpinionSnapshot(posts = OPINION_POSTS) {
  const totalEngagement = posts.reduce((sum, post) => sum + post.engagement, 0)
  const averageSentiment = posts.reduce((sum, post) => sum + post.sentiment, 0) / posts.length

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  const stanceCounts = { support: 0, neutral: 0, question: 0, oppose: 0 }
  const sourceCounts = SOURCE_CONNECTORS.reduce((acc, source) => ({ ...acc, [source.id]: 0 }), {})

  for (const post of posts) {
    sentimentCounts[getSentimentBucket(post.sentiment)] += 1
    stanceCounts[post.stance] += 1
    sourceCounts[post.sourceId] += 1
  }

  const topicCards = OPINION_TOPICS.map((topic) => {
    const topicPosts = posts.filter((post) => post.topicId === topic.id)
    const topicEngagement = topicPosts.reduce((sum, post) => sum + post.engagement, 0)
    const sentiment = topicPosts.length
      ? topicPosts.reduce((sum, post) => sum + post.sentiment, 0) / topicPosts.length
      : 0
    const views = [...topicPosts]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 3)
      .map((post) => post.viewpoint)

    return {
      ...topic,
      heat: totalEngagement ? Math.round((topicEngagement / totalEngagement) * 100) : 0,
      engagement: topicEngagement,
      sentiment,
      sentimentLabel: getSentimentLabel(sentiment),
      posts: topicPosts.length,
      coreViews: views,
    }
  }).sort((a, b) => b.engagement - a.engagement)

  return {
    totalPosts: posts.length,
    totalEngagement,
    averageSentiment,
    sentimentCounts,
    stanceCounts,
    sourceCounts,
    topicCards,
    topTopic: topicCards[0],
  }
}
