import assert from 'node:assert/strict'
import test from 'node:test'

import {
  REQUIRED_PUBLISHING_KEYS,
  calculatePublishingStreak,
  groupPublishingRecords,
  isPublishingDayComplete,
  isPublishingDayKey,
  isPublishingMonthKey,
  publishingMonthRange,
} from '../lib/publishingCheckins.js'

function completeDay(day) {
  return REQUIRED_PUBLISHING_KEYS.map((platform) => ({ checkinDate: day, platform, postUrl: '' }))
}

test('publishing date and month keys are strict calendar values', () => {
  assert.equal(isPublishingDayKey('2026-09-30'), true)
  assert.equal(isPublishingDayKey('2026-02-30'), false)
  assert.equal(isPublishingMonthKey('2026-09'), true)
  assert.equal(isPublishingMonthKey('2026-13'), false)
  assert.deepEqual(publishingMonthRange('2028-02'), { start: '2028-02-01', end: '2028-02-29' })
})

test('a publishing day is complete only after all four required platforms', () => {
  const grouped = groupPublishingRecords(completeDay('2026-09-30'))
  assert.equal(isPublishingDayComplete(grouped['2026-09-30']), true)
  delete grouped['2026-09-30'].csdn
  grouped['2026-09-30'].zhihu = { platform: 'zhihu', postUrl: '' }
  assert.equal(isPublishingDayComplete(grouped['2026-09-30']), false)
})

test('publishing streak preserves yesterday when today is not complete', () => {
  const records = [
    ...completeDay('2026-09-29'),
    ...completeDay('2026-09-28'),
    ...completeDay('2026-09-26'),
  ]
  assert.equal(calculatePublishingStreak(records, '2026-09-30'), 2)
  assert.equal(calculatePublishingStreak([...records, ...completeDay('2026-09-30')], '2026-09-30'), 3)
})
