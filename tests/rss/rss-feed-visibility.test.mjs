import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  isPublishedRssRow,
  listPublishedRssFeeds,
} from '../../lib/rssFeedVisibility.js'

const rows = [
  {
    id: 'published',
    site_name: '已上架',
    site_url: 'https://example.com',
    rss_url: 'https://example.com/feed.xml',
    description: '公开条目',
    category: '测试',
    published: 1,
    sort_order: 100,
    created_at: 10,
  },
  {
    id: 'unpublished-seed',
    site_name: '已下架的内置种子',
    rss_url: 'https://seed.example.com/feed.xml',
    published: 0,
    sort_order: 90,
    created_at: 20,
  },
]

test('only published D1 rows are exposed publicly', () => {
  const feeds = listPublishedRssFeeds(rows)

  assert.deepEqual(feeds.map((feed) => feed.id), ['published'])
  assert.equal(feeds[0].siteName, '已上架')
  assert.equal(feeds[0].sortOrder, 100)
})

test('an empty or fully unpublished database stays empty', () => {
  assert.deepEqual(listPublishedRssFeeds([]), [])
  assert.deepEqual(listPublishedRssFeeds(rows.slice(1)), [])
})

test('published state is normalized instead of relying on truthiness', () => {
  assert.equal(isPublishedRssRow({ published: 1 }), true)
  assert.equal(isPublishedRssRow({ published: '1' }), true)
  assert.equal(isPublishedRssRow({ published: 0 }), false)
  assert.equal(isPublishedRssRow({ published: '0' }), false)
})

test('public API and client preserve an authoritative empty D1 result', async () => {
  const routeSource = await readFile(
    new URL('../../app/api/rss-feeds/route.js', import.meta.url),
    'utf8',
  )
  const clientSource = await readFile(
    new URL('../../app/(site)/resources/rss/RssBlogroll.jsx', import.meta.url),
    'utf8',
  )

  assert.match(routeSource, /SELECT \* FROM rss_feeds ORDER BY/)
  assert.match(routeSource, /feeds:?\s*,/)
  assert.doesNotMatch(routeSource, /mergedFeeds\.length/)
  assert.match(clientSource, /Array\.isArray\(d\?\.feeds\)\) setFeeds\(d\.feeds\)/)
  assert.doesNotMatch(clientSource, /d\.feeds\.length\) setFeeds/)
})
