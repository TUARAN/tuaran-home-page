import assert from 'node:assert/strict'
import test from 'node:test'

import {
  listResourceRssEntries,
  listRichPageRssEntries,
} from '../../lib/rssContentEntries.js'

test('public rich pages become versioned RSS notifications', () => {
  const entries = listRichPageRssEntries([
    {
      id: 'public-page',
      title: '公开富页面',
      summary: '摘要',
      date: '2026-07-01',
      updated: '2026-07-24T12:30:00+08:00',
      href: '/public-page',
    },
    {
      id: 'private-page',
      title: '私有工作台',
      date: '2026-07-24',
      href: '/private-page',
      audience: 'owner',
    },
  ])

  assert.equal(entries.length, 1)
  assert.equal(entries[0].link, 'https://2aran.com/public-page')
  assert.equal(entries[0].publishedAt, '2026-07-24T12:30:00+08:00')
  assert.match(entries[0].guid, /^urn:2aran:rss:rich-page:/)
  assert.equal(entries[0].category, '多维页面')
})

test('changing updated creates a new rich-page GUID while keeping the permalink', () => {
  const base = {
    id: 'long-running-page',
    title: '长期项目',
    date: '2026-07-01',
    href: '/long-running-page',
  }
  const before = listRichPageRssEntries([{ ...base, updated: '2026-07-23' }])[0]
  const after = listRichPageRssEntries([{ ...base, updated: '2026-07-24' }])[0]

  assert.equal(before.link, after.link)
  assert.notEqual(before.guid, after.guid)
})

test('resources only include bookmark and resource paths and also use versioned GUIDs', () => {
  const entries = listResourceRssEntries([
    {
      title: '收藏',
      summary: '收藏摘要',
      date: '2026-07-01',
      href: '/bookmarks/example',
    },
    {
      title: '资源',
      summary: '资源摘要',
      date: '2026-07-02',
      href: '/resources/example',
    },
    {
      title: '普通页面',
      date: '2026-07-03',
      href: '/reading',
    },
  ])

  assert.deepEqual(entries.map((entry) => entry.category), ['收藏', '资源'])
  assert.ok(entries.every((entry) => entry.guid.startsWith('urn:2aran:rss:')))
})
