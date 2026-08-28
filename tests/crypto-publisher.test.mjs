import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

import { AUTO_PUBLISH_DELAY_MS } from '../lib/aSharePublishCore.js'
import { CRYPTO_AUTO_PUBLISH_DELAY_MS } from '../lib/cryptoPublishCore.js'
import { autoPublishOldestDueCryptoDraft, publishCryptoDraft } from '../lib/cryptoPublisher.js'

const NOW = Date.UTC(2026, 7, 28, 1, 30)
const DUE = NOW - CRYPTO_AUTO_PUBLISH_DELAY_MS
const sections = [
  '一、先给结论', '二、起源、背景与发展时间线', '三、技术机制与网络结构', '四、用途、生态与价值来源',
  '五、代币经济与供给结构', '六、市场位置与历史表现', '七、治理、安全与关键依赖', '八、监管与合规环境',
  '九、催化因素、主要风险与外部研判', '十、信息来源与未能验证',
]
const CONTENT = `---\ntitle: Bitcoin\ncategory: topics\ncrypto_type: asset\ncoin_id: bitcoin\nsymbol: BTC\nmarket_cap_rank: 1\nreview_ready: false\nad_eligible: false\n---\n\n${sections.map((section) => `## ${section}\n${'测试内容。'.repeat(12)}`).join('\n\n')}`

async function fixture(t) {
  const sqlite = new DatabaseSync(':memory:')
  t.after(() => sqlite.close())
  sqlite.exec(await readFile(new URL('../migrations/0081_crypto_research.sql', import.meta.url), 'utf8'))
  const db = { prepare(sql) {
    const statement = sqlite.prepare(sql)
    function bound(args = []) {
      return {
        bind: (...values) => bound(values),
        async run() { return { meta: { changes: Number(statement.run(...args).changes) } } },
        async all() { return { results: statement.all(...args) } },
      }
    }
    return bound()
  } }
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options })
    if (options.method !== 'PUT') return Response.json({ message: 'Not Found' }, { status: 404 })
    return Response.json({ commit: { sha: 'test-commit' } })
  })
  function insert(id, status = 'pending', updatedAt = DUE, content = CONTENT) {
    sqlite.prepare(`INSERT INTO crypto_drafts
      (id, coin_id, symbol, name, draft_date, status, updated_at, created_at, content)
      VALUES (?, 'bitcoin', 'BTC', 'Bitcoin', '2026-08-25', ?, ?, ?, ?)`)
      .run(id, status, updatedAt, updatedAt - 100_000, content)
  }
  const row = (id) => sqlite.prepare('SELECT * FROM crypto_drafts WHERE id = ?').get(id)
  const options = { db, env: { A_SHARE_PUBLISH_TOKEN: 'test-token' }, now: NOW }
  return { sqlite, requests, insert, row, options }
}

test('与 A 股使用相同 72 小时窗口，未到期不发布，到期自动发布且保留复核标记', async (t) => {
  assert.equal(CRYPTO_AUTO_PUBLISH_DELAY_MS, 72 * 60 * 60 * 1000)
  assert.equal(CRYPTO_AUTO_PUBLISH_DELAY_MS, AUTO_PUBLISH_DELAY_MS)
  const f = await fixture(t)
  f.insert('due')
  assert.equal((await autoPublishOldestDueCryptoDraft({ ...f.options, now: NOW - 1 })).reason, 'none-due')
  assert.equal(f.requests.length, 0)
  const result = await autoPublishOldestDueCryptoDraft(f.options)
  assert.equal(result.id, 'due')
  assert.equal(f.row('due').status, 'published')
  assert.equal(f.row('due').publish_commit, 'test-commit')
  const body = JSON.parse(f.requests.find((request) => request.method === 'PUT').body)
  assert.equal(body.branch, 'main')
  assert.match(body.message, /auto-publish crypto observation/)
  const article = Buffer.from(body.content, 'base64').toString('utf8')
  assert.match(article, /^review_ready: false$/m)
  assert.match(article, /^ad_eligible: false$/m)
})

test('已复核、已退回、已发布及生成中或失败稿均不自动发布', async (t) => {
  const f = await fixture(t)
  for (const status of ['reviewed', 'rejected', 'published', 'generating', 'failed']) f.insert(status, status, DUE - 1)
  assert.equal((await autoPublishOldestDueCryptoDraft(f.options)).reason, 'none-due')
  assert.equal(f.requests.length, 0)
})

test('积压稿每次只发布最早到期的一篇，已发布稿不会再次进入队列', async (t) => {
  const f = await fixture(t)
  f.insert('newer')
  f.insert('oldest', 'pending', DUE - 1000)
  assert.equal((await autoPublishOldestDueCryptoDraft(f.options)).id, 'oldest')
  assert.equal(f.row('newer').status, 'pending')
  assert.equal((await autoPublishOldestDueCryptoDraft(f.options)).id, 'newer')
  assert.equal((await autoPublishOldestDueCryptoDraft(f.options)).reason, 'none-due')
  assert.equal(f.requests.filter((request) => request.method === 'PUT').length, 2)
})

test('自动发布失败恢复待复核并保留原到期时间，后续调度可重试', async (t) => {
  const f = await fixture(t)
  f.insert('retry')
  globalThis.fetch.mock.mockImplementationOnce(async () => Response.json({ message: 'unavailable' }, { status: 503 }))
  await assert.rejects(autoPublishOldestDueCryptoDraft(f.options), { code: 'PUBLISH_FAILED' })
  assert.equal(f.row('retry').status, 'pending')
  assert.equal(f.row('retry').updated_at, DUE)
  assert.equal((await autoPublishOldestDueCryptoDraft(f.options)).id, 'retry')
  assert.deepEqual(f.sqlite.prepare('SELECT status FROM crypto_run_log ORDER BY rowid').all().map((row) => row.status), ['failed', 'ok'])
})

test('人工退回抢先完成时，自动发布的旧快照不能继续发布', async (t) => {
  const f = await fixture(t)
  f.insert('rejected')
  const draft = f.row('rejected')
  f.sqlite.prepare("UPDATE crypto_drafts SET status = 'rejected' WHERE id = ?").run(draft.id)
  const result = await publishCryptoDraft({ ...f.options, draft, mode: 'auto' })
  assert.equal(result.reason, 'status-changed')
  assert.equal(f.requests.length, 0)
})

test('内容校验失败稿退回，不阻塞后续合格的到期稿', async (t) => {
  const f = await fixture(t)
  f.insert('invalid', 'pending', DUE - 1, '不完整草稿')
  f.insert('valid')
  assert.equal((await autoPublishOldestDueCryptoDraft(f.options)).id, 'valid')
  assert.equal(f.row('invalid').status, 'rejected')
  assert.equal(f.requests.filter((request) => request.method === 'PUT').length, 1)
})
