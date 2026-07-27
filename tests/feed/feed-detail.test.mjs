import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const FEED_CLIENT_PATH = new URL('../../app/(site)/feed/FeedClient.jsx', import.meta.url)
const FEED_DETAIL_PAGE_PATH = new URL('../../app/(site)/feed/[id]/page.jsx', import.meta.url)
const CONTENT_REGISTRY_PATH = new URL('../../lib/contentRegistry.js', import.meta.url)

test('feed detail uses a dedicated full-content mode', async () => {
  const [client, detailPage] = await Promise.all([
    readFile(FEED_CLIENT_PATH, 'utf8'),
    readFile(FEED_DETAIL_PAGE_PATH, 'utf8'),
  ])

  assert.match(detailPage, /featuredItemId=\{id\} detailMode/)
  assert.match(client, /Inspiration Detail · 灵感详情/)
  assert.match(client, /whitespace-pre-wrap/)
  assert.doesNotMatch(client, /createPortal/)
  assert.doesNotMatch(client, />\s*查看\s*</)
})

test('each feed item gets its own reading-stat key', async () => {
  const [client, registry] = await Promise.all([
    readFile(FEED_CLIENT_PATH, 'utf8'),
    readFile(CONTENT_REGISTRY_PATH, 'utf8'),
  ])

  assert.match(client, /ContentPvBeacon category="feed" slug=\{item\.id\} display/)
  assert.match(registry, /\.\.\.getAllFeedItems\(\)\.map/)
  assert.match(registry, /slug: item\.id/)
})
