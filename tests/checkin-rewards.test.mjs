import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  buildCheckinWeek,
  canMakeupCheckin,
  calculateCheckinStreak,
  checkinDayKey,
  nextCheckinMilestone,
  rewardForStreak,
} from '../lib/checkinRewards.js'

test('check-in day switches at China Standard Time midnight', () => {
  assert.equal(checkinDayKey(Date.parse('2026-09-29T15:59:59Z')), '2026-09-29')
  assert.equal(checkinDayKey(Date.parse('2026-09-29T16:00:00Z')), '2026-09-30')
})

test('streak counts backwards from today and stops at a gap', () => {
  assert.equal(calculateCheckinStreak(['2026-09-29', '2026-09-28', '2026-09-27'], '2026-09-29'), 3)
  assert.equal(calculateCheckinStreak(['2026-09-29', '2026-09-27'], '2026-09-29'), 1)
})

test('three-day and seven-day milestones repeat in weekly cycles', () => {
  assert.deepEqual(rewardForStreak(3), { cycleDay: 3, bonus: 5 })
  assert.deepEqual(rewardForStreak(7), { cycleDay: 7, bonus: 15 })
  assert.deepEqual(rewardForStreak(10), { cycleDay: 3, bonus: 5 })
  assert.deepEqual(nextCheckinMilestone(3), { day: 7, remaining: 4, bonus: 15 })
})

test('week view includes today and checked state', () => {
  const week = buildCheckinWeek(['2026-09-28', '2026-09-29'], '2026-09-29')
  assert.equal(week.length, 7)
  assert.deepEqual(week.at(-1), { day: '2026-09-29', checked: true, today: true })
})

test('make-up is limited to the previous six calendar days', () => {
  assert.equal(canMakeupCheckin('2026-09-28', '2026-09-29'), true)
  assert.equal(canMakeupCheckin('2026-09-23', '2026-09-29'), true)
  assert.equal(canMakeupCheckin('2026-09-22', '2026-09-29'), false)
  assert.equal(canMakeupCheckin('2026-09-29', '2026-09-29'), false)
  assert.equal(canMakeupCheckin('2026-09-30', '2026-09-29'), false)
})

test('make-up card is seeded as a live digital reward with its own ledger', async () => {
  const migration = await readFile(new URL('../migrations/0106_checkin_makeup_cards.sql', import.meta.url), 'utf8')
  assert.match(migration, /checkin_makeup_card_ledger/)
  assert.match(migration, /checkin_makeups/)
  assert.match(migration, /'checkin-makeup-card'/)
  assert.match(migration, /'30',?\s*'digital'|30, 'digital'/)
})

test('check-in entry shares session state and keeps an accessible animated gift control', async () => {
  const [headerSource, circlesSource, topicSource, pageSource, providerSource, cssSource] = await Promise.all([
    readFile(new URL('../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/circles/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/circles/CircleTopicPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/checkin/CheckinRewardsClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/components/SessionProvider.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ])
  assert.match(headerSource, /site-nav-checkin-gift/)
  assert.match(headerSource, /account\.points\?\.checkedInToday/)
  assert.doesNotMatch(circlesSource, /CheckinGiftEntry|community-checkin-entry/)
  assert.doesNotMatch(topicSource, /CheckinGiftEntry|circle-topic-checkin-entry/)
  assert.match(pageSource, /account\.refreshPoints\(\)/)
  assert.match(providerSource, /refreshPoints/)
  assert.match(cssSource, /@keyframes checkin-gift-rock/)
  assert.match(cssSource, /prefers-reduced-motion: reduce/)
  assert.match(cssSource, /\.site-nav-checkin-gift\s*\{[\s\S]*?color:\s*#237052;/)
  assert.doesNotMatch(headerSource, /site-nav-checkin-gift.*is-checked/)
})
