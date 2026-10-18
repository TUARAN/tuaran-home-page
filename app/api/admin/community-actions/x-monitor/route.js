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
    return Response.json({ ok: true, ...await readXExtensionMonitor(db) })
  } catch (error) {
    if (/no such table/i.test(String(error?.message || error))) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    throw error
  }
}
