import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  OPINION_POSTS,
  OPINION_TOPICS,
  PUBLIC_OPINION_STACK,
  SOURCE_CONNECTORS,
  TREND_POINTS,
  buildPublicOpinionSnapshot,
} from '../../../lib/publicOpinionData'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  } catch {
    return value
  }
}

function fallbackPayload(reason = 'D1 暂不可用，正在展示内置样本') {
  return {
    source: 'fallback',
    generatedAt: new Date().toISOString(),
    meta: {
      lastCollectAt: 0,
      lastCollectStatus: 'fallback',
      lastCollectError: reason,
      isStale: true,
      hasData: false,
    },
    snapshot: buildPublicOpinionSnapshot(OPINION_POSTS, OPINION_TOPICS, SOURCE_CONNECTORS),
    topics: OPINION_TOPICS,
    posts: OPINION_POSTS,
    connectors: SOURCE_CONNECTORS,
    stack: PUBLIC_OPINION_STACK,
    trendPoints: TREND_POINTS,
  }
}

async function readMeta(db) {
  const { results } = await db.prepare(`SELECT k, v FROM public_opinion_meta`).all()
  return Object.fromEntries((results || []).map((row) => [row.k, row.v]))
}

async function readPosts(db) {
  const { results } = await db
    .prepare(
      `SELECT id, topic_id, source_id, platform, published_at, sentiment, stance,
              engagement, text, viewpoint, url
       FROM public_opinion_posts
       ORDER BY published_at DESC
       LIMIT 160`,
    )
    .all()

  return (results || []).map((row) => ({
    id: row.id,
    topicId: row.topic_id,
    sourceId: row.source_id,
    platform: row.platform,
    publishedAt: row.published_at,
    time: formatTime(row.published_at),
    sentiment: Number(row.sentiment || 0),
    stance: row.stance || 'neutral',
    engagement: Number(row.engagement || 0),
    text: row.text,
    viewpoint: row.viewpoint,
    url: row.url,
  }))
}

async function readTrendPoints(db) {
  const { results } = await db
    .prepare(
      `SELECT bucket_at, heat, positive, negative
       FROM public_opinion_trends
       ORDER BY bucket_at DESC
       LIMIT 12`,
    )
    .all()

  return (results || [])
    .reverse()
    .map((row) => ({
      time: new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
      }).format(new Date(Number(row.bucket_at) * 1000)),
      heat: Number(row.heat || 0),
      positive: Number(row.positive || 0),
      negative: Number(row.negative || 0),
    }))
}

export async function GET() {
  const db = getOptionalRequestContext()?.env?.DB
  if (!db) {
    return Response.json(fallbackPayload())
  }

  try {
    const [meta, posts, trendPoints] = await Promise.all([
      readMeta(db),
      readPosts(db),
      readTrendPoints(db),
    ])
    if (!posts.length) {
      return Response.json(fallbackPayload('采集任务尚未产生数据'))
    }

    const lastCollectAt = Number(meta.last_collect_at || 0)
    const isStale = !lastCollectAt || Date.now() / 1000 - lastCollectAt > 2 * 60 * 60
    return Response.json(
      {
        source: 'd1',
        generatedAt: new Date().toISOString(),
        meta: {
          lastCollectAt,
          lastCollectStatus: meta.last_collect_status || 'never',
          lastCollectError: meta.last_collect_error || '',
          lastCollectCount: Number(meta.last_collect_count || 0),
          isStale,
          hasData: true,
        },
        snapshot: buildPublicOpinionSnapshot(posts, OPINION_TOPICS, SOURCE_CONNECTORS),
        topics: OPINION_TOPICS,
        posts,
        connectors: SOURCE_CONNECTORS,
        stack: PUBLIC_OPINION_STACK,
        trendPoints: trendPoints.length ? trendPoints : TREND_POINTS,
      },
      {
        headers: {
          'cache-control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    return Response.json(fallbackPayload(error.message))
  }
}
