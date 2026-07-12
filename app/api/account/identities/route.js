import { getUserFromRequest } from '../../../../lib/edgeSession'
import { listAccountIdentities } from '../../../../lib/accountIdentities'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) return Response.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })
  const identities = await listAccountIdentities(user.id)
  return Response.json({ identities })
}
