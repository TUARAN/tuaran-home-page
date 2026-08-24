import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeXArticleCandidates,
  normalizeXArticleReport,
  pickDailyXArticle,
} from '../lib/xArticleExtension.js'

const rows = [
  { content_key: 'research:topics:b', content_type: 'research', title: 'B', summary: '摘要 B', href: '/articles/research/topics/b' },
  { content_key: 'article:a', content_type: 'article', title: 'A', summary: '摘要 A', href: '/articles/a' },
  { content_key: 'resource:c', content_type: 'resource', title: 'C', summary: '摘要 C', href: '/resources/c' },
  { content_key: 'article:external', content_type: 'article', title: '外部', summary: '外部摘要', href: 'https://example.com' },
]

test('每日 X Article 只从站内公开文章候选中稳定选择', () => {
  assert.equal(normalizeXArticleCandidates(rows).length, 2)
  const first = pickDailyXArticle(rows, { dateKey: '2026-08-24' })
  const retry = pickDailyXArticle(rows, { dateKey: '2026-08-24' })
  assert.deepEqual(first, retry)
  assert.match(first.href, /^\/articles\//)
})

test('候选足够时不会连续选择上一篇', () => {
  const picked = pickDailyXArticle(rows, { dateKey: '2026-08-24', previousContentKey: 'article:a' })
  assert.notEqual(picked.contentKey, 'article:a')
})

test('扩展回写只接受发布、失败和结果不确定三种状态', () => {
  assert.equal(normalizeXArticleReport({ taskId: 'a', status: 'published' }).report.status, 'published')
  assert.equal(normalizeXArticleReport({ taskId: 'a', status: 'failed', attempt: 999 }).report.attempt, 100)
  assert.equal(normalizeXArticleReport({ taskId: 'a', status: 'published', xArticleUrl: 'javascript:alert(1)' }).report.xArticleUrl, '')
  assert.match(normalizeXArticleReport({ taskId: 'a', status: 'published', xArticleUrl: 'https://x.com/example/article/1' }).report.xArticleUrl, /^https:\/\/x\.com\//)
  assert.equal(normalizeXArticleReport({ taskId: 'a', status: 'pending' }).error, 'INVALID_STATUS')
})
