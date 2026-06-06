import { cookieNames, cookiesConfig, serializeCookie } from '../../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function appendExpiredSessionCookies(headers, secure) {
  const options = { maxAge: 0, expires: new Date(0), secure }
  const scopedCookie = serializeCookie(cookieNames.session, '', options)
  const hostOnlyCookie = serializeCookie(cookieNames.session, '', { ...options, domain: undefined })

  headers.append('Set-Cookie', scopedCookie)
  if (hostOnlyCookie !== scopedCookie) headers.append('Set-Cookie', hostOnlyCookie)
}

export async function GET(req) {
  const url = new URL(req.url)
  const returnTo = url.searchParams.get('returnTo') || '/'
  const { secure } = cookiesConfig()

  const headers = new Headers()
  appendExpiredSessionCookies(headers, secure)
  headers.set('Location', returnTo.startsWith('/') ? returnTo : '/')
  return new Response(null, { status: 302, headers })
}
