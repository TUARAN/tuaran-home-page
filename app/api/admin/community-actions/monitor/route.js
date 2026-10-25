import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { enqueueXRemoteCommand, readExtensionLive, readExtensionMonitor } from '../../../../../lib/community/communityActions'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  let db
  try { db = getD1() } catch { return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 }) }
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })
  try {
    const url = new URL(req.url)
    const platform = url.searchParams.get('platform') || 'x'
    if (url.searchParams.get('view') === 'live') {
      return Response.json({ ok: true, ...await readExtensionLive(db, { platform }) })
    }
    const offset = Number(url.searchParams.get('offset') || 0)
    const reportOffset = Number(url.searchParams.get('reportOffset') || 0)
    return Response.json({ ok: true, ...await readExtensionMonitor(db, { platform, date: url.searchParams.get('date') || undefined, offset, reportOffset }) })
  } catch (error) {
    if (error instanceof RangeError && ['INVALID_DATE', 'INVALID_PLATFORM'].includes(error.message)) return Response.json({ ok: false, error: error.message }, { status: 400 })
    if (/no such table/i.test(String(error?.message || error))) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    console.error('Plugin monitor read failed:', error)
    return Response.json({ ok: false, error: 'MONITOR_READ_FAILED' }, { status: 500 })
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  let db
  try { db = getD1() } catch { return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 }) }
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })
  let body = null
  try { body = await req.json() } catch { body = null }
  if (!body || typeof body !== 'object') return Response.json({ ok: false, error: 'INVALID_COMMAND' }, { status: 400 })
  try {
    const result = await enqueueXRemoteCommand(db, {
      deviceId: body.deviceId,
      command: body.command,
      mode: body.mode || '',
    })
    if (!result.ok) return Response.json(result, { status: 400 })
    return Response.json(result)
  } catch (error) {
    if (/no such table/i.test(String(error?.message || error))) {
      return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    }
    console.error('Plugin remote command failed:', error)
    return Response.json({ ok: false, error: 'COMMAND_FAILED' }, { status: 500 })
  }
}
