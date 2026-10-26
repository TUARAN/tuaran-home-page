import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { safeEqual } from '../../../../../lib/auth/ownerAuth'
import { collectCloudflareUsage, previousUtcDate, writeUsageDay } from '../../../../../lib/site/cloudflareUsage'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const env = getOptionalRequestContext()?.env || {}
  const secret = String(env.SITE_STATUS_MONITOR_SECRET || env.AUTOMATION_ALERT_SECRET || '').trim()
  if (!secret) return Response.json({ ok: false, error: 'MONITOR_SECRET_NOT_CONFIGURED' }, { status: 503 })
  if (!safeEqual(request.headers.get('x-site-status-secret') || '', secret)) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.CONTENT_FEED) return Response.json({ ok: false, error: 'CONTENT_FEED_NOT_CONFIGURED' }, { status: 503 })
  try {
    // One GraphQL call per scheduled run avoids draining its cost-based budget.
    const date = previousUtcDate()
    const report = await collectCloudflareUsage(env, date)
    await writeUsageDay(env.CONTENT_FEED, report)
    return Response.json({ ok: true, reports: [{
      date, workers: report.workers.total, d1RowsRead: report.d1.rowsRead,
      d1RowsWritten: report.d1.rowsWritten, topPaths: report.topPaths.slice(0, 5),
    }] })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 502 })
  }
}
