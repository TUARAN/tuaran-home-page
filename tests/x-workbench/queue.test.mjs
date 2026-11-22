import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { bindAccount } from '../../lib/x/workbench/workbenchStore.js'
import { QUEUE_LIMITS, addSchedule, cancelSchedule, claimDue, deleteDraft, listDrafts, listSchedules, reportSchedule, saveDraft } from '../../lib/x/workbench/workbenchQueue.js'

function makeDb() {
  const sqlite = new DatabaseSync(':memory:')
  for (const f of ['0130_x_workbench.sql', '0131_x_workbench_drafts.sql']) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${f}`, import.meta.url), 'utf8'))
  }
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...args).changes } }),
  })
  return { prepare: (sql) => stmt(sql), batch: async (l) => { for (const s of l) await s.run() } }
}

const NOW = Date.UTC(2026, 10, 22, 12)
const HOUR = 3_600_000

test('草稿按账号与用户隔离，只接受 x.com 来源链接', async () => {
  const db = makeDb()
  await bindAccount(db, 'u1', 'a')
  assert.equal((await saveDraft(db, 'u2', { handle: 'a', text: 'hi' })).error, 'ACCOUNT_NOT_BOUND')
  assert.equal((await saveDraft(db, 'u1', { handle: 'a', text: '  ' })).error, 'TEXT_REQUIRED')
  const { id } = await saveDraft(db, 'u1', { handle: 'a', text: '第一版', sourceUrl: 'https://evil.example/x' }, NOW)
  assert.equal((await saveDraft(db, 'u1', { handle: 'a', id, text: '第二版', sourceUrl: 'https://x.com/a/status/1' }, NOW + 1)).ok, true)
  const list = await listDrafts(db, 'u1', 'a')
  assert.equal(list.drafts[0].text, '第二版')
  assert.equal(list.drafts[0].source_url, 'https://x.com/a/status/1')
  assert.equal((await saveDraft(db, 'u2', { handle: 'a', id, text: '偷改' })).error, 'ACCOUNT_NOT_BOUND')
  await deleteDraft(db, 'u2', id)
  assert.equal((await listDrafts(db, 'u1', 'a')).drafts.length, 1)
  await deleteDraft(db, 'u1', id)
  assert.equal((await listDrafts(db, 'u1', 'a')).drafts.length, 0)
})

test('排期：时间下限、长度、队列上限', async () => {
  const db = makeDb()
  await bindAccount(db, 'u1', 'a')
  assert.equal((await addSchedule(db, 'u1', { handle: 'a', text: 'x', runAt: NOW + 1000 }, NOW)).error, 'RUN_AT_TOO_SOON')
  assert.equal((await addSchedule(db, 'u1', { handle: 'a', text: '字'.repeat(141), runAt: NOW + HOUR }, NOW)).error, 'TEXT_TOO_LONG')
  for (let i = 0; i < QUEUE_LIMITS.queued; i++) {
    assert.equal((await addSchedule(db, 'u1', { handle: 'a', text: `t${i}`, runAt: NOW + HOUR + i }, NOW)).ok, true)
  }
  assert.equal((await addSchedule(db, 'u1', { handle: 'a', text: 'more', runAt: NOW + HOUR }, NOW)).error, 'QUEUE_FULL')
})

test('领取只给到期条目，且同一条只被领一次；回报后不再出现', async () => {
  const db = makeDb()
  await bindAccount(db, 'u1', 'a')
  const early = await addSchedule(db, 'u1', { handle: 'a', text: '早', runAt: NOW + HOUR }, NOW)
  await addSchedule(db, 'u1', { handle: 'a', text: '晚', runAt: NOW + 5 * HOUR }, NOW)
  assert.equal((await claimDue(db, 'u1', 'a', NOW)).schedule, null)
  const later = NOW + 2 * HOUR
  const got = await claimDue(db, 'u1', 'a', later)
  assert.equal(got.schedule.id, early.id)
  assert.equal((await claimDue(db, 'u1', 'a', later)).schedule, null)
  assert.equal((await claimDue(db, 'u2', 'a', later)).error, 'ACCOUNT_NOT_BOUND')
  assert.equal((await reportSchedule(db, 'u2', { id: early.id, ok: true }, later)).error, 'SCHEDULE_NOT_CLAIMED')
  assert.equal((await reportSchedule(db, 'u1', { id: early.id, ok: true, result: 'ok' }, later)).status, 'done')
  assert.equal((await reportSchedule(db, 'u1', { id: early.id, ok: true }, later)).error, 'SCHEDULE_NOT_CLAIMED')
  const rest = await listSchedules(db, 'u1', 'a')
  assert.deepEqual(rest.schedules.map((s) => s.text), ['晚'])
})

test('领取后插件失联：超时回收重新排队；只有 queued 可取消', async () => {
  const db = makeDb()
  await bindAccount(db, 'u1', 'a')
  const s = await addSchedule(db, 'u1', { handle: 'a', text: '发', runAt: NOW + HOUR }, NOW)
  const t1 = NOW + 2 * HOUR
  assert.equal((await claimDue(db, 'u1', 'a', t1)).schedule.id, s.id)
  assert.equal((await cancelSchedule(db, 'u1', s.id, t1)).error, 'SCHEDULE_NOT_CANCELLABLE')
  assert.equal((await claimDue(db, 'u1', 'a', t1 + QUEUE_LIMITS.claimTtlMs + 1)).schedule.id, s.id)
  assert.equal((await reportSchedule(db, 'u1', { id: s.id, ok: false, result: '页面未登录' }, t1 + QUEUE_LIMITS.claimTtlMs + 2)).status, 'failed')
  const s2 = await addSchedule(db, 'u1', { handle: 'a', text: '取消', runAt: NOW + 9 * HOUR }, NOW)
  assert.equal((await cancelSchedule(db, 'u2', s2.id)).error, 'SCHEDULE_NOT_CANCELLABLE')
  assert.equal((await cancelSchedule(db, 'u1', s2.id)).ok, true)
})
