import { getUserFromRequest } from '../../../../../lib/auth/edgeSession'
import { bindIdentityToUser } from '../../../../../lib/auth/accountIdentities'
import { getIntegrationEnv } from '../../../../../lib/site/integrationKeys'
import { isSupabaseEmailAuthEnabled, signInSupabaseEmail } from '../../../../../lib/supabase/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const currentUser = await getUserFromRequest(req)
  if (!currentUser?.id) return Response.json({ error: 'LOGIN_REQUIRED' }, { status: 401 })
  const env = getIntegrationEnv()
  if (!isSupabaseEmailAuthEnabled(env)) return Response.json({ error: 'SUPABASE_AUTH_UNAVAILABLE' }, { status: 503 })
  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  const auth = await signInSupabaseEmail(env, body.email, body.password)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status || 401 })
  const result = await bindIdentityToUser({
    provider: 'supabase',
    providerAccountId: auth.providerAccountId,
    userId: currentUser.id,
    profile: auth.profile,
  })
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status || 409 })
  return Response.json({ ok: true, alreadyBound: result.alreadyBound })
}
