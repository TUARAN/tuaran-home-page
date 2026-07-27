import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { safeEqual } from '../../../../lib/ownerAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-pv-cleanup-secret'
const DAY_MS = 24 * 60 * 60 * 1000
// 后台保留 120 天明细，覆盖 90 天分析周期并留出 30 天边界缓冲。
const HIT_RETENTION_MS = 120 * DAY_MS

export async function POST(request) {
  const env = getOptionalRequestContext()?.env || {}
  const requiredSecret = String(
    env.PV_CLEANUP_SECRET
      || env.WEEKLY_SUMMARY_SECRET
      || env.PUBLIC_OPINION_COLLECT_SECRET
      || '',
  )
  const suppliedSecret = request.headers.get(HEADER_SECRET) || ''

  if (!safeEqual(suppliedSecret, requiredSecret)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ error: 'D1 binding DB is missing' }, { status: 500 })
  }

  try {
    const now = Date.now()
    const cutoff = now - HIT_RETENTION_MS
    const result = await env.DB
      .prepare('DELETE FROM research_pv_hits WHERE created_at < ?1')
      .bind(cutoff)
      .run()

    return Response.json({
      ok: true,
      generatedAt: now,
      retentionDays: HIT_RETENTION_MS / DAY_MS,
      cutoff,
      deleted: Math.max(0, Number(result?.meta?.changes) || 0),
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'PV_HIT_CLEANUP_FAILED',
        detail: String(error?.message || error),
      },
      { status: 500 },
    )
  }
}
