import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  parseCookies,
  randomState,
  serializeCookie,
} from '../../../../lib/edgeSession'

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
