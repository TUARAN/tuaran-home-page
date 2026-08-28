import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [page, ticker, styles] = await Promise.all([
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HotTickerBar.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
])

test('WorkBuddy does not occupy a separate homepage row', () => {
  assert.doesNotMatch(page, /WorkBuddyEntry|home-workbuddy-entry/)
  assert.doesNotMatch(styles, /home-workbuddy-/)
})

test('WorkBuddy shares the existing ticker and keeps its tracked external link', () => {
  assert.equal(ticker.match(/https:\/\/workbuddy\.2aran\.com\//g)?.length, 1)
  assert.match(ticker, /external: true, analyticsId: 'workbuddy'/)
  assert.match(ticker, /data-analytics-destination-id=\{item.analyticsId\}/)
  assert.match(ticker, /rel="noopener noreferrer"/)
})
