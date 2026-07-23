import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { articlePostToContentEntry } from '../../lib/articleContentIndex.mjs'

const originalEmitWarning = process.emitWarning
process.emitWarning = function filteredEmitWarning(warning, ...args) {
  if (args.some((value) => value === 'ExperimentalWarning')) return
  return originalEmitWarning.call(process, warning, ...args)
}
const { DatabaseSync } = await import('node:sqlite')

const routeSource = await readFile(
  new URL('../../app/api/admin/articles/[id]/route.js', import.meta.url),
  'utf8'
)
const consoleSource = await readFile(
  new URL('../../app/(admin)/admin/articles/ArticlesConsole.jsx', import.meta.url),
  'utf8'
)
const centerSource = await readFile(
  new URL('../../app/(admin)/admin/content/ContentCenter.jsx', import.meta.url),
  'utf8'
)
const backfillMigration = await readFile(
  new URL('../../migrations/0054_backfill_article_posts_content_index.sql', import.meta.url),
  'utf8'
)
const articlePostsMigration = await readFile(
  new URL('../../migrations/0024_article_posts.sql', import.meta.url),
  'utf8'
)
const contentIndexMigration = await readFile(
  new URL('../../migrations/0035_content_index.sql', import.meta.url),
  'utf8'
)

test('published online article maps to a content_index projection', () => {
  assert.deepEqual(articlePostToContentEntry({
    slug: 'hello-world',
    title: 'Hello World',
    summary: '',
    contentText: '正文摘要',
    tags: ['技术'],
    status: 'published',
    createdAt: Date.parse('2026-07-20T00:00:00Z'),
    updatedAt: Date.parse('2026-07-21T00:00:00Z'),
    publishedAt: Date.parse('2026-07-22T00:00:00Z'),
  }), {
    contentKey: 'article:hello-world',
    type: 'article',
    category: 'posts',
    slug: 'hello-world',
    title: 'Hello World',
    summary: '正文摘要',
    tags: ['技术'],
    href: '/articles/hello-world',
    date: '2026-07-22',
    status: 'published',
    source: 'manual',
  })
})

test('article mutations update article_posts and content_index in one D1 batch', () => {
  assert.match(routeSource, /prepareUpsertContentEntry/)
  assert.match(routeSource, /prepareDeleteContentEntry/)
  assert.match(routeSource, /await db\.batch\(statements\)/)
  assert.match(routeSource, /await db\.batch\(\[/)
  assert.match(backfillMigration, /FROM article_posts/)
  assert.match(backfillMigration, /WHERE status = 'published'/)
  assert.match(backfillMigration, /ON CONFLICT\(content_key\) DO UPDATE/)
})

test('backfill migration projects existing published articles and skips drafts', () => {
  const db = new DatabaseSync(':memory:')
  db.exec(articlePostsMigration)
  db.exec(contentIndexMigration)
  const insert = db.prepare(`INSERT INTO article_posts
    (id, slug, title, summary, content_text, tags_json, status, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  insert.run(
    'published-id',
    'published-post',
    '已发布文章',
    '',
    '用于回退的正文摘要',
    '["技术"]',
    'published',
    1784736000000,
    1784822400000,
    1784908800000
  )
  insert.run(
    'draft-id',
    'draft-post',
    '草稿文章',
    '',
    '草稿正文',
    '[]',
    'draft',
    1784736000000,
    1784822400000,
    null
  )

  db.exec(backfillMigration)

  const rows = db.prepare('SELECT * FROM content_index ORDER BY content_key').all()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].content_key, 'article:published-post')
  assert.equal(rows[0].summary, '用于回退的正文摘要')
  assert.equal(rows[0].date, '2026-07-24')
  assert.equal(rows[0].source, 'manual')
})

test('admin exposes one content management entry and one unified list', () => {
  assert.match(centerSource, /title: '内容管理'/)
  assert.doesNotMatch(centerSource, /title: '写作与编辑'/)
  assert.doesNotMatch(centerSource, /title: '内容库与发布'/)
  assert.match(consoleSource, /title="内容管理"/)
  assert.match(consoleSource, /fetch\('\/api\/admin\/articles'/)
  assert.match(consoleSource, /fetch\('\/api\/admin\/content-index'/)
  assert.match(consoleSource, /写文章/)
  assert.match(consoleSource, /登记内容/)
  assert.match(consoleSource, /索引维护/)
})
