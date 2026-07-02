import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  parseCookies,
  serializeLastLoginMethodCookie,
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
import { clearGuestCookie, mergeGuestFromRequest } from '../../../../../lib/guestSession'
import { awardRegisterOnLogin } from '../../../../../lib/points'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { githubId, githubSecret, appUrl, sessionSecret } = getSecrets()
  const missing = []
  if (!githubId) missing.push('GITHUB_ID')
  if (!githubSecret) missing.push('GITHUB_SECRET')
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
  const redirectUri = `${origin}/api/auth/callback/github`

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: githubId,
      client_secret: githubSecret,
      code,
      redirect_uri: redirectUri,
      state,
    }),
  })

  const tokenJson = await readProviderJson(tokenRes)
  const accessToken = tokenJson?.access_token
  if (!tokenRes.ok || !accessToken) {
    logOAuthProviderFailure('github', 'token', tokenRes, tokenJson)
    return oauthProviderError('OAUTH_TOKEN_EXCHANGE_FAILED')
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'tuaran-me',
    },
  })
  const ghUser = await readProviderJson(userRes)
  if (!userRes.ok || !ghUser?.id) {
    logOAuthProviderFailure('github', 'userinfo', userRes, ghUser)
    return oauthProviderError('GITHUB_USER_FETCH_FAILED')
  }

  const user = {
    id: `github:${String(ghUser.id)}`,
    provider: 'github',
    login: String(ghUser.login || ''),
    name: String(ghUser.name || ghUser.login || 'GitHub User'),
    image: ghUser.avatar_url ? String(ghUser.avatar_url) : null,
  }

  await recordUserLogin(user)
  await awardRegisterOnLogin(user)
  const mergedGid = await mergeGuestFromRequest(req, user)

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
  headers.append('Set-Cookie', serializeLastLoginMethodCookie('github', { secure }))
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.oauthState, '', { maxAge: 0, secure })
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.returnTo, '', { maxAge: 0, secure })
  )
  if (mergedGid) headers.append('Set-Cookie', clearGuestCookie())

  headers.set('Location', returnTo)
  return new Response(null, { status: 302, headers })
}
