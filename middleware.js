import { NextResponse } from 'next/server'

import { ADMIN_HOST, ADMIN_LEGACY_REDIRECTS, isAdminHostPathAllowed } from './lib/adminRoutes'
import { getUserFromRequest } from './lib/edgeSession'
import { LOCALE_COOKIE, localeFromAcceptLanguage, localeFromCountry } from './lib/i18n'
import { getLegacyPathRedirect, shouldNoindexPath } from './lib/indexingPolicy'
import { isAdminLocalPreviewEnabled } from './lib/adminLocalPreview'
import { isOwnerUser } from './lib/ownerAuth'

/**
 * 首次访问按 IP 国家码（Cloudflare 的 cf-ipcountry）决定默认语言：
 * 中国大陆 → 中文，海外 → 英文；无国家码时退回 Accept-Language。
 * 仅在 cookie 不存在时写入，之后以用户在站内的手动选择为准。
 */
function applyDefaultLocaleCookie(request, response) {
  if (request.cookies.get(LOCALE_COOKIE)) return
  const country = request.headers.get('cf-ipcountry') || ''
  const locale = country
    ? localeFromCountry(country)
    : localeFromAcceptLanguage(request.headers.get('accept-language'))
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

const CANONICAL_HOST = '2aran.com'
const RANK_HOST = 'rank.2aran.com'
const OPS_LEGACY_HOST = 'ops.2aran.com'
const LEGACY_HOSTS = new Set(['tuaran.me', 'www.tuaran.me', 'tuaran.pages.dev'])
const ADS_TXT = 'google.com, pub-7037125126940820, DIRECT, f08c47fec0942fa0\n'

function adminLoginUrl(request) {
  const returnTo = `https://${ADMIN_HOST}${request.nextUrl.pathname}${request.nextUrl.search}`
  const url = new URL('/login', `https://${CANONICAL_HOST}`)
  url.searchParams.set('returnTo', returnTo)
  return url
}

function isAdminPageRequest(pathname) {
  return pathname === '/admin'
    || pathname === '/admin.rsc'
    || pathname.startsWith('/admin/')
}

async function requireAdminPageOwner(request) {
  if (isAdminLocalPreviewEnabled()) return null
  const user = await getUserFromRequest(request)
  if (isOwnerUser(user)) return null
  return NextResponse.redirect(adminLoginUrl(request), 307)
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase()

  if (host === RANK_HOST && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/rank'
    return NextResponse.rewrite(url)
  }

  if (pathname === '/ads.txt') {
    return new Response(ADS_TXT, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const legacyAdminTarget = ADMIN_LEGACY_REDIRECTS[pathname]
  if (legacyAdminTarget) {
    const url = request.nextUrl.clone()
    const [targetPathname, targetSearch = ''] = legacyAdminTarget.split('?')
    url.pathname = targetPathname
    url.search = targetSearch ? `?${targetSearch}` : ''
    return NextResponse.redirect(url, 301)
  }

  if (host === ADMIN_HOST) {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    if (!isAdminHostPathAllowed(pathname)) {
      const url = new URL(pathname + request.nextUrl.search, `https://${CANONICAL_HOST}`)
      return NextResponse.redirect(url)
    }
    if (isAdminPageRequest(pathname)) {
      const rejection = await requireAdminPageOwner(request)
      if (rejection) return rejection
    }
  }

  // Cloudflare preview deployments use a *.pages.dev host. Keep the same
  // owner boundary there; only explicit local preview mode may bypass it.
  if (host !== CANONICAL_HOST && host !== ADMIN_HOST && isAdminPageRequest(pathname)) {
    const rejection = await requireAdminPageOwner(request)
    if (rejection) return rejection
  }

  if (host === OPS_LEGACY_HOST) {
    const url = new URL('/admin/ops', `https://${CANONICAL_HOST}`)
    return NextResponse.redirect(url, 301)
  }

  if (host === CANONICAL_HOST && isAdminPageRequest(pathname)) {
    const url = new URL(pathname + request.nextUrl.search, `https://${ADMIN_HOST}`)
    return NextResponse.redirect(url, 302)
  }

  const shouldCanonicalizeHost = LEGACY_HOSTS.has(host)
  const legacyPathRedirect = getLegacyPathRedirect(pathname)
  const shouldRedirectPoetry = pathname === '/poetry'
  const shouldRedirectThreeKingdoms = pathname === '/history/three-kingdoms'
  const shouldRedirectLongCompass = pathname === '/about/long-compass' || pathname.startsWith('/about/long-compass/')
  const shouldRedirectXMutualAidCircle = pathname === '/resources/x-mutual-aid-circle'

  if (shouldCanonicalizeHost || legacyPathRedirect || shouldRedirectPoetry || shouldRedirectThreeKingdoms || shouldRedirectLongCompass || shouldRedirectXMutualAidCircle) {
    const url = request.nextUrl.clone()
    if (shouldCanonicalizeHost) {
      url.protocol = 'https'
      url.host = CANONICAL_HOST
    }
    if (shouldRedirectPoetry) {
      url.pathname = '/classical-masterpieces'
    } else if (shouldRedirectThreeKingdoms) {
      url.pathname = '/history/ming-qing'
      url.hash = '#sanguo'
    } else if (shouldRedirectLongCompass) {
      url.pathname = pathname.replace(/^\/about\/long-compass/, '/long-compass')
    } else if (shouldRedirectXMutualAidCircle) {
      url.pathname = '/x-mutual-aid-circle'
    } else if (legacyPathRedirect) {
      url.pathname = legacyPathRedirect.pathname
      url.hash = legacyPathRedirect.hash || ''
    }
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()
  if (shouldNoindexPath(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  applyDefaultLocaleCookie(request, response)
  return response
}

export const config = {
  matcher: [
    '/ads.txt',
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|sw.js|robots.txt|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp3|mp4|webm|m4v|xml|txt)$).*)',
  ],
}
