import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
const source = readFileSync(new URL('../../lib/x/workbench/routes/bridge.js', import.meta.url), 'utf8').replace(/^import .*\n/gm, '').replace('export async function POST', 'async function POST')
function route(identity) {
  const calls = []
  const c = { Response, getD1: () => ({}), authenticatePlugin: async () => identity, exchangePairing: async () => ({ ok: true }), ingestItems: async () => ({ ok: true }),
    getProfile: async (_, userId, handle) => { calls.push([userId, handle]); return { ok: true } }, saveProfile: async () => ({ ok: true }), claimDue: async () => ({ ok: true, schedule: null }), reportSchedule: async () => ({ ok: true, status: 'done' }) }
  vm.createContext(c); vm.runInContext(source, c)
  return { calls, post: action => c.POST(new Request('https://x.2aran.com/api/x-workbench/bridge', { method: 'POST', body: JSON.stringify(action) })) }
}
test('Bearer 桥拒绝未认证，业务 userId 只来自令牌身份', async () => {
  assert.equal((await route(null).post({ action: 'profile.get' })).status, 401)
  const r = route({ user_id: 'tenant-a' })
  assert.equal((await r.post({ action: 'profile.get', handle: 'alice', userId: 'tenant-b' })).status, 200)
  assert.deepEqual(r.calls, [['tenant-a', 'alice']])
  assert.equal((await r.post({ action: 'unknown' })).status, 400)
})
test('排期业务状态不被误当作 HTTP 状态码', async () => {
  const res = await route({ user_id: 'a' }).post({ action: 'report', id: 's1', ok: true })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).ok, true)
})

test('话题审核 HTTP 入口拒绝非站长，普通用户仍可提议', async () => {
  const code = readFileSync(new URL('../../lib/x/workbench/routes/topics.js', import.meta.url), 'utf8').replace(/^import .*\n/gm, '').replace(/export function /g, 'function ')
  let reviewed = 0, suggested = 0
  const c = { URL, getD1: () => ({}), getUserFromRequest: async () => ({ id: 'u' }), isOwnerUser: () => false,
    handleWorkbench: async (req, services, fn) => fn({}, 'u'),
    listTopics: async () => ({ ok: true }), pendingTopics: async () => ({ ok: true }),
    reviewTopic: async () => { reviewed++; return { ok: true } }, suggestTopic: async () => { suggested++; return { ok: true } } }
  vm.createContext(c); vm.runInContext(code, c)
  const req = data => new Request('https://x.2aran.com/api/x-workbench/topics', { method: 'POST', body: JSON.stringify(data) })
  assert.equal((await c.POST(req({ action: 'review' }))).status, 403)
  assert.equal((await c.GET(new Request('https://x.2aran.com/api/x-workbench/topics?review=1'))).status, 403)
  assert.equal(reviewed, 0)
  assert.equal((await c.POST(req({ topic: '技术' }))).ok, true)
  assert.equal(suggested, 1)
})
