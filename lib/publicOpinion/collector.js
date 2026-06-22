import { OPINION_TOPICS, getSentimentBucket } from '../publicOpinionData.js'

const GDELT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc'
const HN_ENDPOINT = 'https://hn.algolia.com/api/v1/search_by_date'
const RETENTION_SECONDS = 14 * 24 * 60 * 60
const FETCH_TIMEOUT_MS = 18_000

const POSITIVE_WORDS = [
  'advance',
  'breakthrough',
  'faster',
  'gain',
  'growth',
  'improve',
  'launch',
  'open source',
  'record',
  'success',
  '支持',
  '增长',
  '提升',
  '发布',
  '开源',
  '突破',
]

const NEGATIVE_WORDS = [
  'attack',
  'ban',
  'breach',
  'concern',
  'crash',
  'fail',
  'lawsuit',
  'risk',
  'scam',
  'vulnerability',
  '下跌',
  '争议',
  '失败',
  '担忧',
  '漏洞',
  '风险',
]

function stableId(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `po_${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function cleanText(value, maxLength = 500) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function scoreSentiment(text) {
  const normalized = text.toLowerCase()
  const positive = POSITIVE_WORDS.reduce(
    (count, word) => count + (normalized.includes(word.toLowerCase()) ? 1 : 0),
    0,
  )
  const negative = NEGATIVE_WORDS.reduce(
    (count, word) => count + (normalized.includes(word.toLowerCase()) ? 1 : 0),
    0,
  )
  if (!positive && !negative) return 0
  return Math.max(-1, Math.min(1, (positive - negative) / Math.max(positive + negative, 2)))
}

function stanceFromSentiment(sentiment) {
  if (sentiment >= 0.25) return 'support'
  if (sentiment <= -0.45) return 'oppose'
  if (sentiment < -0.1) return 'question'
  return 'neutral'
}

function parseGdeltDate(value) {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value || '')
  if (!match) return new Date().toISOString()
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': '2aran-public-opinion-collector/1.0',
      },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`${new URL(url).hostname} returned ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchGdelt(topic) {
  const params = new URLSearchParams({
    query: topic.query,
    mode: 'artlist',
    maxrecords: '12',
    format: 'json',
    sort: 'datedesc',
  })
  const payload = await fetchJson(`${GDELT_ENDPOINT}?${params}`)
  return (payload.articles || []).map((article) => {
    const text = cleanText(article.title, 320)
    const sentiment = scoreSentiment(text)
    const url = String(article.url || '')
    return {
      id: stableId(`news:${url}`),
      topicId: topic.id,
      sourceId: 'news',
      platform: cleanText(article.domain || '公开新闻', 100),
      publishedAt: parseGdeltDate(article.seendate),
      sentiment,
      stance: stanceFromSentiment(sentiment),
      engagement: 10,
      text,
      viewpoint: `${topic.title}相关公开报道，当前标题情绪为${getSentimentBucket(sentiment) === 'negative' ? '负向' : getSentimentBucket(sentiment) === 'positive' ? '正向' : '中性'}。`,
      url,
    }
  })
}

async function fetchHackerNews(topic) {
  const params = new URLSearchParams({
    query: topic.communityQuery,
    tags: 'story',
    hitsPerPage: '12',
  })
  const payload = await fetchJson(`${HN_ENDPOINT}?${params}`)
  return (payload.hits || []).map((hit) => {
    const text = cleanText(hit.title || hit.story_title, 320)
    const sentiment = scoreSentiment(text)
    const url = hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`
    const points = Number(hit.points || 0)
    const comments = Number(hit.num_comments || 0)
    return {
      id: stableId(`forum:${hit.objectID || url}`),
      topicId: topic.id,
      sourceId: 'forum',
      platform: 'Hacker News',
      publishedAt: hit.created_at || new Date().toISOString(),
      sentiment,
      stance: stanceFromSentiment(sentiment),
      engagement: Math.max(10, points + comments * 2),
      text,
      viewpoint: `社区互动 ${points} 票、${comments} 条评论，讨论热度由公开互动量计算。`,
      url,
    }
  })
}

function dedupePosts(posts) {
  const seen = new Set()
  return posts.filter((post) => {
    if (!post.text || !post.url || seen.has(post.id)) return false
    seen.add(post.id)
    return true
  })
}

function chunks(rows, size) {
  const result = []
  for (let index = 0; index < rows.length; index += size) {
    result.push(rows.slice(index, index + size))
  }
  return result
}

async function upsertPosts(db, posts, collectedAt) {
  const sql = `INSERT INTO public_opinion_posts
    (id, topic_id, source_id, platform, published_at, sentiment, stance, engagement,
     text, viewpoint, url, collected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      topic_id = excluded.topic_id,
      source_id = excluded.source_id,
      platform = excluded.platform,
      published_at = excluded.published_at,
      sentiment = excluded.sentiment,
      stance = excluded.stance,
      engagement = excluded.engagement,
      text = excluded.text,
      viewpoint = excluded.viewpoint,
      url = excluded.url,
      collected_at = excluded.collected_at`

  for (const group of chunks(posts, 40)) {
    await db.batch(
      group.map((post) =>
        db
          .prepare(sql)
          .bind(
            post.id,
            post.topicId,
            post.sourceId,
            post.platform,
            post.publishedAt,
            post.sentiment,
            post.stance,
            post.engagement,
            post.text,
            post.viewpoint,
            post.url,
            collectedAt,
          ),
      ),
    )
  }
}

async function writeTrend(db, posts, collectedAt) {
  const positive = posts.filter((post) => post.sentiment >= 0.25).length
  const negative = posts.filter((post) => post.sentiment <= -0.25).length
  const bucketAt = Math.floor(collectedAt / 3600) * 3600
  const heat = posts.reduce((sum, post) => sum + post.engagement, 0)
  await db
    .prepare(
      `INSERT INTO public_opinion_trends
        (bucket_at, heat, positive, negative, post_count, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(bucket_at) DO UPDATE SET
        heat = excluded.heat,
        positive = excluded.positive,
        negative = excluded.negative,
        post_count = excluded.post_count,
        updated_at = excluded.updated_at`,
    )
    .bind(
      bucketAt,
      heat,
      posts.length ? Math.round((positive / posts.length) * 100) : 0,
      posts.length ? Math.round((negative / posts.length) * 100) : 0,
      posts.length,
      collectedAt,
    )
    .run()
}

async function writeMeta(db, key, value, updatedAt) {
  await db
    .prepare(
      `INSERT INTO public_opinion_meta (k, v, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at`,
    )
    .bind(key, String(value), updatedAt)
    .run()
}

export async function runPublicOpinionCollect({ db, log = () => {} }) {
  const startedAt = Date.now()
  const collectedAt = Math.floor(startedAt / 1000)
  const tasks = OPINION_TOPICS.flatMap((topic) => [
    { label: `GDELT/${topic.id}`, run: () => fetchGdelt(topic) },
    { label: `HN/${topic.id}`, run: () => fetchHackerNews(topic) },
  ])

  const results = await Promise.allSettled(tasks.map((task) => task.run()))
  const failures = []
  const posts = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      posts.push(...result.value)
      log(`${tasks[index].label}: ${result.value.length}`)
    } else {
      failures.push(`${tasks[index].label}: ${result.reason?.message || 'unknown error'}`)
      log(`${tasks[index].label}: failed`)
    }
  })

  const uniquePosts = dedupePosts(posts)
  if (!uniquePosts.length) {
    throw new Error(`all public opinion sources failed: ${failures.join('; ')}`)
  }

  await upsertPosts(db, uniquePosts, collectedAt)
  await writeTrend(db, uniquePosts, collectedAt)
  await db
    .prepare(`DELETE FROM public_opinion_posts WHERE collected_at < ?`)
    .bind(collectedAt - RETENTION_SECONDS)
    .run()
  await db
    .prepare(`DELETE FROM public_opinion_trends WHERE bucket_at < ?`)
    .bind(collectedAt - RETENTION_SECONDS)
    .run()

  await Promise.all([
    writeMeta(db, 'last_collect_at', collectedAt, collectedAt),
    writeMeta(db, 'last_collect_status', failures.length ? 'partial' : 'ok', collectedAt),
    writeMeta(db, 'last_collect_error', failures.join('; '), collectedAt),
    writeMeta(db, 'last_collect_count', uniquePosts.length, collectedAt),
  ])

  return {
    posts: uniquePosts.length,
    sourcesSucceeded: results.length - failures.length,
    sourcesFailed: failures.length,
    failures,
    durationMs: Date.now() - startedAt,
  }
}

export async function recordPublicOpinionCollectError(db, message) {
  const now = Math.floor(Date.now() / 1000)
  await Promise.all([
    writeMeta(db, 'last_collect_status', 'error', now),
    writeMeta(db, 'last_collect_error', String(message || 'unknown error').slice(0, 1500), now),
  ])
}
