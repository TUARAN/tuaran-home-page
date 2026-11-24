import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { gitDailyTopDays } from '../../lib/interaction/dailyTop/gitCatalog.js'
import { loadDailyTopDays } from '../../lib/interaction/dailyTop/load.js'
import { loadCombinedDailyTopDays, mergeDailyTopDays } from '../../lib/interaction/dailyTop/store.js'
import {
  DAILY_TOP_SAMPLE_DATE,
  emptyStateCopy,
  expectedWindow,
  isIsoDate,
  monthMatrix,
  profileUrlFor,
  latestRecordedDate,
  legacyPublicationWindow,
  resolveCalendarSelectedDate,
  resolveSelectedDate,
  shanghaiDateKey,
  validateDailyTopDay,
} from '../../lib/interaction/dailyTop/model.js'

const SAMPLE = [
  ['VicentYip', '如是我闻', 29, '我回复 29'],
  ['xiaqingfeng666', '夏清风（浇朋友）', 29, '我回复 29'],
  ['AlanShao111', '邵艾伦Alan（薄肌版）', 23, '我回复 23'],
  ['JMkernt', 'jimerrors', 22, '对方 1 · 我 21'],
  ['DISONYYDS', 'Dison', 20, '我回复 20'],
  ['fngmn134813', '梦泪', 19, '对方 6 · 我 13'],
  ['daniel_w_zj', 'Kim_King（有评必回）', 18, '对方 9 · 我 9'],
  ['ynggu2548245', '每日打卡', 16, '对方 8 · 我 8'],
  ['DearYoung28', '我是你牛爷爷', 14, '对方 5 · 我 9'],
  ['grok', 'Grok', 14, '我提及 14'],
]

test('sample day 2026-11-05 matches the shipped top 10', () => {
  const days = loadDailyTopDays()
  const day = days.find((entry) => entry.date === DAILY_TOP_SAMPLE_DATE)
  assert.ok(day)
  assert.deepEqual(days.map((entry) => entry.date), ['2026-11-05', '2026-11-10', '2026-11-11'])
  assert.deepEqual(gitDailyTopDays(), days)
  assert.deepEqual(day.window, legacyPublicationWindow('2026-11-05'))
  assert.equal(day.opponents, 420)
  assert.equal(day.events, 1386)
  assert.equal(day.subject, 'tarsixseveneig1')
  assert.deepEqual(
    day.top.map((row) => [row.rank, row.handle, row.displayName, row.count, row.breakdown, row.profileUrl]),
    SAMPLE.map(([handle, displayName, count, breakdown], index) => [
      index + 1,
      handle,
      displayName,
      count,
      breakdown,
      profileUrlFor(handle),
    ]),
  )
  assert.equal(day.top.some((row) => row.handle.toLowerCase() === 'tarsixseveneig1'), false)
})

test('invalid query falls back to today when no day catalog is provided', () => {
  assert.equal(resolveSelectedDate(null, '2026-11-05'), '2026-11-05')
  assert.equal(resolveSelectedDate('not-a-date', '2026-11-05'), '2026-11-05')
  assert.equal(resolveSelectedDate('2026-02-31', '2026-11-05'), '2026-11-05')
  assert.equal(resolveSelectedDate('2026-11-04', '2026-11-05'), '2026-11-04')
  assert.equal(emptyStateCopy('2026-11-07', ['2026-11-05']), '这一天还没有收录互动前十。2026-11-05 已有样例，可改选这一天。')
  assert.equal(emptyStateCopy('2026-11-05', ['2026-11-05']), '这一天还没有收录互动前十。')
})

test('calendar default day is yesterday in Shanghai, even when today or a newer file exists', () => {
  assert.equal(resolveCalendarSelectedDate(null, '2026-11-11'), '2026-11-10')
  assert.equal(resolveCalendarSelectedDate(null, '2026-11-07'), '2026-11-06')
  assert.equal(resolveCalendarSelectedDate(undefined, '2026-11-13'), '2026-11-12')
  assert.equal(resolveCalendarSelectedDate('not-a-date', '2026-11-07'), '2026-11-06')
  assert.equal(resolveCalendarSelectedDate('2026-11-05', '2026-11-11'), '2026-11-05')
  assert.equal(resolveCalendarSelectedDate(null, '2026-11-05'), '2026-11-04')
})

test('API default day is today when that JSON exists, otherwise the latest day file', () => {
  const shipped = loadDailyTopDays().map((day) => day.date)
  assert.deepEqual(shipped, ['2026-11-05', '2026-11-10', '2026-11-11'])
  assert.equal(latestRecordedDate(shipped), '2026-11-11')
  assert.equal(resolveSelectedDate(null, '2026-11-07', shipped), '2026-11-11')
  assert.equal(resolveSelectedDate(undefined, '2026-11-13', shipped), '2026-11-11')
  assert.equal(resolveSelectedDate(null, '2026-11-10', shipped), '2026-11-10')
  assert.equal(resolveSelectedDate(null, '2026-11-11', shipped), '2026-11-11')
  assert.equal(resolveSelectedDate('not-a-date', '2026-11-07', ['2026-11-01', '2026-11-05']), '2026-11-05')
  assert.equal(resolveSelectedDate(null, '2026-11-05', shipped), '2026-11-05')
  assert.equal(resolveSelectedDate(null, '2026-11-05', ['2026-11-04', '2026-11-05']), '2026-11-05')
  assert.equal(resolveSelectedDate(null, '2026-11-07', ['2026-11-04', '2026-11-05']), '2026-11-05')
  assert.equal(resolveSelectedDate('2026-11-05', '2026-11-05', shipped), '2026-11-05')
  assert.equal(resolveSelectedDate(null, '2026-11-05', []), '2026-11-05')
})

test('Shanghai date key follows the Asia/Shanghai calendar date', () => {
  assert.equal(shanghaiDateKey(new Date('2026-11-05T12:59:00Z')), '2026-11-05')
  assert.equal(shanghaiDateKey(new Date('2026-11-05T16:00:00Z')), '2026-11-06')
  assert.equal(isIsoDate('2026-11-05'), true)
  const november = monthMatrix('2026-11')
  assert.equal(november[0], null)
  assert.equal(november[6], '2026-11-01')
  assert.equal(november[35], '2026-11-30')
  assert.equal(november.length % 7, 0)
})

test('validator rejects a self-account and a window outside the publication day', () => {
  const day = loadDailyTopDays()[0]
  assert.throws(() => validateDailyTopDay({
    ...day,
    top: [{ ...day.top[0], handle: 'tarsixseveneig1', rank: 1 }],
  }, '2026-11-05.json'), /本人账号/)
  assert.throws(() => validateDailyTopDay({
    ...day,
    window: { start: '2026-11-04T00:00:00+08:00', end: '2026-11-04T21:00:00+08:00' },
  }, '2026-11-05.json'), /window/)
  assert.deepEqual(validateDailyTopDay({
    ...day,
    window: expectedWindow('2026-11-05'),
    top: day.top.map(({ rank, handle, displayName, count, breakdown }) => ({ rank, handle, displayName, count, breakdown })),
  }, '2026-11-05.json').window, expectedWindow('2026-11-05'))
})

test('theory page keeps the body and drops the three entry cards', async () => {
  const page = await readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(page, /查看智能体与获取方式|走进圆桌会场|打开日历|大互动 · 圆桌大会/)
  assert.match(page, /href="https:\/\/x\.2aran\.com\/docs#daily-volume"/)
  assert.match(page, /ChapterNav/)
})

test('calendar page renders the five ranking columns and an empty state', async () => {
  const [page, view] = await Promise.all([
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/InteractionCalendar.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(page, /const canonicalUrl = 'https:\/\/x\.2aran\.com\/calendar'/)
  assert.match(page, /公开地址 <a href=\{path\}>\{canonicalUrl\}<\/a>/)
  assert.match(page, /canonical: path/)
  assert.match(page, /application\/ld\+json/)
  assert.match(view, /排名/)
  assert.match(view, /账号/)
  assert.match(view, /互动次数/)
  assert.match(view, /构成简述/)
  assert.match(view, /主页链接/)
  assert.match(view, /emptyStateCopy\(selected, topDates\)/)
  assert.doesNotMatch(view, /recordedList|已收录/)
  assert.match(view, /智能体账号/)
  assert.match(view, /activityDates/)
  assert.match(page, /loadOwnActivityDaysForPool/)
  assert.match(page, /interactionAgentHandles/)
  assert.match(view, /resolveCalendarSelectedDate\(null, initialToday\)/)
  assert.match(view, /resolveCalendarSelectedDate\(query, liveToday\)/)
  assert.match(view, /function choose\(date\)/)
  assert.match(view, /x\.com\/\{row\.handle\}/)
  assert.doesNotMatch(view, /错误|加载失败/)
  assert.match(page, /loadCombinedDailyTopDays/)
  assert.match(page, /runtime = 'edge'/)
  assert.match(page, /dynamic = 'force-dynamic'/)
  assert.doesNotMatch(page, /dailyTop\/load/)
})

test('calendar day list lets a live record replace the same git date', async () => {
  const gitDays = loadDailyTopDays()
  const live = { ...gitDays[0], events: 9, opponents: 3 }
  const merged = mergeDailyTopDays(gitDays, [live])
  assert.equal(merged.find((day) => day.date === '2026-11-05').events, 9)
  assert.equal(merged.find((day) => day.date === '2026-11-11').events, 749)
  assert.deepEqual(merged.map((day) => day.date), ['2026-11-05', '2026-11-10', '2026-11-11'])

  const objects = new Map()
  const bucket = {
    async get(key) {
      const text = objects.get(key)
      return text == null ? null : { text: async () => text }
    },
    async put() {},
    async list() {
      return { objects: [...objects.keys()].map((key) => ({ key })), truncated: false }
    },
  }
  objects.set('interaction/daily-top/2026-11-13.json', JSON.stringify({
    ...gitDays[2],
    date: '2026-11-13',
    window: expectedWindow('2026-11-13'),
    top: gitDays[2].top.map(({ rank, handle, displayName, count, breakdown }) => ({ rank, handle, displayName, count, breakdown })),
  }))
  const combined = await loadCombinedDailyTopDays(bucket)
  assert.deepEqual(combined.map((day) => day.date), ['2026-11-05', '2026-11-10', '2026-11-11', '2026-11-13'])
  assert.equal(combined.at(-1).top[0].profileUrl, profileUrlFor('grok'))
  assert.deepEqual(combined.at(-1).window, expectedWindow('2026-11-13'))
})
