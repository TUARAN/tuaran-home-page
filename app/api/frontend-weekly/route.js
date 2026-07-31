import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { FRONTEND_WEEKLY_KEYS, frontendWeeklyCorsHeaders, readR2Json } from '../../../lib/frontendWeeklyData'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const cors = frontendWeeklyCorsHeaders(request)
  const bucket = getOptionalRequestContext()?.env?.CONTENT_FEED
  if (!bucket) {
    return Response.json(
      { ok: false, error: 'CONTENT_FEED_UNAVAILABLE' },
      { status: 503, headers: { ...cors, 'Cache-Control': 'no-store' } },
    )
  }
  const [weekly, daily, live] = await Promise.all([
    readR2Json(bucket, FRONTEND_WEEKLY_KEYS.weeklyIndex, { updatedAt: null, issues: [] }),
    readR2Json(bucket, FRONTEND_WEEKLY_KEYS.dailyIndex, { latest: '', list: [] }),
    readR2Json(bucket, FRONTEND_WEEKLY_KEYS.live, { updatedAt: null, items: [] }),
  ])
  return Response.json(
    { ok: true, weekly, daily, live },
    { headers: { ...cors, 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' } },
  )
}
