import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  parseCookies,
  randomState,
  serializeCookie,
  signSession,
} from '../../../../lib/edgeSession'
import { authenticateEmailUser } from '../../../../lib/emailAuth'
import { recordUserLogin } from '../../../../lib/userDirectory'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { githubId, googleId, appUrl } = getSecrets()
  const url = new URL(req.url)
  const provider = url.searchParams.get('provider') || 'github'
  const isGoogle = provider === 'google'
  const isGithub = provider === 'github'

  if (!isGithub && !isGoogle) {
    return Response.json({ error: 'UNSUPPORTED_AUTH_PROVIDER' }, { status: 400 })
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

  const returnTo = url.searchParams.get('returnTo') || '/'
  const state = randomState()

  const origin = (appUrl || new URL(req.url).origin).replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/${provider}`
  const authUrl = isGoogle
    ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
    : new URL('https://github.com/login/oauth/authorize')

  authUrl.searchParams.set('client_id', isGoogle ? googleId : githubId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', isGoogle ? 'openid profile email' : 'read:user user:email')
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
  headers.set('Location', authUrl.toString())

  return new Response(null, { status: 302, headers })
}

export async function POST(req) {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) {
      return Response.json({ error: 'MISSING_AUTH_CONFIG', missing: ['NEXTAUTH_SECRET'] }, { status: 500 })
    }

    const body = await req.json()
    const result = await authenticateEmailUser(body?.email, body?.password)
    if (!result.ok) return Response.json(result, { status: result.status || 401 })

    await recordUserLogin(result.user)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { user: result.user, iat: nowSeconds, exp: nowSeconds + 7 * 24 * 60 * 60 },
      sessionSecret
    )
    const { secure } = cookiesConfig()
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      serializeCookie(cookieNames.session, token, { maxAge: 7 * 24 * 60 * 60, secure })
    )
    return Response.json({ ok: true, user: result.user }, { headers })
  } catch (error) {
    console.error('email login failed', error)
    return Response.json({ error: 'LOGIN_FAILED' }, { status: 500 })
  }
}
