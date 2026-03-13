import { NextResponse } from 'next/server'

const LEGACY_PATHS = new Set(['/weekly', '/articles/diary-self-reflection'])

export function middleware(request) {
  const { pathname } = request.nextUrl

  if (LEGACY_PATHS.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/diary'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/weekly', '/articles/diary-self-reflection'],
}
