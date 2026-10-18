import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { readXExtensionMonitor } from '../../../../../lib/community/communityActions'

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
    const offset = Number(url.searchParams.get('offset') || 0)
    const reportOffset = Number(url.searchParams.get('reportOffset') || 0)
    return Response.json({ ok: true, ...await readXExtensionMonitor(db, { date: url.searchParams.get('date') || undefined, offset, reportOffset }) })
  } catch (error) {
    if (error instanceof RangeError && error.message === 'INVALID_DATE') return Response.json({ ok: false, error: 'INVALID_DATE' }, { status: 400 })
    if (/no such table/i.test(String(error?.message || error))) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    throw error
  }
}
