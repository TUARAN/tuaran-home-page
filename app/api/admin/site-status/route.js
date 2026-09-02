import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { checkSiteHealth } from '../../../../lib/siteHealth'
import { createManualSiteStatus, publicSiteStatus } from '../../../../lib/siteStatusCore'
import {
  getSiteStatusBucket,
  readSiteStatus,
  readSiteStatusMonitor,
  writeSiteStatus,
} from '../../../../lib/siteStatusStore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const env = getOptionalRequestContext()?.env || {}
  const bucket = getSiteStatusBucket(env)
  if (!bucket) {
    return Response.json({ status: 'unavailable', error: 'SITE_STATUS_STORAGE_UNAVAILABLE' }, { status: 503 })
  }

  try {
    const [current, monitor, health] = await Promise.all([
      readSiteStatus(bucket),
      readSiteStatusMonitor(bucket),
      checkSiteHealth(env),
    ])
    return Response.json({ status: 'ok', current: publicSiteStatus(current), monitor, health })
  } catch {
    return Response.json({ status: 'error', error: 'SITE_STATUS_READ_FAILED' }, { status: 500 })
  }
}

export async function PUT(request) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) return guard.response
  const env = getOptionalRequestContext()?.env || {}
  const bucket = getSiteStatusBucket(env)
  if (!bucket) {
    return Response.json({ ok: false, error: 'SITE_STATUS_STORAGE_UNAVAILABLE' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 })

  try {
    const current = await readSiteStatus(bucket)
    const next = createManualSiteStatus(body, current)
    const saved = await writeSiteStatus(bucket, next)
    return Response.json({ ok: true, current: publicSiteStatus(saved) })
  } catch (error) {
    if (error?.message === 'INVALID_STATUS') {
      return Response.json({ ok: false, error: 'INVALID_STATUS' }, { status: 400 })
    }
    return Response.json({ ok: false, error: 'SITE_STATUS_WRITE_FAILED' }, { status: 500 })
  }
}
