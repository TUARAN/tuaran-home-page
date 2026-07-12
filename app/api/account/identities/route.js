import { getUserFromRequest } from '../../../../lib/edgeSession'
import {
  listAccountGuestIdentities,
  listAccountIdentities,
  unbindIdentityFromUser,
} from '../../../../lib/accountIdentities'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })
  const [identities, guestIdentities] = await Promise.all([
    listAccountIdentities(user.id),
    listAccountGuestIdentities(user.id),
  ])
  return Response.json({ account: { platformId: user.id }, identities, guestIdentities })
}

export async function DELETE(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })
  const provider = new URL(req.url).searchParams.get('provider') || ''
  const result = await unbindIdentityFromUser({ provider, userId: user.id })
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status || 400 })
  return Response.json({ ok: true })
}
