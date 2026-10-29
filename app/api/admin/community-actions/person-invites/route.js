import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import {
  createPersonInvite,
  listPersonInvites,
  resetPersonInviteToDownloadable,
  revokePersonInvite,
} from '../../../../../lib/content/xReplyPersonInvite.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function noStore(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function isMissingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const invites = await listPersonInvites(getD1())
    return noStore({ ok: true, invites })
  } catch (error) {
    if (isMissingTable(error)) {
      return noStore({ ok: false, error: 'MIGRATION_REQUIRED', migrationRequired: '请先应用迁移 0124_x_reply_person_invites.sql。' }, 503)
    }
    return noStore({ ok: false, error: 'LIST_FAILED' }, 503)
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  let body = null
  try {
    body = await req.json()
  } catch {
    body = null
  }
  const action = String(body?.action || '').trim()
  const actor = auth.user?.login || 'owner'
  try {
    const db = getD1()
    if (action === 'create') {
      const created = await createPersonInvite(db, { label: body?.label || '', actor })
      return noStore({ ok: true, invite: created, code: created.code })
    }
    if (action === 'reset') {
      const result = await resetPersonInviteToDownloadable(db, body?.id, actor)
      if (!result.ok) return noStore({ ok: false, error: result.error }, 404)
      return noStore({ ok: true, ...result })
    }
    if (action === 'revoke') {
      const result = await revokePersonInvite(db, body?.id, actor)
      if (!result.ok) return noStore({ ok: false, error: result.error }, 404)
      return noStore({ ok: true, ...result })
    }
    return noStore({ ok: false, error: 'UNKNOWN_ACTION' }, 400)
  } catch (error) {
    if (isMissingTable(error)) {
      return noStore({ ok: false, error: 'MIGRATION_REQUIRED', migrationRequired: '请先应用迁移 0124_x_reply_person_invites.sql。' }, 503)
    }
    return noStore({ ok: false, error: 'ACTION_FAILED', detail: String(error?.message || error) }, 503)
  }
}
