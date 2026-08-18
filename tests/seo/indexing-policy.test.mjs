import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  getLegacyPathRedirect,
  shouldNoindexPath,
} from '../../lib/indexingPolicy.js'

const root = new URL('../../', import.meta.url)

test('private, authentication, API, and raw PDF routes are excluded from indexing', () => {
  for (const pathname of [
    '/login',
    '/login?returnTo=%2Farticles',
    '/register',
    '/account',
    '/admin/seo',
    '/api/auth/login',
    '/share/private-note',
    '/resources/report/transcript.pdf',
  ]) {
    assert.equal(shouldNoindexPath(pathname), true, pathname)
  }

  for (const pathname of [
    '/',
    '/articles',
    '/articles/research/topics/example',
    '/resources/report',
    '/resources/report/cover.png',
    '/sitemap.xml',
  ]) {
    assert.equal(shouldNoindexPath(pathname), false, pathname)
  }
})

test('legacy reader routes resolve through real HTTP redirects', () => {
  assert.deepEqual(getLegacyPathRedirect('/weekly'), { pathname: '/diary' })
  assert.deepEqual(getLegacyPathRedirect('/articles/diary-self-reflection'), { pathname: '/diary' })
  assert.deepEqual(getLegacyPathRedirect('/messages'), { pathname: '/community', hash: '#message' })
  assert.equal(getLegacyPathRedirect('/community'), null)
})

test('authentication variants have explicit canonical and noindex metadata', async () => {
  const [login, register, account] = await Promise.all([
    readFile(new URL('app/(site)/login/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/register/page.jsx', root), 'utf8'),
    readFile(new URL('app/(site)/account/page.jsx', root), 'utf8'),
  ])

  assert.match(login, /canonical: '\/login'/)
  assert.match(login, /robots:[\s\S]*index: false[\s\S]*follow: false/)
  assert.match(register, /canonical: '\/register'/)
  assert.match(register, /robots:[\s\S]*index: false[\s\S]*follow: false/)
  assert.match(account, /canonical: '\/account'/)
  assert.match(account, /robots:[\s\S]*index: false[\s\S]*follow: false/)
})

test('crawler discovery and sitemap rules do not recreate parameter duplicates or soft redirects', async () => {
  const [header, middleware, sitemap] = await Promise.all([
    readFile(new URL('app/(site)/components/SiteHeader.jsx', root), 'utf8'),
    readFile(new URL('middleware.js', root), 'utf8'),
    readFile(new URL('app/(site)/sitemap.js', root), 'utf8'),
  ])

  assert.match(header, /href=\{loginHref\}[\s\S]{0,80}rel="nofollow"/)
  assert.match(middleware, /shouldNoindexPath\(pathname\)/)
  assert.match(middleware, /X-Robots-Tag', 'noindex, nofollow'/)
  assert.match(middleware, /getLegacyPathRedirect\(pathname\)/)
  assert.doesNotMatch(sitemap, /['"]\/messages['"]/)
})
