import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  getUserFromRequest,
  parseCookies,
  serializeLastLoginMethodCookie,
  serializeCookie,
  signSession,
} from '../../../../../lib/auth/edgeSession'
import {
  logOAuthProviderFailure,
  oauthProviderError,
  readProviderJson,
} from '../../../../../lib/auth/oauthProviderErrors'
import { normalizeReturnTo } from '../../../../../lib/site/returnTo'
import { recordUserLogin } from '../../../../../lib/auth/userDirectory'
import { clearGuestCookie, mergeGuestFromRequest } from '../../../../../lib/auth/guestSession'
import { awardRegisterOnLogin } from '../../../../../lib/ledger/points'
import { bindIdentityToUser, ensureIdentityForUser, resolveIdentityForLogin } from '../../../../../lib/auth/accountIdentities'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function accountLocation(req, result) {
  const url = new URL('/account', new URL(req.url).origin)
  url.searchParams.set('x', result)
  return url.toString()
}

function clearOAuthCookies(headers, secure) {
  headers.append('Set-Cookie', serializeCookie(cookieNames.oauthState, '', { maxAge: 0, secure }))
  headers.append('Set-Cookie', serializeCookie(cookieNames.oauthIntent, '', { maxAge: 0, secure }))
  headers.append('Set-Cookie', serializeCookie(cookieNames.returnTo, '', { maxAge: 0, secure }))
  headers.append('Set-Cookie', serializeCookie(cookieNames.oauthVerifier, '', { maxAge: 0, secure }))
}

export async function GET(req) {
  const { xClientId, xClientSecret, appUrl, sessionSecret } = getSecrets()
  const missing = []
  if (!xClientId) missing.push('X_CLIENT_ID')
  if (!xClientSecret) missing.push('X_CLIENT_SECRET')
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
  const intent = cookies[cookieNames.oauthIntent] === 'bind' ? 'bind' : 'login'
  const returnTo = normalizeReturnTo(cookies[cookieNames.returnTo])

  if (!expectedState || expectedState !== state) {
    return Response.json({ error: 'INVALID_STATE' }, { status: 400 })
  }

  const origin = (appUrl || new URL(req.url).origin).replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/x`

  const verifier = cookies[cookieNames.oauthVerifier]
  if (!verifier) return Response.json({ error: 'MISSING_PKCE_VERIFIER' }, { status: 400 })

  const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${xClientId}:${xClientSecret}`)}`,
    },
    body: new URLSearchParams({
      client_id: xClientId,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  })

  const tokenJson = await readProviderJson(tokenRes)
  const accessToken = tokenJson?.access_token
  if (!tokenRes.ok || !accessToken) {
    logOAuthProviderFailure('x', 'token', tokenRes, tokenJson)
    return oauthProviderError('OAUTH_TOKEN_EXCHANGE_FAILED')
  }

  const userRes = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,username,name', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const xUserBody = await readProviderJson(userRes)
  const xUser = xUserBody?.data
  if (!userRes.ok || !xUser?.id) {
    logOAuthProviderFailure('x', 'userinfo', userRes, xUserBody)
    return oauthProviderError('X_USER_FETCH_FAILED')
  }

  const profile = {
    provider: 'x',
    login: String(xUser.username || ''),
    name: String(xUser.name || xUser.username || 'X User'),
    image: xUser.profile_image_url ? String(xUser.profile_image_url) : null,
    email: '',
  }
  const providerAccountId = String(xUser.id)
  const { secure } = cookiesConfig()

  if (intent === 'bind') {
    const currentUser = await getUserFromRequest(req)
    const binding = currentUser?.id
      ? await bindIdentityToUser({ provider: 'x', providerAccountId, userId: currentUser.id, profile })
      : { error: 'LOGIN_REQUIRED' }
    const result = !currentUser?.id ? 'login_required' : binding.ok ? (binding.alreadyBound ? 'already_bound' : 'bound') : 'belongs_to_other_account'
    const headers = new Headers({ Location: accountLocation(req, result) })
    clearOAuthCookies(headers, secure)
    return new Response(null, { status: 302, headers })
  }

  const fallbackUser = { id: `google:${providerAccountId}`, ...profile }
  let resolved = await resolveIdentityForLogin({ provider: 'x', providerAccountId, profile, fallbackUser })
  if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status || 500 })
  let user = resolved.user
  if (resolved.isNewAccount) {
    const ensured = await ensureIdentityForUser({ provider: 'x', providerAccountId, userId: user.id, profile })
    if (!ensured.ok && ensured.error === 'IDENTITY_ALREADY_BOUND') {
      resolved = await resolveIdentityForLogin({ provider: 'x', providerAccountId, profile, fallbackUser })
      if (!resolved.ok || resolved.isNewAccount) return Response.json({ error: 'IDENTITY_RESOLUTION_FAILED' }, { status: 409 })
      user = resolved.user
    } else if (!ensured.ok) {
      return Response.json({ error: ensured.error }, { status: ensured.status || 500 })
    }
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
  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.session, jwt, { maxAge: 7 * 24 * 60 * 60, secure })
  )
  headers.append('Set-Cookie', serializeLastLoginMethodCookie('x', { secure }))
  clearOAuthCookies(headers, secure)
  if (mergedGid) headers.append('Set-Cookie', clearGuestCookie())

  headers.set('Location', returnTo)
  return new Response(null, { status: 302, headers })
}
