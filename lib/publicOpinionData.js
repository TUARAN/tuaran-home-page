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
    label: '科技媒体 RSS',
    scope: 'InfoQ、VentureBeat AI、TechCrunch AI 的公开订阅源',
    collector: 'Official RSS feeds',
    refresh: '每小时',
    compliance: '仅保留标题、来源、发布时间和原文链接',
  },
  {
    id: 'forum',
    label: '开发者社区',
    scope: 'Hacker News 公开帖子、评论量和投票数',
    collector: 'HN Algolia API',
    refresh: '每小时',
    compliance: '仅采集无需登录可见的公开主题，不保存用户画像',
  },
]

export const OPINION_TOPICS = [
  {
    id: 'ai-agents',
    title: 'AI 与 Agent',
    category: '人工智能',
    risk: '中',
    keywords: ['AI Agent', 'OpenAI', 'Anthropic', '智能体'],
    matchTerms: ['AI', 'agent', 'OpenAI', 'Anthropic', 'Claude', '智能体'],
    query: '"AI agent" OR "agentic AI"',
    communityQuery: 'AI agent',
    summary: '持续跟踪智能体产品、框架、融资、可靠性与安全治理相关公开讨论。',
  },
  {
    id: 'china-llm',
    title: '国产大模型',
    category: '模型生态',
    risk: '中',
    keywords: ['DeepSeek', 'Qwen', 'Kimi', '国产模型'],
    matchTerms: ['DeepSeek', 'Qwen', 'Kimi', '国产模型'],
    query: 'DeepSeek OR Qwen OR Kimi',
    communityQuery: 'DeepSeek',
    summary: '关注国产模型发布、开源生态、推理成本、应用落地和开发者反馈。',
  },
  {
    id: 'cloud-dev',
    title: '云与开发者工具',
    category: '开发者生态',
    risk: '低',
    keywords: ['Cloudflare', 'Vercel', 'Next.js', '开发工具'],
    matchTerms: ['Cloudflare', 'Vercel', 'Next.js', 'developer tool'],
    query: 'Cloudflare OR Vercel OR "Next.js"',
    communityQuery: 'Cloudflare Vercel',
    summary: '跟踪云平台、前端框架、开发工具发布及工程社区的实际使用反馈。',
  },
  {
    id: 'creator-policy',
    title: '创作者经济',
    category: '创作者经济',
    risk: '中',
    keywords: ['分成', '流量', '原创', '补贴'],
    matchTerms: ['creator economy', 'content creator', '创作者', '内容平台'],
    query: '"creator economy" OR "content creator"',
    communityQuery: 'creator economy',
    summary: '关注内容平台规则、创作者收入、分发机制和 AI 对内容生产的影响。',
  },
]

export const OPINION_POSTS = [
  {
    id: 'p01',
    topicId: 'ai-agents',
    sourceId: 'forum',
    platform: 'Hacker News',
    time: '08:20',
    sentiment: 0.55,
    stance: 'support',
    engagement: 2480,
    text: '智能体开始进入真实工作流，但可靠性和权限边界仍是主要讨论点。',
    viewpoint: '开发者认可执行能力，同时要求更清晰的可追溯性。',
  },
  {
    id: 'p02',
    topicId: 'ai-agents',
    sourceId: 'forum',
    platform: '开发者社区',
    time: '09:10',
    sentiment: -0.28,
    stance: 'question',
    engagement: 620,
    text: '长时间运行的 Agent 容易在工具调用和上下文管理上积累误差。',
    viewpoint: '社区更关注长任务稳定性，而不只是单次演示效果。',
  },
  {
    id: 'p03',
    topicId: 'ai-agents',
    sourceId: 'news',
    platform: '科技媒体',
    time: '10:15',
    sentiment: 0.12,
    stance: 'neutral',
    engagement: 910,
    text: '多家厂商继续发布 Agent 平台，标准、计费与安全机制仍在调整。',
    viewpoint: '行业投入持续增加，基础规范尚未收敛。',
  },
  {
    id: 'p04',
    topicId: 'ai-agents',
    sourceId: 'news',
    platform: '行业媒体',
    time: '11:35',
    sentiment: 0.33,
    stance: 'support',
    engagement: 1460,
    text: '企业开始把智能体用于客服、研发和数据分析，高风险动作仍保留人工确认。',
    viewpoint: '落地路径从聊天转向执行，但人机协同仍是主流。',
  },
  {
    id: 'p05',
    topicId: 'china-llm',
    sourceId: 'forum',
    platform: 'Hacker News',
    time: '08:45',
    sentiment: -0.82,
    stance: 'oppose',
    engagement: 5820,
    text: '国产模型能力提升很快，但海外开发者仍担心文档、生态和持续服务能力。',
    viewpoint: '模型能力获认可，生态成熟度仍被反复比较。',
  },
  {
    id: 'p06',
    topicId: 'china-llm',
    sourceId: 'news',
    platform: '财经媒体',
    time: '09:50',
    sentiment: -0.46,
    stance: 'question',
    engagement: 2140,
    text: '新模型发布强调推理效率和开放权重，实际成本仍取决于部署方式。',
    viewpoint: '价格优势明显，真实部署成本需要具体测算。',
  },
  {
    id: 'p07',
    topicId: 'china-llm',
    sourceId: 'forum',
    platform: '车主论坛',
    time: '10:30',
    sentiment: -0.64,
    stance: 'oppose',
    engagement: 1880,
    text: '社区希望官方提供更稳定的工具调用、结构化输出和多语言文档。',
    viewpoint: '开发体验成为模型能力之外的竞争焦点。',
  },
  {
    id: 'p08',
    topicId: 'china-llm',
    sourceId: 'news',
    platform: '科技媒体',
    time: '12:05',
    sentiment: -0.36,
    stance: 'neutral',
    engagement: 1720,
    text: '行业继续观察国产模型在企业级场景中的稳定性和合规能力。',
    viewpoint: '从榜单竞争转向长期服务能力验证。',
  },
  {
    id: 'p09',
    topicId: 'cloud-dev',
    sourceId: 'forum',
    platform: 'Hacker News',
    time: '07:55',
    sentiment: 0.74,
    stance: 'support',
    engagement: 1320,
    text: '边缘平台的部署体验继续改善，开发者同时关注锁定风险和可观测性。',
    viewpoint: '易用性获认可，迁移成本仍影响平台选择。',
  },
  {
    id: 'p10',
    topicId: 'cloud-dev',
    sourceId: 'news',
    platform: '本地新闻',
    time: '09:25',
    sentiment: 0.48,
    stance: 'support',
    engagement: 730,
    text: '云平台陆续增强 AI 推理、状态存储和工作流能力。',
    viewpoint: '开发平台正从托管前端扩展到完整应用运行时。',
  },
  {
    id: 'p11',
    topicId: 'cloud-dev',
    sourceId: 'forum',
    platform: '本地论坛',
    time: '11:05',
    sentiment: -0.22,
    stance: 'question',
    engagement: 560,
    text: '框架升级速度很快，团队更关心兼容性、构建时间和生产故障定位。',
    viewpoint: '新能力之外，升级成本决定实际采用速度。',
  },
  {
    id: 'p12',
    topicId: 'cloud-dev',
    sourceId: 'news',
    platform: '开发者媒体',
    time: '13:00',
    sentiment: 0.63,
    stance: 'support',
    engagement: 860,
    text: '平台竞争开始集中在 AI 工作负载、边缘数据和开发者体验。',
    viewpoint: '产品边界趋同，工程体验成为差异化因素。',
  },
  {
    id: 'p13',
    topicId: 'creator-policy',
    sourceId: 'forum',
    platform: 'Hacker News',
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
    sourceId: 'news',
    platform: '行业媒体',
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

export function buildPublicOpinionSnapshot(
  posts = OPINION_POSTS,
  topics = OPINION_TOPICS,
  connectors = SOURCE_CONNECTORS,
) {
  const totalEngagement = posts.reduce((sum, post) => sum + post.engagement, 0)
  const averageSentiment = posts.length
    ? posts.reduce((sum, post) => sum + post.sentiment, 0) / posts.length
    : 0

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  const stanceCounts = { support: 0, neutral: 0, question: 0, oppose: 0 }
  const sourceCounts = connectors.reduce((acc, source) => ({ ...acc, [source.id]: 0 }), {})

  for (const post of posts) {
    sentimentCounts[getSentimentBucket(post.sentiment)] += 1
    stanceCounts[post.stance] = (stanceCounts[post.stance] || 0) + 1
    sourceCounts[post.sourceId] = (sourceCounts[post.sourceId] || 0) + 1
  }

  const topicCards = topics.map((topic) => {
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
