import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveActor } from '../src/auth.js'
import { mainSessionRoute } from './main-session-helper.mjs'
import { listResources } from '../src/database.js'
import { isTrustedMutation, parseByteRange, safeSegment } from '../src/index.js'

test('Worker forwards only session cookies to the fixed main endpoint, never trusting client identity', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://2aran.com/api/workbuddy/session')
    assert.equal(options.headers.cookie, 'tuaran_session=opaque; tuaran_guest=opaque2')
    assert.equal(options.headers.authorization, undefined)
    assert.equal(options.redirect, 'error')
    assert.equal(options.cache, 'no-store')
    return Response.json({ version: 1, userId: 'acct_verified', isGuest: false, name: 'Verified' })
  })
  const actor = await resolveActor(new Request('https://workbuddy.2aran.com/api/me?userId=admin', {
    headers: { cookie: 'analytics=private; tuaran_session=opaque; tuaran_guest=opaque2', authorization: 'secret', 'x-user-id': 'admin' },
  }), { MAIN_SITE_URL: 'https://evil.example' })
  assert.equal(actor.userId, 'acct_verified')
})

test('invalid, unavailable, redirected or malformed upstream responses fail closed', async (t) => {
  for (const response of [
    new Response(null, { status: 302, headers: { location: 'https://evil.example' } }),
    new Response('offline', { status: 503 }), new Response('<html>login</html>'),
    Response.json({ userId: 'admin' }), Response.json({ version: 1, userId: 'acct_demo', isGuest: true, name: 'x' }),
    new Response('{', { headers: { 'content-type': 'application/json' } }),
  ]) {
    t.mock.method(globalThis, 'fetch', async () => response)
    assert.equal((await resolveActor(new Request('https://workbuddy.2aran.com/api/me'))).status, 503)
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('timeout') })
  assert.equal((await resolveActor(new Request('https://workbuddy.2aran.com/api/me'))).status, 503)
})

test('only main-issued guest cookies are returned with safe production or localhost scope', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(
    { version: 1, userId: 'guest:main-verified', isGuest: true, name: '游客' },
    { headers: { 'set-cookie': 'site-lang=zh; Expires=Fri, 27 Aug 2027 09:58:20 GMT; Path=/, tuaran_guest=signed.token.value; Path=/; HttpOnly' } },
  ))
  const prod = await resolveActor(new Request('https://workbuddy.2aran.com/api/me'))
  assert.match(prod.setCookie, /HttpOnly; SameSite=Lax; Secure; Domain=.2aran.com$/)
  const local = await resolveActor(new Request('http://localhost:8788/api/me'))
  assert.doesNotMatch(local.setCookie, /Domain|Secure/)
  t.mock.method(globalThis, 'fetch', async () => Response.json(
    { version: 1, userId: 'guest:main-verified', isGuest: true, name: '游客' },
    { headers: { 'set-cookie': 'tuaran_session=unexpected; Path=/' } },
  ))
  assert.equal((await resolveActor(new Request('https://workbuddy.2aran.com/api/me'))).setCookie, null)
})

test('main route uses canonical verifier, does not cache or expose secrets, and fails closed without services', async () => {
  let hasSecret = true
  let dbAvailable = true
  const GET = mainSessionRoute({
    getSecrets: () => ({ sessionSecret: hasSecret ? 'never-return-this' : null }),
    getD1: () => dbAvailable ? { prepare: () => ({ bind: () => ({ first: async () => ({ role: 'member' }) }) }) } : null,
    getUserFromRequest: async () => ({ id: 'acct_canonical', name: 'User', email: 'private@example.com' }),
    getOrIssueGuest: async () => { throw new Error('must not issue guest for signed-in user') },
  })
  const req = new Request('https://2aran.com/api/workbuddy/session?userId=admin')
  const response = await GET(req)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.deepEqual(await response.json(), { version: 1, userId: 'acct_canonical', isGuest: false, name: 'User' })
  hasSecret = false
  assert.equal((await GET(req)).status, 503)
  hasSecret = true
  dbAvailable = false
  assert.equal((await GET(req)).status, 503)
})

test('API path segments allow expected slugs only', () => {
  assert.equal(safeSegment('workbuddy-guide-v1.2'), 'workbuddy-guide-v1.2')
  assert.equal(safeSegment('../secret'), '')
  assert.equal(safeSegment('a/b'), '')
  assert.equal(safeSegment(''), '')
})

test('mutating requests require same-origin browser requests', () => {
  assert.equal(
    isTrustedMutation(new Request('https://workbuddy.2aran.com/api/resources/a/unlock', { headers: { origin: 'https://workbuddy.2aran.com' } })),
    true,
  )
  assert.equal(
    isTrustedMutation(new Request('https://workbuddy.2aran.com/api/resources/a/unlock', { headers: { origin: 'https://evil.example' } })),
    false,
  )
})

test('catalog has a useful fallback before the D1 migration is applied', async () => {
  const db = { prepare() { throw new Error('no such table') } }
  const result = await listResources(db)
  assert.equal(result.fallback, true)
  assert.equal(result.resources.length, 6)
  assert.ok(result.resources.every((item) => item.resourceKey.startsWith('workbuddy:')))
  assert.ok(result.resources.every((item) => item.fileCount === 0))
})

test('published fallback resources keep stable prices and slugs', async () => {
  const db = { prepare() { throw new Error('no such table') } }
  const { resources } = await listResources(db, new URLSearchParams('category=视频教程'))
  assert.equal(resources.length, 1)
  assert.equal(resources[0].slug, 'workbuddy-workplace-video-course')
  assert.equal(resources[0].costPoints, 10)
})

test('range parsing handles PDF byte and suffix ranges and rejects invalid requests', () => {
  assert.deepEqual(parseByteRange('bytes=0-9', 100), { offset: 0, length: 10 })
  assert.deepEqual(parseByteRange('bytes=90-', 100), { offset: 90, length: 10 })
  assert.deepEqual(parseByteRange('bytes=-10', 100), { offset: 90, length: 10 })
  for (const range of ['bytes=-0', 'bytes=100-', 'bytes=8-2', 'bytes=0-1,8-9', 'bytes=-']) {
    assert.equal(parseByteRange(range, 100), false)
  }
})
