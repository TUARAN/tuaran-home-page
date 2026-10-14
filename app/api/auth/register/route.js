import { getIntegrationEnv } from '../../../../lib/site/integrationKeys'
import { isSupabaseEmailAuthEnabled, signUpSupabaseEmail } from '../../../../lib/supabase/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const env = getIntegrationEnv()
    if (!isSupabaseEmailAuthEnabled(env)) {
      return Response.json({ error: 'SUPABASE_AUTH_UNAVAILABLE' }, { status: 503 })
    }
    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }
    const result = await signUpSupabaseEmail(env, {
      email: body?.email,
      password: body?.password,
      name: body?.name,
    })
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status || 400 })
    return Response.json({ ok: true, pendingConfirmation: true })
  } catch (error) {
    console.error('email registration failed', error)
    return Response.json({ error: 'REGISTER_FAILED' }, { status: 500 })
  }
}
