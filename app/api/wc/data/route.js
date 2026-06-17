/**
 * 读取入口:页面 /agent-world-cup 调这里
 * 一次拉齐 matches / standings / scorers / assists / cards / meta
 *
 * 设计:
 *  - 即使 D1 没数据(采集还没跑过),也返回 200 + empty arrays,让页面能渲染骨架
 *  - meta 携带 lastCollectAt / lastCollectStatus,前端用来显示"最后更新"和降级标记
 */

import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { WC_SKELETON } from '../../../../lib/wc/skeleton.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function handle(request, ctx) {
  const env = ctx?.env || {}
  const db = env.DB
  const url = new URL(request.url)
  const useFallback = url.searchParams.get('fallback') === '1'

  if (!db) {
    return Response.json({
      source: 'no-d1',
      generatedAt: new Date().toISOString(),
      meta: { lastCollectAt: 0, lastCollectStatus: 'no-d1', lastCollectError: 'D1 missing' },
      skeleton: WC_SKELETON,
      matches: [],
      standings: [],
      scorers: [],
      assists: [],
      cards: [],
    })
  }

  try {
    const [meta, matches, standings, scorers, assists, cards] = await Promise.all([
      readMeta(db),
      readMatches(db),
      readStandings(db),
      readScorers(db),
      readAssists(db),
      readCards(db),
    ])

    // 注意:readMeta 返回的是 wc_meta 的原始 snake_case key,这里要对应着读。
    // 距上次采集超过 2 小时,或 D1 里没数据 → 标 degraded
    const lastCollectAt = Number(meta.last_collect_at || 0)
    const isStale = !lastCollectAt || Date.now() / 1000 - lastCollectAt > 2 * 3600
    const hasData = matches.length + standings.length + scorers.length > 0

    return Response.json({
      source: 'd1',
      generatedAt: new Date().toISOString(),
      meta: {
        lastCollectAt,
        lastCollectStatus: meta.last_collect_status || 'never',
        lastCollectError: meta.last_collect_error || '',
        isStale,
        hasData,
      },
      skeleton: WC_SKELETON,
      matches,
      standings,
      scorers,
      assists,
      cards,
    })
  } catch (err) {
    return Response.json(
      {
        source: 'error',
        generatedAt: new Date().toISOString(),
        meta: { lastCollectAt: 0, lastCollectStatus: 'error', lastCollectError: err.message, isStale: true, hasData: false },
        skeleton: WC_SKELETON,
        matches: [],
        standings: [],
        scorers: [],
        assists: [],
        cards: [],
      },
      { status: 200 },
    )
  }
}

// 注意:Next.js App Router 传给 handler 的第二参是 { params },不是 Cloudflare 上下文,
// 所以必须直接调 getOptionalRequestContext() 拿 env.DB(跟 lib/d1.js 一致)。
export const GET = (request) => handle(request, getOptionalRequestContext())

/* ━━━ D1 reads ━━━ */

async function readMeta(db) {
  const rows = await db
    .prepare(`SELECT k, v FROM wc_meta`)
    .all()
  const map = {}
  for (const r of rows?.results || []) map[r.k] = r.v
  return map
}

async function readMatches(db) {
  const { results } = await db
    .prepare(
      `SELECT * FROM wc_matches
       ORDER BY match_timestamp ASC, fixture_id ASC`,
    )
    .all()
  return results || []
}

async function readStandings(db) {
  const { results } = await db
    .prepare(
      `SELECT * FROM wc_standings
       ORDER BY group_label ASC, rank ASC`,
    )
    .all()
  return results || []
}

async function readScorers(db) {
  const { results } = await db
    .prepare(
      `SELECT * FROM wc_scorers
       ORDER BY goals DESC, assists DESC, played ASC
       LIMIT 25`,
    )
    .all()
  return results || []
}

async function readAssists(db) {
  const { results } = await db
    .prepare(
      `SELECT * FROM wc_assists
       ORDER BY assists DESC, played ASC
       LIMIT 25`,
    )
    .all()
  return results || []
}

async function readCards(db) {
  const { results } = await db
    .prepare(
      `SELECT * FROM wc_cards
       ORDER BY count DESC
       LIMIT 25`,
    )
    .all()
  return results || []
}
