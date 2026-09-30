import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPublicOpinionTimelineDays } from '../lib/publicOpinionData.js'

test('舆情时间线按北京时间分日，并明确标记今天和昨天', () => {
  const days = buildPublicOpinionTimelineDays([
    { id: 'older', publishedAt: '2026-09-29T15:53:00.000Z' },
    { id: 'latest', publishedAt: '2026-09-29T16:05:00.000Z' },
    { id: 'earlier', publishedAt: '2026-09-29T15:45:00.000Z' },
  ], '2026-09-29T16:30:00.000Z')

  assert.equal(days.length, 2)
  assert.deepEqual(days.map((day) => day.dayKey), ['2026-09-30', '2026-09-29'])
  assert.deepEqual(days.map((day) => day.relativeLabel), ['今天', '昨天'])
  assert.deepEqual(days.map((day) => day.posts.map((post) => post.id)), [['latest'], ['older', 'earlier']])
})

test('跨日后的时间不会继续画在同一个日期分组里', () => {
  const days = buildPublicOpinionTimelineDays([
    { id: 'midnight', publishedAt: '2026-09-29T16:05:00.000Z' },
    { id: 'before-midnight', publishedAt: '2026-09-29T15:53:00.000Z' },
  ], '2026-09-29T16:30:00.000Z')

  assert.equal(days[0].dateLabel, '9月30日')
  assert.equal(days[0].posts[0].id, 'midnight')
  assert.equal(days[1].dateLabel, '9月29日')
  assert.equal(days[1].posts[0].id, 'before-midnight')
})
