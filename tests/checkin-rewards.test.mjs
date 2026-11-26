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
} from '../lib/automation/checkinRewards.js'

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

test('check-in is archived: nav shows Ranbi, old pages redirect and APIs return 410', async () => {
  const [headerSource, cssSource, nextConfig, checkinApi, publishingApi] = await Promise.all([
    readFile(new URL('../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    readFile(new URL('../next.config.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/points/checkin/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/publishing-checkins/route.js', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(headerSource, /site-nav-checkin-gift|checkedInToday|IconGift/)
  assert.doesNotMatch(cssSource, /checkin-/)
  assert.match(nextConfig, /source: '\/checkin', destination: '\/ranbi'/)
  assert.match(nextConfig, /source: '\/checkin\/:path\*', destination: '\/ranbi'/)
  for (const api of [checkinApi, publishingApi]) assert.match(api, /status: 410/)
})

test('gift shop seeds the signed Programmer Growth Notes reward', async () => {
  const migration = await readFile(new URL('../migrations/0107_seed_signed_programmer_growth_notes.sql', import.meta.url), 'utf8')

  assert.match(migration, /'programmer-growth-notes-signed'/)
  assert.match(migration, /'作者亲笔签名《程序员成长手记》'/)
  assert.match(migration, /\b200\b/)
  assert.match(migration, /'physical'/)
  assert.match(migration, /\n\s+-1,\n\s+1,\n\s+1,/)
})
