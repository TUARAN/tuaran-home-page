import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  defaultHolidayJournal,
  HOLIDAY_JOURNAL_SETTING_KEY,
  normalizeHolidayJournal,
} from '../lib/holidayJournal.js'

test('默认生活记录包含 2026 国庆前两天和私密标记', () => {
  const journal = defaultHolidayJournal()
  const holiday = journal.holidays[0]
  assert.equal(HOLIDAY_JOURNAL_SETTING_KEY, 'private.holiday-journal')
  assert.equal(holiday.title, '2026 国庆')
  assert.equal(holiday.visibility, 'owner')
  assert.equal(holiday.days.length, 2)
  assert.match(holiday.days[0].note, /新疆杏干.*虫子.*1000/)
  assert.match(holiday.days[0].note, /小茉莉发烧.*喝了药/)
  assert.match(holiday.days[0].note, /推特/)
  assert.match(holiday.days[1].note, /二手茶几/)
  assert.match(holiday.days[1].note, /换尿片/)
})

test('生活记录规范化时强制 owner 可见并清理重复关键词', () => {
  const journal = normalizeHolidayJournal({
    holidays: [{
      id: 'demo',
      title: '测试假期',
      year: 2026,
      visibility: 'public',
      days: [{ id: 'day-1', keywords: ['散步', '散步', ''], note: '  一天  ' }],
    }],
  })
  assert.equal(journal.holidays[0].visibility, 'owner')
  assert.deepEqual(journal.holidays[0].days[0].keywords, ['散步'])
  assert.equal(journal.holidays[0].days[0].note, '一天')
})

test('生活记录页面和接口都使用后台私密边界', async () => {
  const [page, route, nav] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/life/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/holiday-journal/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../lib/adminRoutes.js', import.meta.url), 'utf8'),
  ])
  assert.match(page, /<AdminPageGate/)
  assert.match(page, /index: false/)
  assert.match(route, /getOwnerOrReject/)
  assert.match(route, /Cache-Control.*private, no-store/)
  assert.match(nav, /\/admin\/life/)
})
