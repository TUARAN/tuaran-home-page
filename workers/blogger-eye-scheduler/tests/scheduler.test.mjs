import assert from 'node:assert/strict'
import test from 'node:test'

import worker, {
  parseRunnerConfig,
  performCheck,
  runnerIndexForTime,
  selectRunner,
} from '../src/index.js'

test('Runner 配置只保留去重后的公网 HTTPS 端点', () => {
  const runners = parseRunnerConfig(JSON.stringify([
    { id: 'hkg', label: '香港', url: 'https://hkg.example.com/api/check' },
    { id: 'hkg', label: '重复', url: 'https://duplicate.example.com/api/check' },
    { id: 'local', url: 'https://127.0.0.1/api/check' },
    { id: 'plain', url: 'http://plain.example.com/api/check' },
  ]))
  assert.deepEqual(runners, [
    { id: 'hkg', label: '香港', url: 'https://hkg.example.com/api/check' },
  ])
})

test('Runner 按游标循环轮换', () => {
  const runners = [{ id: 'hkg' }, { id: 'sin' }, { id: 'nrt' }]
  assert.deepEqual(selectRunner(runners, 0), { runner: runners[0], nextRunnerIndex: 1 })
  assert.deepEqual(selectRunner(runners, 2), { runner: runners[2], nextRunnerIndex: 0 })
  assert.deepEqual(selectRunner(runners, 4), { runner: runners[1], nextRunnerIndex: 2 })
})

test('D1 状态不可读时按 20 分钟时间槽确定 Runner', () => {
  const slot = 20 * 60 * 1000
  assert.equal(runnerIndexForTime(0, 3), 0)
  assert.equal(runnerIndexForTime(slot, 3), 1)
  assert.equal(runnerIndexForTime(slot * 2, 3), 2)
  assert.equal(runnerIndexForTime(slot * 3, 3), 0)
  assert.equal(runnerIndexForTime(slot, 0), 0)
})

test('存在 Runner 和共享密钥时只调用选中的一个节点', async () => {
  const calls = []
  const runners = [
    { id: 'hkg', label: '香港', url: 'https://hkg.example.com/api/check' },
    { id: 'sin', label: '新加坡', url: 'https://sin.example.com/api/check' },
  ]
  const outcome = await performCheck({
    target: 'https://2aran.com',
    runners,
    runnerIndex: 1,
    runnerSecret: 'shared-secret',
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      return Response.json({
        ok: true,
        ip: '203.0.113.22',
        status: 200,
        durationMs: 88,
        effectiveUrl: 'https://2aran.com/',
      })
    },
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, runners[1].url)
  assert.equal(calls[0].init.headers.authorization, 'Bearer shared-secret')
  assert.deepEqual(JSON.parse(calls[0].init.body), { url: 'https://2aran.com' })
  assert.equal(outcome.result.exitIp, '203.0.113.22')
  assert.equal(outcome.nextRunnerIndex, 0)
})

test('无 Runner 时使用 Cloudflare 直连并识别固定跨 Zone 地址', async () => {
  const calls = []
  const outcome = await performCheck({
    target: 'https://2aran.com',
    runners: [],
    runnerIndex: 0,
    runnerSecret: '',
    fetchImpl: async (url) => {
      calls.push(String(url))
      if (String(url).startsWith('https://api.ipify.org')) {
        return Response.json({ ip: '2a06:98c0:3600::103' })
      }
      return new Response('<html>ok</html>', { status: 200, headers: { 'content-type': 'text/html' } })
    },
  })
  assert.equal(calls.length, 2)
  assert.equal(outcome.result.mode, 'cloudflare-fixed-egress')
  assert.equal(outcome.result.httpStatus, 200)
  assert.equal(outcome.result.exitIp, '2a06:98c0:3600::103')
})

test('主域名内部路径的手动执行入口拒绝缺失或错误的 Bearer 密钥', async () => {
  const env = {
    BLOGGER_EYE_TARGET_URL: 'https://2aran.com',
    BLOGGER_EYE_RUNNERS: '[]',
    BLOGGER_EYE_MANUAL_SECRET: 'correct-secret',
  }
  const missing = await worker.fetch(new Request('https://2aran.com/_internal/blogger-eye/run', { method: 'POST' }), env)
  const wrong = await worker.fetch(new Request('https://2aran.com/_internal/blogger-eye/run', {
    method: 'POST',
    headers: { authorization: 'Bearer wrong-secret' },
  }), env)
  assert.equal(missing.status, 401)
  assert.equal(wrong.status, 401)
  assert.deepEqual(await missing.json(), { ok: false, error: 'unauthorized' })
})

test('主域名内部路径的健康检查只公开配置状态并报告手动认证是否就绪', async () => {
  const response = await worker.fetch(new Request('https://2aran.com/_internal/blogger-eye/health'), {
    BLOGGER_EYE_TARGET_URL: 'https://2aran.com',
    BLOGGER_EYE_RUNNERS: '[]',
    BLOGGER_EYE_MANUAL_SECRET: 'configured',
  })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.schedule, 'every-20-minutes')
  assert.equal(body.manualRunReady, true)
  assert.equal(body.rotationReady, false)
})
