import assert from 'node:assert/strict'
import test from 'node:test'

import {
  countAdminContentItems,
  filterAdminContentItems,
  mergeAdminContentItems,
  normalizeContentListParams,
  paginateAdminContentItems,
  sortAdminContentItems,
} from '../lib/adminContentList.js'

test('merge combines build entries, posts and manual entries with key dedupe', () => {
  const items = mergeAdminContentItems({
    buildEntries: [
      { contentKey: 'research:companies:a', type: 'research', title: '调研A', href: '/x', date: '2026-08-01' },
      { contentKey: 'article:shared', type: 'article', title: '构建期共享', href: '/articles/shared', date: '2026-08-02' },
    ],
    posts: [
      { id: 'p1', slug: 'shared', title: '在线版本', status: 'draft', updatedAt: 200, createdAt: 100 },
    ],
    manualEntries: [
      { content_key: 'resource:manual', content_type: 'resource', title: '手工条目', href: '/r', date: '2026-08-03' },
      { content_key: 'article:shared', content_type: 'article', title: '重复手工', href: '/x', date: '' },
    ],
  })

  assert.equal(items.length, 3)
  const shared = items.find((item) => item.contentKey === 'article:shared')
  assert.equal(shared.entity, 'article-post')
  assert.equal(shared.status, 'draft')
  assert.equal(shared.source, 'editor')
  assert.equal(shared.article.slug, 'shared')
  const manual = items.find((item) => item.contentKey === 'resource:manual')
  assert.equal(manual.source, 'manual')
})

test('filter supports query, type and status', () => {
  const items = [
    { title: '黄金调研', contentKey: 'research:topics:gold', href: '/a', type: 'research', status: 'published' },
    { title: '草稿文章', contentKey: 'article:draft-x', href: '/b', type: 'article', status: 'draft' },
    { title: '资源页', contentKey: 'resource:kit', href: '/c', type: 'resource', status: 'published' },
  ]
  assert.equal(filterAdminContentItems(items, { query: '黄金' }).length, 1)
  assert.equal(filterAdminContentItems(items, { type: 'article' }).length, 1)
  assert.equal(filterAdminContentItems(items, { status: 'draft' }).length, 1)
  assert.equal(filterAdminContentItems(items, { query: 'resource:kit' }).length, 1)
  assert.equal(filterAdminContentItems(items, { type: 'article', status: 'published' }).length, 0)
})

test('sort descends by updatedAt then title, paginate slices and counts aggregate', () => {
  const items = [
    { title: 'A', updatedAt: 100 },
    { title: 'B', updatedAt: 300 },
    { title: 'C', updatedAt: 200 },
  ]
  assert.deepEqual(
    sortAdminContentItems(items).map((item) => item.title),
    ['B', 'C', 'A'],
  )
  assert.deepEqual(
    paginateAdminContentItems(sortAdminContentItems(items), 1, 2).map((item) => item.title),
    ['C', 'A'],
  )
  assert.equal(paginateAdminContentItems(items, 99, 20).length, 0)
  const withStatus = [
    { status: 'published' },
    { status: 'draft' },
    { status: 'retired' },
    { status: 'published' },
  ]
  assert.deepEqual(countAdminContentItems(withStatus), { all: 4, published: 2, draft: 1, retired: 1 })
})

test('params normalization clamps offset/limit and defaults type/status', () => {
  assert.deepEqual(normalizeContentListParams({}), { query: '', type: 'all', status: 'all', offset: 0, limit: 20 })
  assert.deepEqual(normalizeContentListParams({ q: '  x  ', type: 'nope', status: 'draft', offset: '5', limit: '500' }), {
    query: 'x',
    type: 'all',
    status: 'draft',
    offset: 5,
    limit: 100,
  })
})
