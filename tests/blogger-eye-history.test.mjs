import assert from 'node:assert/strict'
import test from 'node:test'

import { getBloggerEyeSchedulerSnapshot } from '../lib/bloggerEyeHistory.mjs'

function fakeDb({ state = null, runs = [], error = null } = {}) {
  return {
    prepare(sql) {
      return {
        bind() { return this },
        async first() {
          if (error) throw error
          assert.match(sql, /blogger_eye_scheduler_state/)
          return state
        },
        async all() {
          if (error) throw error
          assert.match(sql, /blogger_eye_runs/)
          return { results: runs }
        },
      }
    },
  }
}

test('定时检查快照规范化 D1 字段并保留 IP 变化状态', async () => {
  const snapshot = await getBloggerEyeSchedulerSnapshot(fakeDb({
    state: { next_runner_index: 1, last_runner_id: 'sin', last_exit_ip: '203.0.113.2', updated_at: 2000 },
    runs: [{
      id: 'run-1',
      trigger_type: 'cron',
      scheduled_at: 1000,
      completed_at: 1200,
      mode: 'regional-runner',
      target_url: 'https://2aran.com',
      runner_id: 'sin',
      runner_label: '新加坡',
      exit_ip: '203.0.113.2',
      previous_exit_ip: '203.0.113.1',
      ip_changed: 1,
      http_status: 200,
      duration_ms: 88,
      effective_url: 'https://2aran.com/',
      error: '',
    }],
  }))
  assert.equal(snapshot.ready, true)
  assert.equal(snapshot.lastRun.runnerId, 'sin')
  assert.equal(snapshot.lastRun.ipChanged, true)
  assert.equal(snapshot.lastRun.httpStatus, 200)
})

test('迁移缺失时返回可展示的就绪提示', async () => {
  const snapshot = await getBloggerEyeSchedulerSnapshot(fakeDb({ error: new Error('no such table: blogger_eye_runs') }))
  assert.equal(snapshot.ready, false)
  assert.match(snapshot.error, /0087/)
})
