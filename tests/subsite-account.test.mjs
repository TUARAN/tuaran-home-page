import assert from 'node:assert/strict'
import test from 'node:test'
import { handleSubsiteSession, handleSubsiteCheckin, subsitePreflight } from '../lib/subsiteAccount.js'
import { normalizeReturnTo } from '../lib/returnTo.js'

const origin = 'https://weekly.2aran.com'
function request(method = 'GET', source = origin, extra = {}) {
  return new Request('https://2aran.com/api/subsites/session?userId=attacker', {
    method, headers: { ...(source === null ? {} : { Origin: source }), ...extra },
  })
}

function services(overrides = {}) {
  const calls = []
  const api = {
    getSecrets: () => ({ sessionSecret: 'test-only' }),
    getD1: () => ({}),
    getUserFromRequest: async () => ({ id: 'acct_real', name: '读者', email: 'private@example.com', provider: 'github' }),
    getUserRole: async () => 'user',
    getOrIssueGuest: async () => { throw new Error('Authenticated requests must not issue guests') },
    awardGuestSeed: async (_db, id) => calls.push(id),
    getBalance: async (_db, id) => { calls.push(id); return 123 },
    hasCheckedInToday: async () => false,
    checkin: async () => Response.json({ ok: true, balance: 128 }),
    ...overrides,
  }
  return { api, calls }
}

test('approved child domains preserve login return paths; deceptive domains are rejected', () => {
  for (const host of ['weekly.2aran.com', 'syncblog.2aran.com', 'poemcn.2aran.com', 'bookmarks.2aran.com']) {
    assert.equal(normalizeReturnTo(`https://${host}/editor?q=1#draft`), `https://${host}/editor?q=1#draft`)
  }
  for (const value of ['https://weekly.2aran.com.evil.test', 'https://evil.2aran.com', '//evil.test', 'https://weekly.2aran.com@evil.test', 'https://user:pass@weekly.2aran.com/', 'http://weekly.2aran.com']) {
    assert.equal(normalizeReturnTo(value), '/')
  }
  assert.equal(normalizeReturnTo('/articles?a=1#x'), '/articles?a=1#x')
  assert.equal(normalizeReturnTo('https://admin.2aran.com/admin'), 'https://admin.2aran.com/admin')
})

test('poetry shares the canonical session through an exact credentialed origin', async () => {
  const source = 'https://poemcn.2aran.com'
  const { api } = services()
  const response = await handleSubsiteSession(request('GET', source), api)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), source)
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.equal((await response.json()).user.id, 'acct_real')
  assert.equal(subsitePreflight(request('OPTIONS', source, { 'Access-Control-Request-Method': 'GET' }), 'GET').status, 204)
  for (const bad of ['https://poemcn.2aran.com.evil.test', 'http://poemcn.2aran.com', 'https://poemcn.workers.dev']) {
    assert.equal((await handleSubsiteSession(request('GET', bad), api)).status, 403)
    assert.equal(normalizeReturnTo(`${bad}/?q=1`), '/')
  }
})

test('session exposes only verified identity and the canonical balance, without private profile fields', async () => {
  const { api, calls } = services()
  const response = await handleSubsiteSession(request(), api)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    version: 1, user: { id: 'acct_real', name: '读者' }, isGuest: false,
    balance: 123, checkedInToday: false,
  })
  assert.deepEqual(calls, ['acct_real'])
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  assert.match(response.headers.get('Vary'), /Cookie/)
  assert.match(response.headers.get('Vary'), /Origin/)
})

test('guest identity and seed come from the existing signed guest service', async () => {
  const cookie = 'tuaran_guest=signed; Domain=.2aran.com; HttpOnly; Secure; SameSite=Lax'
  const { api, calls } = services({
    getUserFromRequest: async () => null,
    getOrIssueGuest: async () => ({ gid: 'known-guest', setCookie: cookie }),
    hasCheckedInToday: async () => { throw new Error('Guest cannot check in') },
  })
  const response = await handleSubsiteSession(request(), api)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Set-Cookie'), cookie)
  assert.deepEqual(await response.json(), { version: 1, user: null, isGuest: true, balance: 123, checkedInToday: false })
  assert.deepEqual(calls, ['guest:known-guest', 'guest:known-guest'])
})

test('blocked users and unavailable dependencies never become guests or zero balances', async () => {
  for (const [overrides, status, error] of [
    [{ getUserRole: async () => 'blocked' }, 403, 'USER_BLOCKED'],
    [{ getSecrets: () => ({}) }, 503, 'ACCOUNT_UNAVAILABLE'],
    [{ getD1: () => null }, 503, 'ACCOUNT_UNAVAILABLE'],
    [{ getUserRole: async () => { throw new Error('Role lookup failed') } }, 503, 'ACCOUNT_UNAVAILABLE'],
    [{ getBalance: async () => { throw new Error('DB failed') } }, 503, 'ACCOUNT_UNAVAILABLE'],
    [{ getBalance: async () => NaN }, 503, 'ACCOUNT_UNAVAILABLE'],
    [{ getUserFromRequest: async () => null, getOrIssueGuest: async () => null }, 503, 'ACCOUNT_UNAVAILABLE'],
  ]) {
    const { api } = services(overrides)
    const response = await handleSubsiteSession(request(), api)
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error })
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  }
})

test('reject untrusted browser origins before resolving identity or changing state', async () => {
  const { api, calls } = services({ getUserFromRequest: async () => { calls.push('auth'); return null } })
  for (const source of ['null', 'https://syncblog.cn', 'https://untrusted.2aran.com', 'https://weekly.2aran.com.evil.test']) {
    for (const [handler, method] of [[handleSubsiteSession, 'GET'], [handleSubsiteCheckin, 'POST']]) {
      const response = await handler(request(method, source), api)
      assert.equal(response.status, 403)
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
    }
  }
  assert.deepEqual(calls, [])
})

test('credentialed preflight permits only the route method and content-type', () => {
  const good = request('OPTIONS', origin, { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type' })
  assert.equal(subsitePreflight(good, 'POST').status, 204)
  assert.equal(subsitePreflight(good, 'GET').status, 403)
  assert.equal(subsitePreflight(request('OPTIONS', origin, { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'X-User-Id' }), 'POST').status, 403)
  assert.equal(subsitePreflight(request('OPTIONS', null), 'GET').status, 403)
})

test('checkin requires an explicit trusted origin and delegates to the existing award/limit handler', async () => {
  let invoked = 0
  const { api } = services({ checkin: async (req) => {
    invoked += 1
    assert.equal(req.headers.get('cookie'), 'tuaran_session=existing')
    return Response.json({ error: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': '60' } })
  } })
  assert.equal((await handleSubsiteCheckin(request('POST', null), api)).status, 403)
  assert.equal((await handleSubsiteCheckin(request('GET'), api)).status, 405)
  const response = await handleSubsiteCheckin(request('POST', origin, { cookie: 'tuaran_session=existing' }), api)
  assert.equal(invoked, 1)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '60')
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), 'true')
  assert.deepEqual(await response.json(), { error: 'RATE_LIMITED' })
})

test('server session reads work without Origin; cross-site fetch metadata cannot bypass the guard', async () => {
  const { api } = services()
  assert.equal((await handleSubsiteSession(request('GET', null), api)).status, 200)
  assert.equal((await handleSubsiteSession(request('GET', null, { 'Sec-Fetch-Site': 'cross-site' }), api)).status, 403)
  assert.equal((await handleSubsiteSession(request('POST'), api)).status, 405)
})
