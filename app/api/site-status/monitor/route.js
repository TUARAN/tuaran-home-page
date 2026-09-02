import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { safeEqual } from '../../../../lib/ownerAuth'
import { checkSiteHealth } from '../../../../lib/siteHealth'
import { applySiteHealthProbe, publicSiteStatus } from '../../../../lib/siteStatusCore'
import {
  getSiteStatusBucket,
  readSiteStatus,
  readSiteStatusMonitor,
  writeSiteStatus,
  writeSiteStatusMonitor,
} from '../../../../lib/siteStatusStore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SECRET_HEADER = 'x-site-status-secret'

function configuredSecrets(env) {
  return [
    env?.SITE_STATUS_MONITOR_SECRET,
    env?.AUTOMATION_ALERT_SECRET,
    process.env.SITE_STATUS_MONITOR_SECRET,
    process.env.AUTOMATION_ALERT_SECRET,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

export async function POST(request) {
  const env = getOptionalRequestContext()?.env || {}
  const secrets = configuredSecrets(env)
  if (!secrets.length) {
    return Response.json({ ok: false, error: 'SITE_STATUS_MONITOR_SECRET_NOT_CONFIGURED' }, { status: 503 })
  }
  const supplied = request.headers.get(SECRET_HEADER) || ''
  if (!secrets.some((secret) => safeEqual(supplied, secret))) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const bucket = getSiteStatusBucket(env)
  if (!bucket) {
    return Response.json({ ok: false, error: 'SITE_STATUS_STORAGE_UNAVAILABLE' }, { status: 503 })
  }

  const now = Date.now()
  const health = await checkSiteHealth(env, now)
  try {
    const [current, monitor] = await Promise.all([
      readSiteStatus(bucket, now),
      readSiteStatusMonitor(bucket),
    ])
    const result = applySiteHealthProbe({ current, monitor, healthy: health.healthy, now })
    await Promise.all([
      result.changed ? writeSiteStatus(bucket, result.status, now) : Promise.resolve(result.status),
      writeSiteStatusMonitor(bucket, result.monitor),
    ])
    return Response.json({
      ok: true,
      changed: result.changed,
      health,
      status: publicSiteStatus(result.status, now),
      monitor: result.monitor,
    })
  } catch {
    return Response.json({ ok: false, error: 'SITE_STATUS_MONITOR_WRITE_FAILED' }, { status: 500 })
  }
}
