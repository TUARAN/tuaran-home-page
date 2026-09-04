import assert from 'node:assert/strict'
import test from 'node:test'
import worker, { performCheck, runBloggerEyeSchedule } from '../src/index.js'
import { checkViaGlobalping, GLOBALPING_REGIONS } from '../src/globalping.js'

const region = GLOBALPING_REGIONS[0]
const finished = (result = {}) => ({
  status: 'finished', results: [{ probe: { city: 'Singapore', country: 'SG' }, result: {
    status: 'finished', statusCode: 200, timings: { total: 123 }, headers: {},
    resolvedAddress: '104.21.75.186', ...result,
  } }],
})

function mockFetch(responses) {
  const calls = []
  return { calls, fetchImpl: async (url, init) => {
    calls.push({ url, ...init, body: init.body ? JSON.parse(init.body) : undefined })
    assert.ok(responses.length, 'unexpected extra request')
    const next = responses.shift()
    return next instanceof Response ? next : Response.json(next)
  } }
}

test('免费节点请求首页，再复用同一探针获取来源 IP；不采用 resolvedAddress', async () => {
  const mock = mockFetch([
    { id: 'home', probesCount: 1 }, finished(),
    { id: 'trace', probesCount: 1 }, finished({ rawBody: 'h=2aran.com\nip=129.150.55.6\n' }),
  ])
  const checked = await performCheck({ target: 'https://2aran.com/?test=1', runners: [], runnerIndex: 0,
    globalping: true, ...mock })
  assert.equal(checked.result.exitIp, '129.150.55.6')
  assert.equal(checked.result.httpStatus, 200)
  assert.equal(checked.result.durationMs, 123)
  assert.equal(checked.nextRunnerIndex, 1)
  assert.deepEqual(mock.calls[0].body.locations, [{ country: 'SG' }])
  assert.equal(mock.calls[0].body.measurementOptions.request.query, 'test=1')
  assert.equal(mock.calls[2].body.locations, 'home')
  assert.equal(mock.calls[2].body.measurementOptions.request.path, '/cdn-cgi/trace')
  assert.equal(Object.hasOwn(mock.calls[2].body.measurementOptions.request, 'query'), false)
})

test('进度查询遵循 ETag 和轮询间隔', async () => {
  const sleeps = []
  const mock = mockFetch([
    { id: 'home', probesCount: 1 },
    Response.json({ status: 'in-progress' }, { headers: { etag: 'pending' } }),
    new Response(null, { status: 304 }), finished(),
    { id: 'trace', probesCount: 1 }, finished({ rawBody: 'ip=129.150.55.6\n' }),
  ])
  await checkViaGlobalping({ target: 'https://2aran.com', region, ...mock, sleep: async ms => sleeps.push(ms) })
  assert.deepEqual(sleeps, [1000, 1000])
  assert.equal(mock.calls[2].headers['if-none-match'], 'pending')
})

test('地区轮换到最后一个后回到第一个，HTTP 错误码保留', async () => {
  const mock = mockFetch([
    { id: 'home', probesCount: 1 }, finished({ statusCode: 403 }),
    { id: 'trace', probesCount: 1 }, finished({ rawBody: 'ip=129.150.55.6\n' }),
  ])
  const checked = await performCheck({ target: 'https://2aran.com', runners: [], runnerIndex: 5,
    globalping: true, ...mock })
  assert.equal(checked.nextRunnerIndex, 0)
  assert.equal(checked.result.httpStatus, 403)
  assert.deepEqual(mock.calls[0].body.locations, [{ country: 'HK' }])
})

test('429、节点离线、无有效回显均失败，不回退直连', async () => {
  for (const responses of [
    [new Response(null, { status: 429 })],
    [{ id: 'home', probesCount: 0 }],
    [{ id: 'home', probesCount: 1 }, finished({ status: 'offline' })],
    [{ id: 'home', probesCount: 1 }, finished(), { id: 'trace', probesCount: 1 }, finished({ rawBody: 'ip=2a06:98c0:3600::103\n' })],
    [{ id: 'home', probesCount: 1 }, finished(), { id: 'trace', probesCount: 1 }, finished({ rawBody: 'ip=invalid\n' })],
  ]) {
    const mock = mockFetch(responses)
    await assert.rejects(performCheck({ target: 'https://2aran.com', runners: [], runnerIndex: 0,
      globalping: true, ...mock }), /Globalping|回显/)
    assert.ok(mock.calls.every(call => call.url.startsWith('https://api.globalping.io/')))
  }
})

test('未知目标及跳出授权范围的重定向被拒绝', async () => {
  const mock = mockFetch([{ id: 'home', probesCount: 1 }, finished({ statusCode: 302, headers: { location: 'https://example.com/' } })])
  await assert.rejects(checkViaGlobalping({ target: 'https://example.com', region, ...mock }), /已授权/)
  assert.equal(mock.calls.length, 0)
  await assert.rejects(checkViaGlobalping({ target: 'https://2aran.com', region, ...mock }), /已授权/)
  assert.equal(mock.calls.length, 2)
})

test('健康检查报告六个免费地区可轮换，无需共享密钥', async () => {
  const response = await worker.fetch(new Request('https://2aran.com/_internal/blogger-eye/health'), {
    BLOGGER_EYE_FREE_PROBES: 'globalping', BLOGGER_EYE_RUNNERS: '[]',
  })
  const body = await response.json()
  assert.equal(body.rotationReady, true)
  assert.equal(body.freeProbeRegions.length, 6)
  assert.equal(body.freeProbeProvider, 'globalping')
})

test('调度失败仍推进免费地区游标且历史记录正确标记来源', async () => {
  const writes = []
  const db = { prepare: sql => ({
    first: async () => ({ next_runner_index: 1, last_exit_ip: '129.150.55.6' }),
    bind: (...values) => ({ run: async () => { writes.push({ sql, values }) } }),
  }) }
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(null, { status: 429 })
  try {
    await assert.rejects(runBloggerEyeSchedule({ DB: db, BLOGGER_EYE_FREE_PROBES: 'globalping' }), /429/)
  } finally { globalThis.fetch = originalFetch }
  assert.equal(writes[0].values[0], 2)
  const history = writes.find(write => write.sql.includes('INSERT INTO blogger_eye_runs'))
  assert.equal(history.values[5], 'globalping')
  assert.equal(history.values[7], 'gp-jp')
  assert.equal(history.values[11], null)
})
