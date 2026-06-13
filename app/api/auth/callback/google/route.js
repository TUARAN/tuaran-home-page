import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  parseCookies,
  serializeCookie,
  signSession,
} from '../../../../../lib/edgeSession'
import {
  logOAuthProviderFailure,
  oauthProviderError,
  readProviderJson,
} from '../../../../../lib/oauthProviderErrors'
import { normalizeReturnTo } from '../../../../../lib/returnTo'
import { recordUserLogin } from '../../../../../lib/userDirectory'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { googleId, googleSecret, appUrl, sessionSecret } = getSecrets()
  const missing = []
  if (!googleId) missing.push('GOOGLE_ID')
  if (!googleSecret) missing.push('GOOGLE_SECRET')
  if (!sessionSecret) missing.push('NEXTAUTH_SECRET')
  if (missing.length) {
    return Response.json({ error: 'MISSING_AUTH_CONFIG', missing }, { status: 500 })
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return Response.json({ error: 'MISSING_CODE_OR_STATE' }, { status: 400 })
  }

  const cookies = parseCookies(req)
  const expectedState = cookies[cookieNames.oauthState]
  const returnTo = normalizeReturnTo(cookies[cookieNames.returnTo])

  if (!expectedState || expectedState !== state) {
    return Response.json({ error: 'INVALID_STATE' }, { status: 400 })
  }

  const origin = (appUrl || new URL(req.url).origin).replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/google`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: googleId,
      client_secret: googleSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  const tokenJson = await readProviderJson(tokenRes)
  const accessToken = tokenJson?.access_token
  if (!tokenRes.ok || !accessToken) {
    logOAuthProviderFailure('google', 'token', tokenRes, tokenJson)
    return oauthProviderError('OAUTH_TOKEN_EXCHANGE_FAILED')
  }

  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const googleUser = await readProviderJson(userRes)
  if (!userRes.ok || !googleUser?.sub) {
    logOAuthProviderFailure('google', 'userinfo', userRes, googleUser)
    return oauthProviderError('GOOGLE_USER_FETCH_FAILED')
  }

  const user = {
    id: `google:${String(googleUser.sub)}`,
    provider: 'google',
    login: String(googleUser.email || ''),
    name: String(googleUser.name || googleUser.email || 'Google User'),
    image: googleUser.picture ? String(googleUser.picture) : null,
    email: String(googleUser.email || ''),
  }

  await recordUserLogin(user)

  const payload = {
    user,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  }

  const jwt = await signSession(payload, sessionSecret)
  const { secure } = cookiesConfig()

  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.session, jwt, { maxAge: 7 * 24 * 60 * 60, secure })
  )
  headers.append('Set-Cookie', serializeCookie(cookieNames.oauthState, '', { maxAge: 0, secure }))
  headers.append('Set-Cookie', serializeCookie(cookieNames.returnTo, '', { maxAge: 0, secure }))

  headers.set('Location', returnTo)
  return new Response(null, { status: 302, headers })
}
