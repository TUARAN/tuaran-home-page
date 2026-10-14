import { registerEmailUser } from '../../../../lib/auth/emailAuth'
import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  serializeLastLoginMethodCookie,
  serializeCookie,
  signSession,
} from '../../../../lib/auth/edgeSession'
import { recordUserLogin } from '../../../../lib/auth/userDirectory'
import { clearGuestCookie, mergeGuestFromRequest } from '../../../../lib/auth/guestSession'
import { awardRegisterOnLogin } from '../../../../lib/ledger/points'
import { resolveEmailLogin } from '../../../../lib/auth/accountIdentities'
import { getIntegrationEnv } from '../../../../lib/site/integrationKeys'
import { isSupabaseEmailAuthEnabled, signUpSupabaseEmail } from '../../../../lib/supabase/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) {
      return Response.json({ error: 'MISSING_AUTH_CONFIG', missing: ['NEXTAUTH_SECRET'] }, { status: 500 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const env = getIntegrationEnv()
    if (isSupabaseEmailAuthEnabled(env)) {
      const result = await signUpSupabaseEmail(env, {
        email: body?.email,
        password: body?.password,
        name: body?.name,
      })
      if (!result.ok) return Response.json({ error: result.error }, { status: result.status || 400 })
      return Response.json({ ok: true, pendingConfirmation: true })
    }

    const result = await registerEmailUser({
      rawEmail: body?.email,
      password: body?.password,
      rawCode: body?.code,
      rawName: body?.name,
    })
    if (!result.ok) return Response.json(result, { status: result.status || 400 })

    const account = await resolveEmailLogin(result.user)
    if (!account.ok) return Response.json({ error: account.error }, { status: account.status || 500 })
    const user = account.user
    await recordUserLogin(user)
    await awardRegisterOnLogin(user)
    const mergedGid = await mergeGuestFromRequest(req, user)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { user, iat: nowSeconds, exp: nowSeconds + 7 * 24 * 60 * 60 },
      sessionSecret
    )
    const { secure } = cookiesConfig()
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      serializeCookie(cookieNames.session, token, { maxAge: 7 * 24 * 60 * 60, secure })
    )
    headers.append('Set-Cookie', serializeLastLoginMethodCookie('email', { secure }))
    if (mergedGid) headers.append('Set-Cookie', clearGuestCookie())

    return Response.json({ ok: true, user }, { headers })
  } catch (error) {
    console.error('email registration failed', error)
    const message = String(error?.message || '')
    if (message.includes('UNIQUE constraint failed')) {
      return Response.json({ error: 'EMAIL_ALREADY_REGISTERED' }, { status: 409 })
    }
    return Response.json({ error: 'REGISTER_FAILED' }, { status: 500 })
  }
}
