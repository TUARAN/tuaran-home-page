import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  X_US_AUDIENCE_SLOTS,
  buildXUsAudienceLengthRepairMessages,
  buildXUsAudienceMessages,
  normalizeXUsAudienceSlot,
  xUsAudienceLastRunKey,
} from '../lib/xUsAudiencePosts.js'

test('three US audience slots cover the Beijing overnight gap with independent keys', () => {
  assert.deepEqual(Object.keys(X_US_AUDIENCE_SLOTS), ['us_morning', 'us_midday', 'us_evening'])
  assert.deepEqual(Object.values(X_US_AUDIENCE_SLOTS).map((item) => item.time), ['23:00', '03:00', '07:00'])
  assert.equal(normalizeXUsAudienceSlot('us_midday'), 'us_midday')
  assert.equal(normalizeXUsAudienceSlot('unknown'), '')
  assert.notEqual(xUsAudienceLastRunKey('us_morning'), xUsAudienceLastRunKey('us_evening'))
})

test('overlong US copy is repaired in English', () => {
  const messages = buildXUsAudienceLengthRepairMessages({ text: 'A useful English post.' })
  assert.match(messages[0].content, /English post/)
  assert.match(messages[0].content, /natural American-English voice/)
  assert.match(messages[0].content, /within 240 weighted characters/)
  assert.match(messages[1].content, /Original post:/)
})

test('US audience prompt requires natural English and grounded builder content', () => {
  for (const slot of Object.keys(X_US_AUDIENCE_SLOTS)) {
    const messages = buildXUsAudienceMessages({ slot, now: new Date('2026-08-27T15:00:00Z') })
    assert.equal(messages.length, 2)
    assert.match(messages[0].content, /natural American English/)
    assert.match(messages[0].content, /builders, developers, AI users, indie makers/)
    assert.match(messages[0].content, /Do not invent personal credentials/)
    assert.match(messages[0].content, /never exceed X’s 280 weighted-character limit/)
    assert.match(messages[1].content, new RegExp(X_US_AUDIENCE_SLOTS[slot].audienceTime.replaceAll('/', '\\/')))
  }
})

test('workflow schedules all three US English slots with retries', async () => {
  const [workflow, route] = await Promise.all([
    readFile(new URL('../.github/workflows/morning-greeting.yml', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/distribution/x/greeting/route.js', import.meta.url), 'utf8'),
  ])
  assert.match(workflow, /node scripts\/run-x-auto-posts.mjs/)
  assert.match(route, /buildXUsAudienceMessages/)
  assert.match(route, /contentType = .*'us-english'/)
})
