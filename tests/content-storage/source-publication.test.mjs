import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { publishAShareDraft } from '../../lib/aSharePublisher.js'

const raw = `---
title: 本地示例公司（999998）
category: companies
company_type: a_share
stock_code: "999998"
exchange: SHSE
board: main
date: "2026-09-10"
tags: [A股, 示例]
summary: 本地发布测试
review_ready: false
ad_eligible: false
---
## 结论
${'本地示例公司的测试正文。'.repeat(20)}
## 信息来源与说明
仅用于测试。`

function harness(t) {
  const sql = new DatabaseSync(':memory:')
  t.after(() => sql.close())
  for (const migration of ['0024_article_posts.sql','0035_content_index.sql','0089_content_documents.sql','0060_a_share_research.sql','0062_a_share_drafts_generating.sql','0063_a_share_drafts_published.sql','0067_a_share_drafts_failed.sql']) {
    sql.exec(fs.readFileSync(new URL(`../../migrations/${migration}`, import.meta.url), 'utf8'))
  }
  let failBatch = false, failMark = false
  const db = {
    prepare(query) {
      const statement = sql.prepare(query)
      const bound = (args = []) => ({
        bind: (...values) => bound(values),
        async first() { return statement.get(...args) || null },
        async run() {
          if (failMark && /UPDATE a_share_drafts SET status = 'published'/.test(query)) { failMark = false; throw new Error('STATUS_WRITE_FAILED') }
          return { meta: { changes: Number(statement.run(...args).changes) } }
        },
      })
      return bound()
    },
    async batch(statements) {
      if (failBatch) { failBatch = false; throw new Error('BATCH_UNAVAILABLE') }
      sql.exec('BEGIN')
      try { for (const statement of statements) await statement.run(); sql.exec('COMMIT') }
      catch (error) { sql.exec('ROLLBACK'); throw error }
    },
  }
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, ...options })
    return options.method === 'PUT' ? Response.json({ commit: { sha: 'local-test-commit' } }) : Response.json({ message: 'Not Found' }, { status: 404 })
  })
  sql.prepare("INSERT INTO a_share_drafts(id,code,name,draft_date,content,status,created_at,updated_at) VALUES ('test','999998','本地示例公司','2026-09-10',?,'reviewed',1,1)").run(raw)
  const row = () => sql.prepare("SELECT * FROM a_share_drafts WHERE id='test'").get()
  return { sql, requests, row, publish: () => publishAShareDraft({ db, env: { A_SHARE_PUBLISH_TOKEN: 'test-token' }, draft: row() }), failBatch() { failBatch = true }, failMark() { failMark = true } }
}

test('special publisher writes D1 before reporting published and keeps Git content/source hash', async (t) => {
  const h = harness(t)
  const result = await h.publish()
  assert.equal(result.url, '/articles/research/companies/a-share-999998')
  assert.equal(h.row().status, 'published')
  const stored = h.sql.prepare('SELECT * FROM content_documents').get()
  assert.match(JSON.parse(stored.body_json).content, /测试正文/)
  assert.equal(stored.source_path, 'research/companies/2026-09-10-a-share-999998.md')
  assert.equal(h.sql.prepare('SELECT count(*) n FROM content_routes').get().n, 4)
  const commit = JSON.parse(h.requests.find((request) => request.method === 'PUT').body)
  assert.match(commit.message, /^\[CF-Pages-Skip\]/)
  assert.equal(Buffer.from(commit.content, 'base64').toString('utf8'), raw)
})

test('D1 failure after Git write does not falsely mark a draft published; retry completes', async (t) => {
  const h = harness(t); h.failBatch()
  await assert.rejects(h.publish(), /BATCH_UNAVAILABLE/)
  assert.equal(h.row().status, 'reviewed')
  assert.equal(h.sql.prepare('SELECT count(*) n FROM content_documents').get().n, 0)
  await h.publish()
  assert.equal(h.row().status, 'published')
  assert.equal(h.sql.prepare('SELECT revision FROM content_documents').get().revision, 1)
})

test('retry after post-publication bookkeeping failure does not increment the same snapshot', async (t) => {
  const h = harness(t); h.failMark()
  await assert.rejects(h.publish(), /STATUS_WRITE_FAILED/)
  assert.equal(h.row().status, 'reviewed')
  assert.equal(h.sql.prepare('SELECT revision FROM content_documents').get().revision, 1)
  await h.publish()
  assert.equal(h.row().status, 'published')
  assert.equal(h.sql.prepare('SELECT revision FROM content_documents').get().revision, 1)
})

test('missing content schema fails before any Git write', async (t) => {
  const h = harness(t)
  h.sql.exec('DROP TABLE content_documents')
  await assert.rejects(h.publish(), /no such table/)
  assert.equal(h.requests.length, 0)
  assert.equal(h.row().status, 'reviewed')
})
