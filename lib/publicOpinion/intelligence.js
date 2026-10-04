const EVENT_WINDOW_MS = 72 * 60 * 60 * 1000
const HOT_WINDOW_MS = 48 * 60 * 60 * 1000
const HALF_LIFE_MS = 24 * 60 * 60 * 1000

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over', 'about', 'after',
  '发布', '宣布', '推出', '最新', '相关', '表示', '一个', '一种', '正在', '开始', '继续',
])

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export function getPublicOpinionHeatLabel(heat) {
  const score = clamp(Number(heat) || 0)
  if (score >= 80) return '高'
  if (score >= 50) return '中'
  return '低'
}

function stableId(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `event_${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function timestampOf(post, now) {
  const explicit = Date.parse(post.publishedAt || '')
  if (Number.isFinite(explicit)) return explicit

  const time = String(post.time || '').match(/(\d{1,2}):(\d{2})/)
  if (!time) return now
  const fallback = new Date(now)
  fallback.setHours(Number(time[1]), Number(time[2]), 0, 0)
  return fallback.getTime()
}

export function publicOpinionTokens(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
  const rawTokens = normalized.match(/[a-z][a-z0-9.+#-]{2,}|[\p{Script=Han}]{2,}/gu) || []
  const tokens = []
  for (const token of rawTokens) {
    if (STOP_WORDS.has(token)) continue
    if (/^[\p{Script=Han}]+$/u.test(token) && token.length > 2) {
      for (let index = 0; index < token.length - 1; index += 1) {
        const shingle = token.slice(index, index + 2)
        if (!STOP_WORDS.has(shingle)) tokens.push(shingle)
      }
    } else {
      tokens.push(token)
    }
  }
  return new Set(tokens)
}

export function publicOpinionSimilarity(left, right) {
  const a = left instanceof Set ? left : publicOpinionTokens(left)
  const b = right instanceof Set ? right : publicOpinionTokens(right)
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const token of a) {
    if (b.has(token)) intersection += 1
  }
  return intersection / Math.max(1, Math.min(a.size, b.size))
}

function platformKey(post) {
  return String(post.platform || post.sourceId || 'unknown').trim().toLowerCase()
}

function heatContribution(post, now) {
  const age = Math.max(0, now - timestampOf(post, now))
  if (age > HOT_WINDOW_MS) return 0
  const decay = 0.5 ** (age / HALF_LIFE_MS)
  const engagement = Math.log10(Math.max(0, Number(post.engagement || 0)) + 10)
  return decay * (12 + engagement * 8)
}

function riskFor(posts, heat, now) {
  if (!posts.length) return { score: 0, level: '低', reasons: [] }
  const negative = posts.filter((post) => Number(post.sentiment || 0) <= -0.25).length / posts.length
  const opposed = posts.filter((post) => post.stance === 'oppose' || post.stance === 'question').length / posts.length
  const lastSixHours = posts.filter((post) => now - timestampOf(post, now) <= 6 * 60 * 60 * 1000).length
  const velocity = posts.length > 1 ? lastSixHours / posts.length : 0
  const score = Math.round(clamp(negative * 42 + opposed * 24 + velocity * 18 + heat * 0.16))
  const reasons = []
  if (negative >= 0.5) reasons.push('负向内容占比较高')
  if (opposed >= 0.5) reasons.push('质疑与反对立场集中')
  if (velocity >= 0.5 && posts.length > 1) reasons.push('近 6 小时传播加速')
  if (heat >= 70) reasons.push('事件热度较高')
  const evidenceAdjustedScore = posts.length === 1 && heat < 75 ? Math.min(score, 64) : score
  return {
    score: evidenceAdjustedScore,
    level: evidenceAdjustedScore >= 70 ? '高' : evidenceAdjustedScore >= 40 ? '中' : '低',
    reasons,
  }
}

function eventFromPosts(posts, now) {
  const sorted = [...posts].sort((a, b) => timestampOf(a, now) - timestampOf(b, now))
  const latestFirst = [...sorted].reverse()
  const uniquePlatforms = new Set(posts.map(platformKey))
  const topicCount = new Map()
  for (const post of posts) {
    topicCount.set(post.topicId, (topicCount.get(post.topicId) || 0) + 1)
  }
  const topicId = [...topicCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
  const representative = [...posts].sort((a, b) => {
    const sourceDelta = Number(b.sourceId === 'aihot') - Number(a.sourceId === 'aihot')
    return sourceDelta || Number(b.engagement || 0) - Number(a.engagement || 0)
  })[0]
  const heatRaw = posts.reduce((sum, post) => sum + heatContribution(post, now), 0)
  const sourceBoost = Math.min(30, Math.max(0, uniquePlatforms.size - 1) * 12)
  const heat = Math.round(clamp(heatRaw + sourceBoost))
  const lastSixHours = posts.filter((post) => now - timestampOf(post, now) <= 6 * 60 * 60 * 1000).length
  const averageSentiment = posts.reduce((sum, post) => sum + Number(post.sentiment || 0), 0) / posts.length
  const risk = riskFor(posts, heat, now)
  const confidence = Math.round(clamp(35 + uniquePlatforms.size * 18 + Math.min(posts.length, 5) * 5))
  const isNew = now - timestampOf(sorted[0], now) <= 6 * 60 * 60 * 1000
  const isRising = posts.length > 1 && lastSixHours / posts.length >= 0.5

  return {
    id: stableId(`${topicId}:${sorted[0].id}`),
    topicId,
    title: representative.text,
    summary: representative.viewpoint || representative.text,
    heat,
    heatLabel: getPublicOpinionHeatLabel(heat),
    heatScaleMax: 100,
    heatFactors: {
      recencyAndEngagement: Math.round(clamp(heatRaw)),
      independentSources: sourceBoost,
    },
    riskScore: risk.score,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    confidence,
    sentiment: averageSentiment,
    sourceCount: uniquePlatforms.size,
    reportCount: posts.length,
    engagement: posts.reduce((sum, post) => sum + Number(post.engagement || 0), 0),
    firstReportAt: new Date(timestampOf(sorted[0], now)).toISOString(),
    latestAt: new Date(timestampOf(latestFirst[0], now)).toISOString(),
    trend: isNew ? 'new' : isRising ? 'up' : 'flat',
    badges: [isNew ? 'new' : null, isRising ? 'rising' : null, risk.level === '高' ? 'risk' : null].filter(Boolean),
    sourceNames: [...new Set(latestFirst.map((post) => post.platform).filter(Boolean))],
    postIds: latestFirst.map((post) => post.id),
    representativeUrl: representative.url || '',
  }
}

export function clusterPublicOpinionEvents(posts = [], options = {}) {
  const now = options.now instanceof Date ? options.now.getTime() : Number(options.now || Date.now())
  const clusters = []

  const ordered = [...posts]
    .filter((post) => post?.id && post?.text)
    .sort((a, b) => timestampOf(a, now) - timestampOf(b, now))

  for (const post of ordered) {
    const postAt = timestampOf(post, now)
    // Event identity follows the reported fact/title. Editorial viewpoints often reuse
    // generic wording across unrelated items and would otherwise cause false merges.
    const postTokens = publicOpinionTokens(post.text)
    let best = null
    let bestScore = 0

    for (const cluster of clusters) {
      if (postAt - cluster.latestAt > EVENT_WINDOW_MS) continue
      if (cluster.topicId !== post.topicId) continue
      const score = Math.max(...cluster.tokenSets.map((tokens) => publicOpinionSimilarity(postTokens, tokens)))
      if (score > bestScore) {
        best = cluster
        bestScore = score
      }
    }

    if (best && bestScore >= 0.56) {
      best.posts.push(post)
      best.tokenSets.push(postTokens)
      best.latestAt = Math.max(best.latestAt, postAt)
    } else {
      clusters.push({ topicId: post.topicId, posts: [post], tokenSets: [postTokens], latestAt: postAt })
    }
  }

  return clusters
    .map((cluster) => eventFromPosts(cluster.posts, now))
    .sort((a, b) => b.heat - a.heat || Date.parse(b.latestAt) - Date.parse(a.latestAt))
}

export function buildPublicOpinionBrief(events = []) {
  const highRisk = events.filter((event) => event.riskLevel === '高')
  const rising = events.filter((event) => event.trend === 'up' || event.trend === 'new')
  return {
    lead: events[0] || null,
    highRiskCount: highRisk.length,
    risingCount: rising.length,
    alert: highRisk[0] || rising[0] || events[0] || null,
  }
}
