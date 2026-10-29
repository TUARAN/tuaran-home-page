import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { safeEqual } from '../../../../../lib/auth/ownerAuth'
import { collectScheduledUsage } from '../../../../../lib/site/cloudflareUsageOps'

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
    // Archive yesterday + sample today; today triggers 80%/95% owner alerts when crossed.
    const result = await collectScheduledUsage(env)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return Response.json({ ok: false, error: String(error?.message || error) }, { status: 502 })
  }
}
