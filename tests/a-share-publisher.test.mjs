import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

import { AUTO_PUBLISH_DELAY_MS } from '../lib/aSharePublishCore.js'
import { autoPublishOldestDueDraft } from '../lib/aSharePublisher.js'

function article(code, name) {
  return [
    '---',
    `title: "阿燃调研：每天一家A股上市公司 —— ${name}（${code}）公司观察"`,
    'category: companies',
    'company_type: a_share',
    `stock_code: "${code}"`,
    'exchange: SZSE',
    'board: main',
    'date: "2026-09-16"',
    'tags: [A股]',
    'summary: 一句话概述。',
    'review_ready: false',
    'ad_eligible: false',
    '---',
    '',
    '## 一、先给结论',
    `${name}主营业务观察。${'正文补充。'.repeat(20)}`,
    '',
    '## 十、信息来源与说明',
    '来源：巨潮资讯。',
  ].join('\n')
}

test('没有满 3 天的待复核稿时跳过自动发布', async () => {
  const calls = []
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql, values })
          return this
        },
        async all() {
          return { results: [] }
        },
      }
    },
  }
  const now = Date.UTC(2026, 7, 12, 1, 0, 0)
  const result = await autoPublishOldestDueDraft({ db, env: {}, now })
  assert.deepEqual(result, { ok: true, skipped: true, reason: 'none-due' })
  assert.match(calls[0].sql, /status = 'pending'/)
  assert.match(calls[0].sql, /ORDER BY updated_at ASC LIMIT 20/)
  assert.deepEqual(calls[0].values, [now - AUTO_PUBLISH_DELAY_MS])
})

test('到期积压稿一次调度全部自动发布', async (t) => {
  const sqlite = new DatabaseSync(':memory:')
  t.after(() => sqlite.close())
  for (const migration of [
    '0024_article_posts.sql',
    '0035_content_index.sql',
    '0089_content_documents.sql',
    '0060_a_share_research.sql',
    '0062_a_share_drafts_generating.sql',
    '0063_a_share_drafts_published.sql',
    '0067_a_share_drafts_failed.sql',
  ]) {
    sqlite.exec(fs.readFileSync(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'))
  }
  const db = {
    prepare(query) {
      const statement = sqlite.prepare(query)
      const bound = (args = []) => ({
        bind: (...values) => bound(values),
        async first() { return statement.get(...args) || null },
        async all() { return { results: statement.all(...args) } },
        async run() { return { meta: { changes: Number(statement.run(...args).changes) } } },
      })
      return bound()
    },
    async batch(statements) {
      sqlite.exec('BEGIN')
      try {
        for (const statement of statements) await statement.run()
        sqlite.exec('COMMIT')
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
  }
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options })
    return options.method === 'PUT'
      ? Response.json({ commit: { sha: 'auto-publish-commit' } })
      : Response.json({ message: 'Not Found' }, { status: 404 })
  })

  const now = Date.UTC(2026, 8, 19, 17, 0, 0)
  const due = now - AUTO_PUBLISH_DELAY_MS
  sqlite.prepare("INSERT INTO a_share_drafts(id,code,name,draft_date,content,status,created_at,updated_at) VALUES (?,?,?,?,?,'pending',?,?)")
    .run('older', '920374', '先声药业', '2026-09-16', article('920374', '先声药业'), due - 1000, due - 1000)
  sqlite.prepare("INSERT INTO a_share_drafts(id,code,name,draft_date,content,status,created_at,updated_at) VALUES (?,?,?,?,?,'pending',?,?)")
    .run('newer', '301096', '百诚医药', '2026-09-16', article('301096', '百诚医药'), due, due)

  const result = await autoPublishOldestDueDraft({ db, env: { A_SHARE_PUBLISH_TOKEN: 'test-token' }, now })
  assert.deepEqual(result.published.map((item) => item.id), ['older', 'newer'])
  assert.equal(sqlite.prepare("SELECT status FROM a_share_drafts WHERE id='older'").get().status, 'published')
  assert.equal(sqlite.prepare("SELECT status FROM a_share_drafts WHERE id='newer'").get().status, 'published')
  assert.equal(requests.filter((request) => request.method === 'PUT').length, 2)
  assert.equal((await autoPublishOldestDueDraft({ db, env: { A_SHARE_PUBLISH_TOKEN: 'test-token' }, now })).reason, 'none-due')
})
