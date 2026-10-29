import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getIntegrationEnv } from '../../../../lib/site/integrationKeys'
import { readUsageHistory, utcDate } from '../../../../lib/site/cloudflareUsage'
import { persistUsageReport, usageDashboardMeta } from '../../../../lib/site/cloudflareUsageOps'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const env = getIntegrationEnv()
  const bucket = env.CONTENT_FEED
  if (!bucket) return Response.json({ ok: false, error: 'CONTENT_FEED_NOT_CONFIGURED' }, { status: 503 })
  try {
    let history = await readUsageHistory(bucket)
    const today = utcDate()
    const current = history.find((row) => row.date === today)
    let refreshError = ''
    let notified = 0
    if (new URL(request.url).searchParams.get('cached') !== '1' && (!current || Date.now() - Number(current.collectedAt || 0) > 15 * 60_000)) {
      try {
        const saved = await persistUsageReport(env, today, { alert: true })
        notified = saved.notification.created
        history = await readUsageHistory(bucket)
      } catch (error) {
        refreshError = String(error?.message || error)
      }
    }
    const meta = usageDashboardMeta(history)
    return Response.json({
      ok: true,
      history,
      refreshError,
      notified,
      ...meta,
    })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 500 })
  }
}

export async function POST(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const env = getIntegrationEnv()
  if (!env.CONTENT_FEED) return Response.json({ ok: false, error: 'CONTENT_FEED_NOT_CONFIGURED' }, { status: 503 })
  try {
    const date = new URL(request.url).searchParams.get('date') || utcDate()
    const at = Date.parse(`${date}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(at) || utcDate(at) !== date || at > Date.now() || Date.now() - at > 31 * 86_400_000) {
      return Response.json({ ok: false, error: 'INVALID_DATE' }, { status: 400 })
    }
    const saved = await persistUsageReport(env, date, { alert: date === utcDate() })
    return Response.json({
      ok: true,
      report: saved.report,
      alerts: saved.pressure,
      notified: saved.notification.created,
    })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 502 })
  }
}
