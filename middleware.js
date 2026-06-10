import { NextResponse } from 'next/server'

import { ADMIN_HOST, ADMIN_LEGACY_REDIRECTS, isAdminHostPathAllowed } from './lib/adminRoutes'
import { RESEARCH_ARTICLE_REDIRECTS } from './lib/research/catalog'

const CANONICAL_HOST = '2aran.com'
const LEGACY_HOSTS = new Set(['tuaran.me', 'www.tuaran.me', 'tuaran.pages.dev'])
const LEGACY_PATHS = new Set(['/weekly', '/articles/diary-self-reflection'])

export function middleware(request) {
  const { pathname } = request.nextUrl
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase()

  const legacyAdminTarget = ADMIN_LEGACY_REDIRECTS[pathname]
  if (legacyAdminTarget) {
    const url = request.nextUrl.clone()
    url.pathname = legacyAdminTarget
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
  }

  const shouldCanonicalizeHost = LEGACY_HOSTS.has(host)
  const shouldRedirectLegacyPath = LEGACY_PATHS.has(pathname)
  const shouldRedirectPoetry = pathname === '/poetry'
  const shouldRedirectThreeKingdoms = pathname === '/history/three-kingdoms'
  const shouldRedirectLongCompass = pathname === '/about/long-compass' || pathname.startsWith('/about/long-compass/')
  const articleSlug = /^\/articles\/([^/]+)\/?$/.exec(pathname)?.[1] || ''
  const researchRedirectPath = RESEARCH_ARTICLE_REDIRECTS[articleSlug] || ''

  if (shouldCanonicalizeHost || shouldRedirectLegacyPath || shouldRedirectPoetry || shouldRedirectThreeKingdoms || shouldRedirectLongCompass || researchRedirectPath) {
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
    } else if (researchRedirectPath) {
      url.pathname = researchRedirectPath
    } else if (shouldRedirectLegacyPath) {
      url.pathname = '/diary'
    }
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp3|xml|txt)$).*)',
  ],
}
