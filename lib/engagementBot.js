/**
 * 路过互动：前台看起来像随手路过的读者，后台按机器人账号管理。
 *
 * 公开标识刻意压低：评论区 provider 显示「路过」，不出现「机器人」字样。
 * 站长在 /admin/engagement-bots 能看到完整人设、点赞/评论记录和 DeepSeek 调用。
 */

export const READER_PROVIDER = 'reader'
export const READER_USER_PREFIX = 'reader:'
export const ENGAGEMENT_BOT_SOURCE = 'engagement-bot'
export const ENGAGEMENT_BOT_SETTINGS_KEY = 'engagement_bot.settings'
export const ENGAGEMENT_BOT_SEED_KEY = 'engagement_bot.seed.version'
export const ENGAGEMENT_BOT_SEED_VERSION = '1'
export const PUBLIC_READER_HINT = '路过的读者'

export const DEFAULT_ENGAGEMENT_BOT_SETTINGS = Object.freeze({
  enabled: true,
  likesPerRun: 2,
  commentsPerRun: 1,
  skipProbability: 0,
  cooldownHours: 72,
  maxCommentChars: 72,
  minCommentChars: 12,
  recentLimit: 80,
  contentPrefixes: Object.freeze(['article:', 'research:']),
})

export const DEFAULT_ENGAGEMENT_BOTS = Object.freeze([
  {
    slug: 'wanfeng',
    displayName: '晚风',
    voicePrompt: '短句，像看完随口留下一句。不总结全文，不恭维作者。',
  },
  {
    slug: 'aning',
    displayName: '阿宁',
    voicePrompt: '抓住标题或摘要里的一个具体点，说自己为什么停下来看。',
  },
  {
    slug: 'beixiang',
    displayName: '北巷',
    voicePrompt: '带一点疑问，但不抬杠，不问作者接下来怎么写。',
  },
  {
    slug: 'xiaoman',
    displayName: '小满',
    voicePrompt: '轻松、同意、不夸张，像跟朋友点头。',
  },
  {
    slug: 'tingyu',
    displayName: '听雨',
    voicePrompt: '联想到自己的日常观察，不编造经历细节。',
  },
  {
    slug: 'qingshi',
    displayName: '青石',
    voicePrompt: '克制，只下一句判断，不用感叹号堆情绪。',
  },
  {
    slug: 'nanan',
    displayName: '南岸',
    voicePrompt: '补一个旁观角度，不评价写得如何。',
  },
  {
    slug: 'linshen',
    displayName: '林深',
    voicePrompt: '慢热，一句就够，可以留白，不要排比。',
  },
  {
    slug: 'gubai',
    displayName: '顾白',
    voicePrompt: '对材料本身感兴趣，提一个可核对的点。',
  },
  {
    slug: 'chenmai',
    displayName: '陈麦',
    voicePrompt: '口语，像路过随手回一句，可以用语气词，但不要网络腔堆砌。',
  },
])

const BANNED_COMMENT_MARKERS = [
  '作为ai',
  '作为人工智能',
  '语言模型',
  'deepseek',
  'chatgpt',
  '我是机器人',
  '作为大模型',
  '生成式',
]

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,31}$/

export function readerUserId(slug) {
  return `${READER_USER_PREFIX}${String(slug || '').trim()}`
}

export function readerVoterKey(slug) {
  return `user:${readerUserId(slug)}`
}

export function isReaderUserId(userId) {
  return String(userId || '').startsWith(READER_USER_PREFIX)
}

export function contentMatchesPrefixes(contentKey, prefixes) {
  const key = String(contentKey || '')
  const list = Array.isArray(prefixes) && prefixes.length
    ? prefixes
    : DEFAULT_ENGAGEMENT_BOT_SETTINGS.contentPrefixes
  return list.some((prefix) => key.startsWith(String(prefix || '')))
}

export function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function normalizeContentPrefixes(value, fallback = DEFAULT_ENGAGEMENT_BOT_SETTINGS.contentPrefixes) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '')
        .split(/[\n,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
  const prefixes = [...new Set(raw.map((item) => String(item || '').trim()).filter(Boolean))]
  return prefixes.length ? prefixes : [...fallback]
}

export function normalizeEngagementBotSettings(input = {}, fallback = DEFAULT_ENGAGEMENT_BOT_SETTINGS) {
  const skip = Number(input.skipProbability)
  const enabled = input.enabled == null
    ? fallback.enabled
    : input.enabled !== false && input.enabled !== 0 && input.enabled !== 'false'
  return {
    enabled,
    likesPerRun: clampInt(input.likesPerRun, 0, 5, fallback.likesPerRun),
    commentsPerRun: clampInt(input.commentsPerRun, 0, 3, fallback.commentsPerRun),
    skipProbability: Number.isFinite(skip) ? Math.min(0.9, Math.max(0, skip)) : fallback.skipProbability,
    cooldownHours: clampInt(input.cooldownHours, 12, 720, fallback.cooldownHours),
    maxCommentChars: clampInt(input.maxCommentChars, 24, 200, fallback.maxCommentChars),
    minCommentChars: clampInt(input.minCommentChars, 8, 40, fallback.minCommentChars),
    recentLimit: clampInt(input.recentLimit, 20, 200, fallback.recentLimit),
    contentPrefixes: normalizeContentPrefixes(input.contentPrefixes, fallback.contentPrefixes),
  }
}

export function parseStoredEngagementBotSettings(value) {
  if (!value) return { ...DEFAULT_ENGAGEMENT_BOT_SETTINGS, contentPrefixes: [...DEFAULT_ENGAGEMENT_BOT_SETTINGS.contentPrefixes] }
  if (typeof value === 'object') return normalizeEngagementBotSettings(value)
  try {
    return normalizeEngagementBotSettings(JSON.parse(value))
  } catch {
    return { ...DEFAULT_ENGAGEMENT_BOT_SETTINGS, contentPrefixes: [...DEFAULT_ENGAGEMENT_BOT_SETTINGS.contentPrefixes] }
  }
}

export function normalizeBotSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function normalizeBotInput(input = {}) {
  const slug = normalizeBotSlug(input.slug)
  const displayName = String(input.displayName || '').replace(/\s+/g, '').trim().slice(0, 12)
  const voicePrompt = String(input.voicePrompt || '').replace(/\r\n?/g, '\n').trim().slice(0, 240)
  if (!SLUG_PATTERN.test(slug)) return { error: 'INVALID_SLUG' }
  if (!displayName) return { error: 'INVALID_DISPLAY_NAME' }
  if (!voicePrompt) return { error: 'INVALID_VOICE_PROMPT' }
  return {
    bot: {
      slug,
      displayName,
      voicePrompt,
      enabled: input.enabled !== false && input.enabled !== 0 && input.enabled !== 'false',
    },
  }
}

export function pairKey(botId, articleKey) {
  return `${botId}:${articleKey}`
}

export function shuffle(items, rng = Math.random) {
  const next = Array.isArray(items) ? [...items] : []
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    ;[next[index], next[swap]] = [next[swap], next[index]]
  }
  return next
}

export function shouldSkipRun(settings, { force = false, rng = Math.random } = {}) {
  if (force) return false
  const probability = Number(settings?.skipProbability)
  if (!Number.isFinite(probability) || probability <= 0) return false
  return rng() < probability
}

/**
 * 一次运行要执行的点赞 / 评论计划。
 * 评论同一篇文章最多一条；点赞允许不同人设点同一篇。
 */
export function planEngagementRun({
  bots = [],
  articles = [],
  likedPairs = new Set(),
  recentCommentPairs = new Set(),
  likesPerRun = DEFAULT_ENGAGEMENT_BOT_SETTINGS.likesPerRun,
  commentsPerRun = DEFAULT_ENGAGEMENT_BOT_SETTINGS.commentsPerRun,
  rng = Math.random,
} = {}) {
  const enabledBots = bots.filter((bot) => bot && bot.enabled !== false)
  const likeCandidates = []
  const commentCandidates = []

  for (const bot of enabledBots) {
    for (const article of articles) {
      const articleKey = article?.contentKey || article?.articleKey || ''
      if (!articleKey) continue
      const key = pairKey(bot.id, articleKey)
      if (!likedPairs.has(key)) likeCandidates.push({ bot, article })
      if (!recentCommentPairs.has(key)) commentCandidates.push({ bot, article })
    }
  }

  const likes = []
  const likedBotArticles = new Set()
  for (const candidate of shuffle(likeCandidates, rng)) {
    if (likes.length >= likesPerRun) break
    const key = pairKey(candidate.bot.id, candidate.article.contentKey)
    if (likedBotArticles.has(key)) continue
    likedBotArticles.add(key)
    likes.push(candidate)
  }

  const comments = []
  const commentArticles = new Set()
  const commentBots = new Set()
  for (const candidate of shuffle(commentCandidates, rng)) {
    if (comments.length >= commentsPerRun) break
    const articleKey = candidate.article.contentKey
    if (commentArticles.has(articleKey)) continue
    if (commentBots.has(candidate.bot.id)) continue
    commentArticles.add(articleKey)
    commentBots.add(candidate.bot.id)
    comments.push(candidate)
  }

  return { likes, comments }
}

export function buildEngagementCommentMessages({ bot, article, settings = DEFAULT_ENGAGEMENT_BOT_SETTINGS }) {
  const maxChars = settings.maxCommentChars || DEFAULT_ENGAGEMENT_BOT_SETTINGS.maxCommentChars
  const minChars = settings.minCommentChars || DEFAULT_ENGAGEMENT_BOT_SETTINGS.minCommentChars
  const title = String(article?.title || '').trim() || '未命名内容'
  const summary = String(article?.summary || '').replace(/\s+/g, ' ').trim().slice(0, 280)
  return [
    {
      role: 'system',
      content: [
        '你在一个中文个人网站上以路过的读者身份留下评论。',
        `你的网名叫「${bot.displayName}」。说话方式：${bot.voicePrompt}`,
        '只输出评论正文，不要解释、标题、Markdown、引号包裹或候选版本。',
        `长度控制在 ${minChars}-${maxChars} 个中文字符。`,
        '不要自我介绍，不要提自己是模型或机器人，不要用「本文 / 本篇 / 作者接下来」。',
        '不要空泛恭维，不要号召点赞收藏，不要编造没写在标题和摘要里的事实。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `标题：${title}\n摘要：${summary || '（无摘要）'}`,
    },
  ]
}

export function sanitizeGeneratedComment(value, { minChars = 12, maxChars = 72 } = {}) {
  let text = String(value || '').replace(/\r\n?/g, '\n').trim()
  const fenced = text.match(/^```(?:text|markdown)?\s*\n?([\s\S]*?)\n?```$/i)
  if (fenced) text = fenced[1].trim()
  text = text.replace(/^(?:评论|留言|回复)\s*[：:]\s*/i, '').trim()
  if (
    text.length >= 2 &&
    ((text.startsWith('“') && text.endsWith('”')) ||
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith('「') && text.endsWith('」')))
  ) {
    text = text.slice(1, -1).trim()
  }
  text = text.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim()
  const lowered = text.toLowerCase()
  if (BANNED_COMMENT_MARKERS.some((marker) => lowered.includes(marker))) return ''
  if (text.length < minChars) return ''
  if (text.length > maxChars) text = text.slice(0, maxChars).replace(/[，。！？、；：\s]+$/u, '').trim()
  return text.slice(0, 1000)
}

export function filterPublishedContent(items, settings = DEFAULT_ENGAGEMENT_BOT_SETTINGS) {
  const prefixes = settings.contentPrefixes || DEFAULT_ENGAGEMENT_BOT_SETTINGS.contentPrefixes
  const limit = settings.recentLimit || DEFAULT_ENGAGEMENT_BOT_SETTINGS.recentLimit
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.status !== 'draft' && item?.status !== 'retired')
    .filter((item) => contentMatchesPrefixes(item.contentKey || item.content_key, prefixes))
    .slice(0, limit)
    .map((item) => ({
      contentKey: item.contentKey || item.content_key,
      title: item.title || '',
      summary: item.summary || '',
      href: item.href || '',
      date: item.date || '',
    }))
}

export function rowToEngagementBot(row) {
  if (!row) return null
  return {
    id: Number(row.id) || 0,
    slug: row.slug || '',
    displayName: row.display_name || '',
    voicePrompt: row.voice_prompt || '',
    enabled: Boolean(row.enabled),
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
    userId: readerUserId(row.slug),
    voterKey: readerVoterKey(row.slug),
  }
}

export function rowToEngagementAction(row) {
  if (!row) return null
  return {
    id: Number(row.id) || 0,
    runId: Number(row.run_id) || 0,
    botId: row.bot_id == null ? null : Number(row.bot_id) || 0,
    botSlug: row.bot_slug || '',
    botName: row.bot_name || '',
    actionType: row.action_type || '',
    articleKey: row.article_key || '',
    articleTitle: row.article_title || '',
    commentId: row.comment_id == null ? null : Number(row.comment_id) || 0,
    message: row.message || '',
    deepseekTaskId: row.deepseek_task_id == null ? null : Number(row.deepseek_task_id) || 0,
    status: row.status || '',
    error: row.error || '',
    createdAt: Number(row.created_at) || 0,
  }
}

export function rowToEngagementRun(row) {
  if (!row) return null
  return {
    id: Number(row.id) || 0,
    triggeredBy: row.triggered_by || '',
    status: row.status || '',
    likes: Number(row.likes) || 0,
    comments: Number(row.comments) || 0,
    failed: Number(row.failed) || 0,
    detail: row.detail || '',
    startedAt: Number(row.started_at) || 0,
    finishedAt: Number(row.finished_at) || 0,
  }
}
