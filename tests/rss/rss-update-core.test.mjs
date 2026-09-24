import assert from 'node:assert/strict'
import test from 'node:test'

import { parseFeed } from '../../lib/rssFeedParse.js'
import {
  parseRssArticleKey,
  rssArticleKey,
  rssUpdateHref,
  selectNewRssEntries,
  shouldNotifyRssFeed,
} from '../../lib/rssUpdateCore.js'

const SAMPLE_RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>New post</title>
      <link>https://example.com/new</link>
      <guid>https://example.com/new</guid>
      <pubDate>Sun, 20 Sep 2026 01:00:00 GMT</pubDate>
      <description>Hello world</description>
    </item>
    <item>
      <title>Old post</title>
      <link>https://example.com/old</link>
      <guid>https://example.com/old</guid>
      <pubDate>Fri, 01 Aug 2026 01:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

test('parseFeed keeps title, guid, date and a short summary', () => {
  const entries = parseFeed(SAMPLE_RSS)
  assert.equal(entries.length, 2)
  assert.equal(entries[0].title, 'New post')
  assert.equal(entries[0].guid, 'https://example.com/new')
  assert.equal(entries[0].date, '2026-09-20')
  assert.match(entries[0].summary, /Hello world/)
})

test('first poll only notifies recent unseen items', () => {
  const entries = parseFeed(SAMPLE_RSS)
  const now = Date.parse('2026-09-20T10:00:00Z')
  const selected = selectNewRssEntries(entries, null, { now })
  assert.equal(selected.isFirst, true)
  assert.deepEqual(selected.notify.map((entry) => entry.guid), ['https://example.com/new'])
  assert.equal(selected.nextCursor.lastGuid, 'https://example.com/new')
})

test('later polls notify unseen items until the cursor', () => {
  const entries = parseFeed(SAMPLE_RSS)
  const selected = selectNewRssEntries(entries, {
    lastGuid: 'https://example.com/old',
    seenGuids: ['https://example.com/old'],
  })
  assert.equal(selected.isFirst, false)
  assert.deepEqual(selected.notify.map((entry) => entry.guid), ['https://example.com/new'])
})

test('notification keys and hrefs stay stable', () => {
  assert.equal(rssArticleKey('v2ex-newsletter', 'https://info.v2ex.pro/abc'), 'rss:v2ex-newsletter:https://info.v2ex.pro/abc')
  assert.deepEqual(parseRssArticleKey('rss:v2ex-newsletter:https://info.v2ex.pro/abc'), {
    feedId: 'v2ex-newsletter',
    guid: 'https://info.v2ex.pro/abc',
  })
  assert.equal(rssUpdateHref('v2ex-newsletter'), '/crypto-research/rss?feed=v2ex-newsletter')
  assert.equal(
    rssUpdateHref('v2ex-newsletter', 'https://info.v2ex.pro/abc?a=1'),
    '/crypto-research/rss?feed=v2ex-newsletter&entry=https%3A%2F%2Finfo.v2ex.pro%2Fabc%3Fa%3D1',
  )
  assert.equal(shouldNotifyRssFeed('tuaran-home'), false)
  assert.equal(shouldNotifyRssFeed('v2ex-newsletter'), true)
})
