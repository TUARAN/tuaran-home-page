import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { listPersonInvites } from '../../../../../lib/content/xReplyPersonInvite.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function noStore(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

/** Compat: download passwords are now person invites. Prefer /person-invites. */
export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const invites = await listPersonInvites(getD1())
    const downloadable = invites.filter((item) => item.status === 'downloadable').length
    return noStore({
      ok: true,
      deprecated: true,
      use: '/api/admin/community-actions/person-invites',
      downloadable,
      total: invites.length,
    })
  } catch {
    return noStore({ ok: false, error: 'PASSWORD_STORE_UNAVAILABLE' }, 503)
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  return noStore({
    ok: false,
    error: 'USE_PERSON_INVITES',
    message: '请改用 /api/admin/community-actions/person-invites 生成一人一码。',
  }, 410)
}