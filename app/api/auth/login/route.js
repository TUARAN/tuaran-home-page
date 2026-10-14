import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  getUserFromRequest,
  parseCookies,
  randomState,
  serializeLastLoginMethodCookie,
  serializeCookie,
  signSession,
} from '../../../../lib/auth/edgeSession'
import { getD1 } from '../../../../lib/db/d1'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../../lib/auth/abuseControls'
import { normalizeReturnTo } from '../../../../lib/site/returnTo'
import { recordUserLogin } from '../../../../lib/auth/userDirectory'
import { clearGuestCookie, mergeGuestFromRequest } from '../../../../lib/auth/guestSession'
import { awardRegisterOnLogin } from '../../../../lib/ledger/points'
import { ensureIdentityForUser, resolveIdentityForLogin } from '../../../../lib/auth/accountIdentities'
import { getIntegrationEnv } from '../../../../lib/site/integrationKeys'
import { isSupabaseEmailAuthEnabled, signInSupabaseEmail } from '../../../../lib/supabase/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req) {
  const { githubId, googleId, wechatAppId, wechatAppSecret, wechatLoginEnabled, appUrl } = getSecrets()
  const url = new URL(req.url)
  const provider = url.searchParams.get('provider') || 'github'
  const isGoogle = provider === 'google'
  const isGithub = provider === 'github'
  const isWechat = provider === 'wechat'
  const wantsBind = url.searchParams.get('intent') === 'bind'

  if (!isGithub && !isGoogle && !isWechat) {
    return Response.json({ error: 'UNSUPPORTED_AUTH_PROVIDER' }, { status: 400 })
  }

  if (wantsBind && !(await getUserFromRequest(req))?.id) {
    return Response.json({ error: 'LOGIN_REQUIRED_FOR_BINDING' }, { status: 401 })
  }

  if (isGithub && !githubId) {
    return Response.json(
      { error: 'MISSING_GITHUB_OAUTH_CONFIG', missing: ['GITHUB_ID'] },
      { status: 500 }
    )
  }
  if (isGoogle && !googleId) {
    return Response.json(
      { error: 'MISSING_GOOGLE_OAUTH_CONFIG', missing: ['GOOGLE_ID'] },
      { status: 500 }
    )
  }
  if (isWechat && (!wechatLoginEnabled || !wechatAppId || !wechatAppSecret)) {
    return Response.json(
      { error: 'UNSUPPORTED_AUTH_PROVIDER' },
      { status: 503 }
    )
  }

  const returnTo = normalizeReturnTo(url.searchParams.get('returnTo'))
  const state = randomState()

  const origin = (appUrl || new URL(req.url).origin).replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/${provider}`
  const authUrl = isGoogle
    ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
    : isWechat
      ? new URL('https://open.weixin.qq.com/connect/qrconnect')
      : new URL('https://github.com/login/oauth/authorize')

  if (isWechat) authUrl.searchParams.set('appid', wechatAppId)
  else authUrl.searchParams.set('client_id', isGoogle ? googleId : githubId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', isGoogle ? 'openid profile email' : isWechat ? 'snsapi_login' : 'read:user user:email')
  authUrl.searchParams.set('state', state)
  if (isGoogle) {
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'online')
    authUrl.searchParams.set('prompt', 'select_account')
  }

  const { secure } = cookiesConfig()
  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.oauthState, state, { maxAge: 10 * 60, secure })
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.returnTo, returnTo, { maxAge: 10 * 60, secure, httpOnly: true })
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.oauthIntent, wantsBind ? 'bind' : 'login', {
      maxAge: 10 * 60,
      secure,
      httpOnly: true,
    })
  )
  headers.set('Location', authUrl.toString())

  return new Response(null, { status: 302, headers })
}

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

    const db = getD1()
    const ip = getClientIp(req)
    const emailSubject = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const limit = await enforceRateLimits(db, [
      { scope: 'auth:login:ip:5m', subject: ip, limit: 20, windowMs: FIVE_MINUTES_MS },
      { scope: 'auth:login:ip:day', subject: ip, limit: 200, windowMs: DAY_MS },
      { scope: 'auth:login:email:5m', subject: emailSubject, limit: 8, windowMs: FIVE_MINUTES_MS },
      { scope: 'auth:login:email:day', subject: emailSubject, limit: 80, windowMs: DAY_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const env = getIntegrationEnv()
    if (!isSupabaseEmailAuthEnabled(env)) {
      return Response.json({ error: 'SUPABASE_AUTH_UNAVAILABLE' }, { status: 503 })
    }
    let user
    const result = await signInSupabaseEmail(env, body?.email, body?.password)
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status || 401 })
    const { providerAccountId, profile } = result
    const fallbackUser = { id: `supabase:${providerAccountId}`, ...profile }
    let resolved = await resolveIdentityForLogin({ provider: 'supabase', providerAccountId, profile, fallbackUser })
    if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status || 500 })
    user = resolved.user
    if (resolved.isNewAccount) {
      const ensured = await ensureIdentityForUser({ provider: 'supabase', providerAccountId, userId: user.id, profile })
      if (!ensured.ok && ensured.error === 'IDENTITY_ALREADY_BOUND') {
        resolved = await resolveIdentityForLogin({ provider: 'supabase', providerAccountId, profile, fallbackUser })
        if (!resolved.ok || resolved.isNewAccount) return Response.json({ error: 'IDENTITY_RESOLUTION_FAILED' }, { status: 409 })
        user = resolved.user
      } else if (!ensured.ok) {
        return Response.json({ error: ensured.error }, { status: ensured.status || 500 })
      }
    }
    await recordUserLogin(user)
    await awardRegisterOnLogin(user)
    const mergedGid = await mergeGuestFromRequest(req, user)
    await cleanupRateLimits(db).catch(() => {})

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
    console.error('email login failed', error)
    return Response.json({ error: 'LOGIN_FAILED' }, { status: 500 })
  }
}
