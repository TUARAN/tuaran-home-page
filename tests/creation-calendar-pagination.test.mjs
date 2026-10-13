import assert from 'node:assert/strict'
import test from 'node:test'

import { calendarPage, selectCreationCalendarItems } from '../lib/article/creationCalendar.js'

const items = Array.from({ length: 30 }, (_, index) => ({
  date: `2026-10-${String(index + 1).padStart(2, '0')}`,
  title: `文章 ${index + 1}`,
}))

test('calendar returns one page at a time in reverse date order', () => {
  const selected = selectCreationCalendarItems(items, { year: '2026' })
  assert.equal(selected.length, 30)
  assert.equal(calendarPage(selected, 1).length, 24)
  assert.equal(calendarPage(selected, 1)[0].date, '2026-10-30')
  assert.equal(calendarPage(selected, 2).length, 6)
  assert.equal(calendarPage(selected, 2)[0].date, '2026-10-06')
})

test('calendar pagination follows year, month and date filters', () => {
  assert.equal(selectCreationCalendarItems(items, { year: '2026', month: '09' }).length, 0)
  assert.deepEqual(selectCreationCalendarItems(items, { year: '2026', month: '10', date: '2026-10-12' }).map((item) => item.title), ['文章 12'])
  assert.equal(selectCreationCalendarItems(items, { year: '2019' })[0].date, '2019-03-11')
})
