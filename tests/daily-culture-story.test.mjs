import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  buildCultureStoryMessages,
  cultureStoryCategory,
  cultureStoryLastRunKey,
  normalizeCultureStorySlot,
} from '../lib/dailyCultureStory.js'

const SLOTS = ['culture_morning', 'culture_afternoon', 'culture_evening']

test('culture story slots are strict and use independent idempotency keys', () => {
  assert.equal(normalizeCultureStorySlot('culture_morning'), 'culture_morning')
  assert.equal(normalizeCultureStorySlot('morning'), '')
  assert.notEqual(cultureStoryLastRunKey('culture_morning'), cultureStoryLastRunKey('culture_evening'))
})

test('five-day cycle keeps the requested 40/40/20 content ratio', () => {
  const counts = { guoxue: 0, chinese_story: 0, foreign_fable: 0 }
  for (let day = 1; day <= 5; day += 1) {
    const now = new Date(`2026-08-${String(day).padStart(2, '0')}T04:00:00Z`)
    for (const slot of SLOTS) counts[cultureStoryCategory({ slot, now })] += 1
  }
  assert.deepEqual(counts, { guoxue: 6, chinese_story: 6, foreign_fable: 3 })
})

test('culture story prompt asks for a clear sourced X-length story', () => {
  const messages = buildCultureStoryMessages({
    slot: 'culture_afternoon',
    now: new Date('2026-08-05T08:00:00Z'),
  })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /105—130 个汉字/)
  assert.match(messages[0].content, /加权长度必须不超过 280/)
  assert.match(messages[0].content, /故事或观念.*点明道理/s)
  assert.match(messages[1].content, /国学哲思 40%.*中华寓言或历史小故事 40%.*国外童话或寓言 20%/s)
})

test('workflow schedules all three culture story slots with retries', async () => {
  const [workflow, route] = await Promise.all([
    readFile(new URL('../.github/workflows/morning-greeting.yml', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/distribution/x/greeting/route.js', import.meta.url), 'utf8'),
  ])
  assert.match(workflow, /'0,20,40 2 \* \* \*'/)
  assert.match(workflow, /'0,20,40 8 \* \* \*'/)
  assert.match(workflow, /'0,20,40 12 \* \* \*'/)
  assert.match(workflow, /QUERY="story=\$PERIOD"/)
  assert.match(route, /buildCultureStoryMessages/)
  assert.match(route, /const contentType = isCultureStory \? 'culture-story'/)
})
