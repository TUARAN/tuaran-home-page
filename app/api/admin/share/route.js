import {
  cookieNames,
  getSecrets,
  parseCookies,
  verifySession,
} from '../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../lib/ownerAuth'
import {
  createSharedNote,
  deleteSharedNote,
  listSharedNotes,
  updateSharedNote,
} from '../../../../lib/sharedNotes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function getOwnerOrReject(req) {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret)
    return { ok: false, response: Response.json({ error: 'MISSING_AUTH_CONFIG' }, { status: 500 }) }
  const cookies = parseCookies(req)
  const token = cookies[cookieNames.session]
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null
  if (!user) return { ok: false, response: Response.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 }) }
  if (!isOwnerUser(user))
    return { ok: false, response: Response.json({ error: 'NOT_OWNER' }, { status: 403 }) }
  return { ok: true, user }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const items = await listSharedNotes()
  return Response.json({ items })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const result = await createSharedNote({
    envelope: body?.envelope,
    title: body?.title,
    expiresInDays: body?.expiresInDays ?? null,
    createdBy: guard.user?.id || guard.user?.login || null,
  })
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const result = await updateSharedNote({
    slug: body?.slug,
    envelope: body?.envelope,
    title: body?.title,
    expiresInDays: body?.expiresInDays,
  })
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  const result = await deleteSharedNote(slug)
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}
