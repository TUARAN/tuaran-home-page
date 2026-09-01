import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MIN_QUALIFIED_READING_MS,
  assessReadingHit,
} from '../../lib/readingAnalyticsQuality.mjs'

const valid = {
  host: '2aran.com',
  origin: 'https://2aran.com',
  secFetchSite: 'same-origin',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
  body: {
    signal: 'content_read_v2',
    engagedMs: MIN_QUALIFIED_READING_MS,
    visibilityState: 'visible',
  },
}

test('qualified reading requires an active same-origin browser signal', () => {
  assert.deepEqual(assessReadingHit(valid), {
    qualified: true,
    reason: 'qualified',
    engagedMs: MIN_QUALIFIED_READING_MS,
  })
})

test('crawler, cross-site and immediate requests are excluded', () => {
  assert.equal(assessReadingHit({ ...valid, userAgent: 'Googlebot/2.1' }).reason, 'automated_user_agent')
  assert.equal(assessReadingHit({ ...valid, origin: 'https://example.com' }).reason, 'origin_mismatch')
  assert.equal(assessReadingHit({
    ...valid,
    body: { ...valid.body, engagedMs: MIN_QUALIFIED_READING_MS - 1 },
  }).reason, 'insufficient_engagement')
})
