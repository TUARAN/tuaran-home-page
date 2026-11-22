import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const bridge = require('../../tools/x-reply-clipboard-extension/workbenchBridge.js')

const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body })

test('mergeProfile：较新者胜，相同视为一致', () => {
  assert.equal(bridge.mergeProfile({ updatedAt: 2 }, { updatedAt: 1 }).winner, 'local')
  assert.equal(bridge.mergeProfile({ updatedAt: 1 }, { updatedAt: 2 }).winner, 'remote')
  assert.equal(bridge.mergeProfile({ updatedAt: 3 }, { updatedAt: 3 }).winner, 'same')
  assert.equal(bridge.mergeProfile(null, { updatedAt: 1 }).winner, 'remote')
})

test('syncProfile：云端较新则拉取，不发写请求', async () => {
  const calls = []
  const f = async (url, init) => {
    calls.push(init.method)
    return { ok: true, status: 200, json: async () => ({ persona: { role: '云端' }, memory: [], updatedAt: 9 }) }
  }
  const res = await bridge.syncProfile(f, '@Foo', { persona: { role: '本地' }, updatedAt: 1 })
  assert.equal(res.direction, 'pull')
  assert.equal(res.profile.persona.role, '云端')
  assert.deepEqual(calls, ['GET'])
})

test('syncProfile：本地较新则推送；被原则校验拒绝时把原因带回', async () => {
  const seen = []
  const ok = async (url, init) => {
    seen.push([init.method, url])
    return { ok: true, status: 200, json: async () => ({ persona: {}, memory: [], updatedAt: 1 }) }
  }
  const pushed = await bridge.syncProfile(ok, 'foo', { persona: { role: '新' }, memory: [], updatedAt: 5 })
  assert.equal(pushed.direction, 'push')
  assert.deepEqual(seen.map((s) => s[0]), ['GET', 'PUT'])
  assert.ok(seen[0][1].startsWith('https://x.2aran.com/api/x-workbench/profile?handle=foo'))

  let n = 0
  const rejected = async () => (n++ === 0
    ? { ok: true, status: 200, json: async () => ({ updatedAt: 1 }) }
    : { ok: false, status: 422, json: async () => ({ error: 'PRINCIPLE_CONFLICT', reason: '要求调高或取消上限' }) })
  const res = await bridge.syncProfile(rejected, 'foo', { persona: { role: '调高上限' }, updatedAt: 5 })
  assert.equal(res.error, 'PRINCIPLE_CONFLICT')
  assert.equal(res.reason, '要求调高或取消上限')
})

test('网络失败与未登录不抛异常', async () => {
  assert.equal((await bridge.syncProfile(async () => { throw new Error('x') }, 'foo', {})).error, 'NETWORK')
  assert.equal((await bridge.claimNext(reply(401, { error: 'UNAUTHENTICATED' }), 'foo')).status, 401)
  assert.equal((await bridge.syncProfile(reply(200, {}), 'bad name', {})).error, 'INVALID_HANDLE')
})

test('claimNext / reportResult 请求形状', async () => {
  const bodies = []
  const f = async (url, init) => {
    bodies.push(JSON.parse(init.body))
    return { ok: true, status: 200, json: async () => ({ schedule: { id: 's1', text: 'hi' } }) }
  }
  assert.equal((await bridge.claimNext(f, '@Foo')).schedule.id, 's1')
  await bridge.reportResult(f, 's1', { ok: true, result: 'posted' })
  assert.deepEqual(bodies[0], { action: 'claim', handle: 'foo' })
  assert.deepEqual(bodies[1], { action: 'report', id: 's1', ok: true, result: 'posted' })
})

test('ingestPosts：只提交合法条目并限制字段', async () => {
  let body
  const f = async (url, init) => {
    body = JSON.parse(init.body)
    assert.ok(url.endsWith('/radar'))
    return { ok: true, status: 200, json: async () => ({ accepted: body.items.length }) }
  }
  const res = await bridge.ingestPosts(f, [
    { id: '1234567890', handle: '@Foo', text: 'hi', likes: '5', media: 'gif' },
    { id: 'bad', handle: 'foo' },
    { id: '1234567891', handle: 'default' }
  ])
  assert.equal(res.accepted, 1)
  assert.equal(body.items[0].media, 'none')
  assert.equal(body.items[0].likes, 5)
  assert.equal((await bridge.ingestPosts(f, [])).accepted, 0)
})

test('插件凭证入口不携带 Cookie，令牌只放 Authorization', async () => {
  let received
  const result = await bridge.pluginRequest(async (url, init) => {
    received = { url, ...init }
    return { ok: true, status: 200, json: async () => ({ ok: true, accepted: 2 }) }
  }, 'ingest', { items: [] }, 'secret-token')
  assert.equal(result.accepted, 2)
  assert.equal(received.credentials, 'omit')
  assert.equal(received.headers.Authorization, 'Bearer secret-token')
  assert.equal(received.url, `${bridge.BASE}/bridge`)
  assert.equal(JSON.parse(received.body).action, 'ingest')
})

test('配对人格同步只走 Bearer 桥并使用服务端更新时间', async () => {
  const calls = []
  const result = await bridge.syncPluginProfile(async (url, init) => {
    calls.push(JSON.parse(init.body))
    assert.equal(init.credentials, 'omit')
    assert.equal(init.headers.Authorization, 'Bearer token')
    return { ok: true, status: 200, json: async () => calls.length === 1 ? { ok: true, updatedAt: 1 } : { ok: true, updatedAt: 10 } }
  }, 'token', '@Foo', { updatedAt: 4, persona: { role: '作者' }, memory: [] })
  assert.deepEqual(calls.map(c => c.action), ['profile.get', 'profile.put'])
  assert.equal(calls[0].handle, 'foo')
  assert.equal(result.profile.updatedAt, 10)
})

test('配对同步遇到撤销令牌不会继续写入', async () => {
  let calls = 0
  const result = await bridge.syncPluginProfile(async () => {
    calls++
    return { ok: false, status: 401, json: async () => ({ error: 'UNAUTHENTICATED' }) }
  }, 'expired', 'foo', { updatedAt: 3 })
  assert.equal(result.status, 401)
  assert.equal(calls, 1)
})
