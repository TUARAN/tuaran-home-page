import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  buildCheckinWeek,
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

test('check-in entry shares session state and keeps an accessible animated gift control', async () => {
  const [entrySource, pageSource, providerSource, cssSource] = await Promise.all([
    readFile(new URL('../app/(site)/components/CheckinGiftEntry.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/checkin/CheckinRewardsClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/components/SessionProvider.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ])
  assert.match(entrySource, /useSessionAccount/)
  assert.match(entrySource, /aria-label=/)
  assert.doesNotMatch(entrySource, /fetch\('\/api\/points\/me'/)
  assert.match(pageSource, /account\.refreshPoints\(\)/)
  assert.match(providerSource, /refreshPoints/)
  assert.match(cssSource, /@keyframes checkin-gift-rock/)
  assert.match(cssSource, /prefers-reduced-motion: reduce/)
})
