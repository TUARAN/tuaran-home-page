import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  serializeCookie,
  serializeLastLoginMethodCookie,
  signSession,
} from '../../../../lib/edgeSession'
import { getD1 } from '../../../../lib/d1'
import { authenticateLoginCredential } from '../../../../lib/loginCredentials'
import { ensureIdentityForUser } from '../../../../lib/accountIdentities'
import { recordUserLogin } from '../../../../lib/userDirectory'
import { clearGuestCookie, mergeGuestFromRequest } from '../../../../lib/guestSession'
import { awardRegisterOnLogin } from '../../../../lib/points'
import { cleanupRateLimits, enforceRateLimits, getClientIp, rateLimitResponse } from '../../../../lib/abuseControls'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export async function POST(req) {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) {
      return Response.json({ error: 'MISSING_AUTH_CONFIG', missing: ['NEXTAUTH_SECRET'] }, { status: 500 })
    }
    const body = await req.json().catch(() => null)
    const rawCredential = typeof body?.credential === 'string' ? body.credential.trim() : ''
    const db = getD1()
    const ip = getClientIp(req)
    const publicPart = rawCredential.split('_').slice(0, 2).join('_')
    const limit = await enforceRateLimits(db, [
      { scope: 'auth:credential:ip:5m', subject: ip, limit: 12, windowMs: FIVE_MINUTES_MS },
      { scope: 'auth:credential:ip:day', subject: ip, limit: 100, windowMs: DAY_MS },
      { scope: 'auth:credential:id:5m', subject: publicPart, limit: 8, windowMs: FIVE_MINUTES_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const result = await authenticateLoginCredential(rawCredential)
    if (!result.ok) return Response.json({ error: 'INVALID_CREDENTIAL' }, { status: 401 })

    const identity = await ensureIdentityForUser({
      provider: 'credential',
      providerAccountId: result.providerAccountId,
      userId: result.user.id,
      profile: result.profile,
    })
    if (!identity.ok) return Response.json({ error: identity.error }, { status: identity.status || 500 })

    await recordUserLogin(result.user)
    await awardRegisterOnLogin(result.user)
    const mergedGid = await mergeGuestFromRequest(req, result.user)
    await cleanupRateLimits(db).catch(() => {})

    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { user: result.user, iat: nowSeconds, exp: nowSeconds + 7 * 24 * 60 * 60 },
      sessionSecret
    )
    const { secure } = cookiesConfig()
    const headers = new Headers()
    headers.append('Set-Cookie', serializeCookie(cookieNames.session, token, { maxAge: 7 * 24 * 60 * 60, secure }))
    headers.append('Set-Cookie', serializeLastLoginMethodCookie('credential', { secure }))
    if (mergedGid) headers.append('Set-Cookie', clearGuestCookie())
    return Response.json({ ok: true, user: result.user }, { headers })
  } catch (error) {
    console.error('credential login failed', error)
    return Response.json({ error: 'LOGIN_FAILED' }, { status: 500 })
  }
}
