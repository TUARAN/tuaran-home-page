import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ingestItems, listRadar } from '../../lib/x/workbench/radarStore.js'
import { listTopics, pendingTopics, reviewTopic, suggestTopic } from '../../lib/x/workbench/topicStore.js'
function makeDb() {
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('../../migrations/0134_x_workbench_radar.sql', import.meta.url), 'utf8'))
  const stmt = (q, args = []) => ({ bind: (...a) => stmt(q, a), first: async () => sql.prepare(q).get(...args), all: async () => ({ results: sql.prepare(q).all(...args) }), run: async () => ({ meta: { changes: sql.prepare(q).run(...args).changes } }) })
  return { prepare: q => stmt(q), batch: async items => { for (const i of items) await i.run() } }
}
test('话题需审核才公开，拒绝项不进入话题列表和筛选', async () => {
  const db = makeDb(), now = Date.now()
  await ingestItems(db, 'u', [{ id: '1234567', handle: 'alice', text: 'hi', createdAt: now }], now)
  assert.equal((await suggestTopic(db, 'u', { tweetId: '1234567', topic: '技术' })).ok, true)
  assert.deepEqual((await listTopics(db)).topics, [])
  assert.equal((await listRadar(db, 'u', { topic: '技术' }, now)).items.length, 0)
  const [suggestion] = (await pendingTopics(db)).suggestions
  assert.equal((await reviewTopic(db, { id: suggestion.id, decision: 'approved' })).ok, true)
  assert.deepEqual((await listTopics(db)).topics, ['技术'])
  assert.equal((await listRadar(db, 'u', { topic: '技术' }, now)).items.length, 1)
  assert.equal((await reviewTopic(db, { id: suggestion.id, decision: 'rejected' })).ok, false)
  await suggestTopic(db, 'u2', { tweetId: '1234567', topic: '其他' })
  const [other] = (await pendingTopics(db)).suggestions
  await reviewTopic(db, { id: other.id, decision: 'rejected' })
  assert.deepEqual((await listTopics(db)).topics, ['技术'])
})
