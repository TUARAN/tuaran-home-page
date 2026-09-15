import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [page, discovery, styles] = await Promise.all([
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomeDiscoveryPanel.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
])

test('WorkBuddy does not occupy a separate homepage row', () => {
  assert.doesNotMatch(page, /WorkBuddyEntry|home-workbuddy-entry/)
  assert.doesNotMatch(styles, /home-workbuddy-/)
})

test('WorkBuddy stays in homepage discovery and keeps its tracked external link', () => {
  assert.equal(discovery.match(/https:\/\/workbuddy\.2aran\.com\//g)?.length, 1)
  assert.match(discovery, /external: true, analyticsId: 'workbuddy'/)
  assert.match(discovery, /data-analytics-destination-id=\{item.analyticsId\}/)
  assert.match(discovery, /rel="noopener noreferrer"/)
})

test('Blogger Alliance promotion entry appears in homepage discovery', () => {
  assert.equal(discovery.match(/https:\/\/blogger-alliance\.cn\//g)?.length, 1)
  assert.match(discovery, /label: '合作推广与博主联盟'/)
  assert.match(discovery, /hint: '合作'/)
  assert.match(discovery, /external: true, analyticsId: 'blogger-alliance'/)
})

test('homepage discovery links live in a quiet sidebar panel instead of a ticker', () => {
  assert.doesNotMatch(styles, /hot-ticker-marquee/)
  assert.doesNotMatch(page, /HotTickerBar/)
  assert.match(page, /<HomeDiscoveryPanel \/>/)
  assert.match(discovery, /<details className="home-discovery-more">/)
  assert.match(discovery, /DISCOVERY_ITEMS\.slice\(0, 4\)/)
})
