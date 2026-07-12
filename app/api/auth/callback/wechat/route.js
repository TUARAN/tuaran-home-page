import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  getUserFromRequest,
  parseCookies,
  serializeLastLoginMethodCookie,
  serializeCookie,
  signSession,
} from '../../../../../lib/edgeSession'
import { readProviderJson, logOAuthProviderFailure, oauthProviderError } from '../../../../../lib/oauthProviderErrors'
import { normalizeReturnTo } from '../../../../../lib/returnTo'
import { recordUserLogin } from '../../../../../lib/userDirectory'
import { clearGuestCookie, mergeGuestFromRequest } from '../../../../../lib/guestSession'
import { awardRegisterOnLogin } from '../../../../../lib/points'
import { bindIdentityToUser, ensureIdentityForUser, resolveIdentityForLogin } from '../../../../../lib/accountIdentities'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function accountLocation(req, result) {
  const origin = new URL(req.url).origin
  const url = new URL('/account', origin)
  url.searchParams.set('wechat', result)
  return url.toString()
}

function clearOAuthCookies(headers, secure) {
  headers.append('Set-Cookie', serializeCookie(cookieNames.oauthState, '', { maxAge: 0, secure }))
  headers.append('Set-Cookie', serializeCookie(cookieNames.oauthIntent, '', { maxAge: 0, secure }))
  headers.append('Set-Cookie', serializeCookie(cookieNames.returnTo, '', { maxAge: 0, secure }))
}

export async function GET(req) {
  const { wechatAppId, wechatAppSecret, wechatLoginEnabled, appUrl, sessionSecret } = getSecrets()
  if (!wechatLoginEnabled) {
    return Response.json({ error: 'WECHAT_LOGIN_PENDING_REVIEW', message: '微信登录正在审核，暂未开放。' }, { status: 503 })
  }
  const missing = []
  if (!wechatAppId) missing.push('WECHAT_APP_ID')
  if (!wechatAppSecret) missing.push('WECHAT_APP_SECRET')
  if (!sessionSecret) missing.push('NEXTAUTH_SECRET')
  if (missing.length) return Response.json({ error: 'MISSING_AUTH_CONFIG', missing }, { status: 500 })

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return Response.json({ error: 'MISSING_CODE_OR_STATE' }, { status: 400 })

  const cookies = parseCookies(req)
  if (!cookies[cookieNames.oauthState] || cookies[cookieNames.oauthState] !== state) {
    return Response.json({ error: 'INVALID_STATE' }, { status: 400 })
  }
  const intent = cookies[cookieNames.oauthIntent] === 'bind' ? 'bind' : 'login'
  const returnTo = normalizeReturnTo(cookies[cookieNames.returnTo])
  const origin = (appUrl || new URL(req.url).origin).replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/wechat`

  const tokenUrl = new URL('https://api.weixin.qq.com/sns/oauth2/access_token')
  tokenUrl.search = new URLSearchParams({
    appid: wechatAppId,
    secret: wechatAppSecret,
    code,
    grant_type: 'authorization_code',
  }).toString()
  const tokenRes = await fetch(tokenUrl)
  const tokenJson = await readProviderJson(tokenRes)
  const accessToken = tokenJson?.access_token
  const openid = String(tokenJson?.openid || '')
  if (!tokenRes.ok || !accessToken || !openid || tokenJson?.errcode) {
    logOAuthProviderFailure('wechat', 'token', tokenRes, tokenJson)
    return oauthProviderError('OAUTH_TOKEN_EXCHANGE_FAILED')
  }

  const profileUrl = new URL('https://api.weixin.qq.com/sns/userinfo')
  profileUrl.search = new URLSearchParams({ access_token: accessToken, openid, lang: 'zh_CN' }).toString()
  const profileRes = await fetch(profileUrl)
  const wechatUser = await readProviderJson(profileRes)
  if (!profileRes.ok || wechatUser?.errcode) {
    logOAuthProviderFailure('wechat', 'userinfo', profileRes, wechatUser)
    return oauthProviderError('WECHAT_USER_FETCH_FAILED')
  }

  const profile = {
    provider: 'wechat',
    login: openid,
    name: String(wechatUser?.nickname || '微信用户'),
    image: wechatUser?.headimgurl ? String(wechatUser.headimgurl) : null,
  }
  // openid 在当前微信开放平台应用内稳定；不以昵称、手机号或邮箱作身份键。
  const providerAccountId = openid
  const { secure } = cookiesConfig()

  if (intent === 'bind') {
    const currentUser = await getUserFromRequest(req)
    if (!currentUser?.id) {
      const headers = new Headers({ Location: accountLocation(req, 'login_required') })
      clearOAuthCookies(headers, secure)
      return new Response(null, { status: 302, headers })
    }
    const binding = await bindIdentityToUser({
      provider: 'wechat', providerAccountId, userId: currentUser.id, profile,
    })
    const headers = new Headers({ Location: accountLocation(req, binding.ok ? (binding.alreadyBound ? 'already_bound' : 'bound') : 'belongs_to_other_account') })
    clearOAuthCookies(headers, secure)
    return new Response(null, { status: 302, headers })
  }

  const fallbackUser = { id: `wechat:${openid}`, ...profile, email: '' }
  let resolved = await resolveIdentityForLogin({
    provider: 'wechat', providerAccountId, profile, fallbackUser,
  })
  if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status || 500 })

  let user = resolved.user
  if (resolved.isNewAccount) {
    const ensured = await ensureIdentityForUser({ provider: 'wechat', providerAccountId, userId: user.id, profile })
    if (!ensured.ok && ensured.error === 'IDENTITY_ALREADY_BOUND') {
      // 同一微信在两个并发回调中首次登录时，后到的请求改用已经建立的账号。
      resolved = await resolveIdentityForLogin({ provider: 'wechat', providerAccountId, profile, fallbackUser })
      if (!resolved.ok || resolved.isNewAccount) return Response.json({ error: 'IDENTITY_RESOLUTION_FAILED' }, { status: 409 })
      user = resolved.user
    } else if (!ensured.ok) {
      return Response.json({ error: ensured.error }, { status: ensured.status || 500 })
    }
  }

  await recordUserLogin(user)
  await awardRegisterOnLogin(user)
  const mergedGid = await mergeGuestFromRequest(req, user)
  const now = Math.floor(Date.now() / 1000)
  const jwt = await signSession({ user, iat: now, exp: now + 7 * 24 * 60 * 60 }, sessionSecret)
  const headers = new Headers({ Location: returnTo })
  headers.append('Set-Cookie', serializeCookie(cookieNames.session, jwt, { maxAge: 7 * 24 * 60 * 60, secure }))
  headers.append('Set-Cookie', serializeLastLoginMethodCookie('wechat', { secure }))
  clearOAuthCookies(headers, secure)
  if (mergedGid) headers.append('Set-Cookie', clearGuestCookie())
  return new Response(null, { status: 302, headers })
}
