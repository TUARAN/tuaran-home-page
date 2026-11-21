import assert from 'node:assert/strict'
import test from 'node:test'

import worker, {
  evaluateCheck,
  monitorUrl,
  nextMonitorState,
  probeCheck,
  runIndependentProbes,
  runSiteStatusSchedule,
  SITE_STATUS_PROBE_CRON,
  targetOrigin,
} from '../src/index.js'

test('只允许 2aran.com 的公网 HTTPS 探活源', () => {
  assert.equal(targetOrigin('https://2aran.com'), 'https://2aran.com')
  assert.equal(targetOrigin('https://admin.2aran.com/'), 'https://admin.2aran.com')
  assert.throws(() => targetOrigin('https://example.com'), /不在站点探活授权范围/)
  assert.throws(() => targetOrigin('http://2aran.com'), /必须是 2aran.com 的公网 HTTPS 源/)
  assert.equal(
    monitorUrl('https://2aran.com/api/site-status/monitor', 'https://2aran.com'),
    'https://2aran.com/api/site-status/monitor',
  )
  assert.throws(() => monitorUrl('https://example.com/api/site-status/monitor', 'https://2aran.com'), /不在站点探活授权范围/)
})

test('首页只要 2xx，site-health 还要 JSON healthy 不为 false', () => {
  assert.equal(evaluateCheck('home', { status: 200 }, '<html>ok</html>').ok, true)
  assert.equal(evaluateCheck('home', { status: 503 }, 'down').ok, false)
  assert.deepEqual(evaluateCheck('site-health', { status: 200 }, JSON.stringify({ healthy: true })).ok, true)
  assert.equal(evaluateCheck('site-health', { status: 503 }, JSON.stringify({ healthy: false })).ok, false)
  assert.equal(evaluateCheck('site-health', { status: 200 }, JSON.stringify({ healthy: false })).ok, false)
  assert.equal(evaluateCheck('site-health', { status: 200 }, '<html>nope</html>').ok, false)
})

test('连续 3 次失败才告警宕机，连续 3 次成功才从宕机恢复；首次成功只建立基线', () => {
  let current = null
  const failures = []
  for (let index = 1; index <= 3; index += 1) {
    const result = nextMonitorState({ previous: current, healthy: false, now: index })
    current = result.state
    failures.push(result.alert)
  }
  assert.deepEqual(failures, [null, null, { kind: 'down' }])
  assert.equal(current.lastKnownState, 'down')
  assert.equal(current.consecutiveFailures, 3)

  const recoveries = []
  for (let index = 4; index <= 6; index += 1) {
    const result = nextMonitorState({ previous: current, healthy: true, now: index })
    current = result.state
    recoveries.push(result.alert)
  }
  assert.deepEqual(recoveries, [null, null, { kind: 'recovered' }])
  assert.equal(current.lastKnownState, 'up')

  const baseline = nextMonitorState({ previous: null, healthy: true, now: 10 })
  assert.equal(baseline.alert, null)
  const established = nextMonitorState({ previous: { consecutiveSuccesses: 2, lastKnownState: null }, healthy: true, now: 11 })
  assert.equal(established.alert, null)
  assert.equal(established.state.lastKnownState, 'up')

  const stillDown = nextMonitorState({ previous: { lastKnownState: 'down', consecutiveFailures: 3 }, healthy: false, now: 12 })
  assert.equal(stillDown.alert, null)
})

test('单次检查失败会重试，成功则停止', async () => {
  const delays = []
  const calls = []
  const result = await probeCheck({
    id: 'home',
    url: 'https://2aran.com/',
    retries: 2,
    delayMs: 25,
    sleep: async (ms) => { delays.push(ms) },
    fetchImpl: async (url) => {
      calls.push(String(url))
      if (calls.length < 3) throw new Error('network down')
      return new Response('<html>ok</html>', { status: 200 })
    },
  })
  assert.equal(result.ok, true)
  assert.equal(calls.length, 3)
  assert.deepEqual(delays, [25, 25])
  assert.equal(result.attempts.length, 3)
})

test('独立探活要求首页和 site-health 都成功', async () => {
  const probe = await runIndependentProbes({
    origin: 'https://2aran.com',
    sleep: async () => {},
    fetchImpl: async (url) => {
      if (String(url).endsWith('/api/site-health')) {
        return new Response(JSON.stringify({ healthy: true }), { status: 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response('<html>ok</html>', { status: 200 })
    },
  })
  assert.equal(probe.healthy, true)
  assert.deepEqual(probe.checks.map((item) => item.id), ['home', 'site-health'])
})

function memoryBucket(initial = new Map()) {
  const store = initial
  return {
    async get(key) {
      if (!store.has(key)) return null
      const value = store.get(key)
      return { json: async () => value, text: async () => JSON.stringify(value) }
    },
    async put(key, value) {
      store.set(key, JSON.parse(value))
    },
    store,
  }
}

test('完整一轮会写入状态、在可达时同步监控接口，并只在状态变化时打日志', async () => {
  const bucket = memoryBucket()
  const logs = []
  const originalLog = console.log
  console.log = (...args) => { logs.push(args.join(' ')) }
  const calls = []
  const env = {
    SITE_STATUS_TARGET_ORIGIN: 'https://2aran.com',
    SITE_STATUS_MONITOR_URL: 'https://2aran.com/api/site-status/monitor',
    SITE_STATUS_MONITOR_SECRET: 'monitor-secret',
    CONTENT_FEED: bucket,
  }
  const downFetch = async (url, init) => {
    calls.push({ url: String(url), method: init?.method || 'GET' })
    if (String(url).includes('/api/site-status/monitor')) {
      return new Response(JSON.stringify({ ok: true, changed: false }), { status: 200 })
    }
    return new Response('fail', { status: 503 })
  }
  try {
    let run
    for (let index = 1; index <= 3; index += 1) {
      run = await runSiteStatusSchedule(env, { fetchImpl: downFetch, now: index, sleep: async () => {}, trigger: 'cron' })
    }
    assert.equal(run.healthy, false)
    assert.equal(run.changed, true)
    assert.equal(run.alert.kind, 'down')
    assert.equal(run.persisted, true)
    assert.equal(run.monitorSync.ok, true)
    assert.equal(calls.some((item) => item.url.endsWith('/api/site-status/monitor') && item.method === 'POST'), true)
    assert.equal(logs.some((line) => line.includes('"kind":"down"') && line.includes('site-status-state-change')), true)

    logs.length = 0
    const quiet = await runSiteStatusSchedule(env, { fetchImpl: downFetch, now: 4, sleep: async () => {}, trigger: 'cron' })
    assert.equal(quiet.changed, false)
    assert.equal(logs.length, 0)
  } finally {
    console.log = originalLog
  }
})

test('手动执行入口拒绝缺失或错误的 Bearer 密钥', async () => {
  const env = {
    SITE_STATUS_TARGET_ORIGIN: 'https://2aran.com',
    SITE_STATUS_MANUAL_SECRET: 'correct-secret',
  }
  const missing = await worker.fetch(new Request('https://2aran.com/_internal/site-status/run', { method: 'POST' }), env)
  const wrong = await worker.fetch(new Request('https://2aran.com/_internal/site-status/run', {
    method: 'POST',
    headers: { authorization: 'Bearer wrong-secret' },
  }), env)
  assert.equal(missing.status, 401)
  assert.equal(wrong.status, 401)
  assert.deepEqual(await missing.json(), { ok: false, error: 'unauthorized' })
})

test('健康检查只公开配置状态，不暴露密钥，并声明 5 分钟调度', async () => {
  const response = await worker.fetch(new Request('https://2aran.com/_internal/site-status/health'), {
    SITE_STATUS_TARGET_ORIGIN: 'https://2aran.com',
    SITE_STATUS_MONITOR_SECRET: 'configured',
    SITE_STATUS_MANUAL_SECRET: 'configured',
    CONTENT_FEED: memoryBucket(),
  })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.service, 'site-status-scheduler')
  assert.equal(body.schedule, 'every-5-minutes')
  assert.equal(SITE_STATUS_PROBE_CRON, '*/5 * * * *')
  assert.equal(body.manualRunReady, true)
  assert.equal(body.monitorSyncReady, true)
  assert.equal(body.storageReady, true)
  assert.equal(JSON.stringify(body).includes('configured'), false)
})
