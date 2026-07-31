import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  dailyObjectKey,
  frontendWeeklyCorsHeaders,
  isValidDailyDate,
  readR2Json,
} from '../../../../../lib/frontendWeeklyData'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const cors = frontendWeeklyCorsHeaders(request)
  const { date = '' } = await params
  if (!isValidDailyDate(date)) {
    return Response.json({ error: 'INVALID_DATE' }, { status: 400, headers: cors })
  }
  const bucket = getOptionalRequestContext()?.env?.CONTENT_FEED
  if (!bucket) {
    return Response.json({ error: 'CONTENT_FEED_UNAVAILABLE' }, { status: 503, headers: cors })
  }
  const entry = await readR2Json(bucket, dailyObjectKey(date))
  if (!entry) return Response.json({ error: 'NOT_FOUND' }, { status: 404, headers: cors })
  return Response.json(entry, {
    headers: { ...cors, 'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
