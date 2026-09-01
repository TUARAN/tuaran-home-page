import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

import { dedupeBookmarks, parseChromeBookmarks, summarizeBookmarks } from '../lib/bookmarkNavigation.mjs'

const fixture = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>书签栏</H3>
  <DL><p>
    <DT><H3>AI</H3>
    <DL><p>
      <DT><A HREF="https://chatgpt.com/" ADD_DATE="1">ChatGPT &amp; OpenAI</A>
      <DT><A HREF="https://chatgpt.com/" ADD_DATE="2">重复链接</A>
    </DL><p>
    <DT><H3>工作台备份</H3>
    <DL><p>
      <DT><A HREF="http://127.0.0.1/admin?token=secret" ADD_DATE="3">管理控制台</A>
    </DL><p>
  </DL><p>
</DL><p>`

test('完整解析层级和实体，直接去除重复链接且不单独标记 HTTP', () => {
  const entries = parseChromeBookmarks(fixture)
  assert.equal(entries.length, 2)
  assert.equal(entries[0].title, 'ChatGPT & OpenAI')
  assert.deepEqual(entries[0].folderPath, ['书签栏', 'AI'])
  assert.equal(entries[0].category, 'ai')
  assert.equal(entries[1].category, 'work')
  assert.deepEqual(entries[1].riskFlags.sort(), ['direct-host', 'management-entry', 'sensitive-query'])
})

test('汇总分类数量与总数守恒', () => {
  const entries = parseChromeBookmarks(fixture)
  const summary = summarizeBookmarks(entries)
  assert.equal(summary.total, 2)
  assert.equal(summary.uniqueUrls, 2)
  assert.equal(summary.duplicateEntries, 0)
  assert.equal(Object.values(summary.categoryCounts).reduce((sum, count) => sum + count, 0), 2)
})

test('旧数据读取时去重并移除已有 HTTP 标记', () => {
  const entries = dedupeBookmarks([
    { id: 'first', url: 'http://example.com/', riskFlags: ['insecure-http'] },
    { id: 'second', url: 'http://example.com/', duplicateOf: 'first', riskFlags: ['insecure-http'] },
  ])
  assert.deepEqual(entries, [
    { id: 'first', url: 'http://example.com/', duplicateOf: null, riskFlags: [] },
  ])
})

test('D1 schema keeps one active import per owner and preserves versioned items', async () => {
  const schema = await readFile(new URL('../migrations/0085_bookmark_navigation.sql', import.meta.url), 'utf8')
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(schema)
  const insert = db.prepare(`INSERT INTO bookmark_nav_imports
    (import_id, user_id, source_name, source_sha256, total_count, unique_url_count, duplicate_count, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  insert.run('v1', 'owner', 'bookmarks.html', 'a'.repeat(64), 3, 2, 1, 'active', 1)
  assert.throws(() => insert.run('v2', 'owner', 'new.html', 'b'.repeat(64), 4, 4, 0, 'active', 2))
  insert.run('v2', 'owner', 'new.html', 'b'.repeat(64), 4, 4, 0, 'pending', 2)
  db.prepare(`INSERT INTO bookmark_nav_items
    (import_id, bookmark_id, user_id, position, title, url, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('v2', 'bookmark-0001', 'owner', 0, 'Example', 'https://example.com/', 'archive')
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM bookmark_nav_items').get().count, 1)
  db.close()
})
