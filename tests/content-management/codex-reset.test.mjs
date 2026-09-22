import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  FALLBACK_SNAPSHOT,
  buildMonthGrid,
  calendarDateForEvent,
  eventKind,
  homeCardModel,
  homeStripHeadline,
  homeStripSubline,
  monthStats,
  newestPostOnDate,
  parseCodexResetsPayload,
  pickFeaturedEvent,
  shiftYearMonth,
} from '../../lib/codexResets.js'
import { ENGINEERING_WORKS } from '../../lib/engineeringWorks.js'
import { TOOL_ITEMS } from '../../lib/toolItems.js'

const FIXTURE = {
  schemaVersion: 1,
  timezone: 'Asia/Shanghai',
  checkedAt: '2026-09-22T10:00:00.000+08:00',
  historyFrom: '2026-06-12T00:00:00.000+08:00',
  events: [
    {
      id: 'credit-preview',
      type: 'reset_credit',
      label: '发重置卡',
      status: 'announced',
      title: 'Tibo 预告发放重置卡',
      scope: '',
      createdAt: '2026-09-20T00:48:38.000+08:00',
      updatedAt: '2026-09-20T00:48:38.000+08:00',
      confirmedAt: null,
      occurredOn: null,
      confirmationBasis: null,
      schedule: {
        precision: 'date',
        from: '2026-09-22T15:00:00.000+08:00',
        through: '2026-09-23T15:00:00.000+08:00',
        label: '北京时间预计 9月22日 15:00–9月23日 15:00',
      },
      posts: [{
        id: '1',
        publishedAt: '2026-09-20T00:48:38.000+08:00',
        stage: '发卡预告',
        text: '好吧。但它也仍然会在周二到来。',
        originalText: 'OK fine.',
        url: 'https://x.com/thsottiaux/status/1',
      }],
      url: 'https://aihot.news/codex-reset',
    },
    {
      id: 'reset-confirmed',
      type: 'direct_reset',
      label: '全员重置',
      status: 'confirmed',
      title: 'Codex 额度重置已完成',
      scope: '',
      createdAt: '2026-09-12T11:20:36.000+08:00',
      updatedAt: '2026-09-12T16:09:17.000+08:00',
      confirmedAt: '2026-09-12T16:09:17.000+08:00',
      occurredOn: null,
      confirmationBasis: 'source_post',
      schedule: {
        precision: 'deadline',
        from: '2026-09-12T15:00:00.000+08:00',
        through: '2026-09-12T15:00:00.000+08:00',
        label: '北京时间预计 9月12日 15:00 前',
      },
      posts: [{
        id: '2',
        publishedAt: '2026-09-12T16:09:17.000+08:00',
        stage: '确认完成',
        text: '重置已全部推送完成。',
        originalText: 'Reset all propagated.',
        url: 'https://x.com/thsottiaux/status/2',
      }],
      url: 'https://aihot.news/codex-reset',
    },
  ],
}

test('calendar dates prefer occurredOn, then schedule start, then confirmation', () => {
  assert.equal(calendarDateForEvent({ occurredOn: '2026-09-05', schedule: { from: '2026-09-04T10:00:00.000+08:00' } }), '2026-09-05')
  assert.equal(calendarDateForEvent({
    status: 'announced',
    schedule: { from: '2026-09-22T15:00:00.000+08:00', through: '2026-09-23T15:00:00.000+08:00' },
    createdAt: '2026-09-20T00:48:38.000+08:00',
  }), '2026-09-22')
  assert.equal(calendarDateForEvent({
    confirmedAt: '2026-09-12T16:09:17.000+08:00',
    createdAt: '2026-09-12T11:20:36.000+08:00',
  }), '2026-09-12')
})

test('announced events stay previews even when the type is a reset credit', () => {
  assert.equal(eventKind({ type: 'reset_credit', status: 'announced' }), 'preview')
  assert.equal(eventKind({ type: 'reset_credit', status: 'confirmed' }), 'credit')
  assert.equal(eventKind({ type: 'direct_reset', status: 'confirmed' }), 'reset')
})

test('September fallback snapshot matches the public calendar counts', () => {
  const stats = monthStats(FALLBACK_SNAPSHOT.events, '2026-09')
  assert.deepEqual(stats, { reset: 2, credit: 3, preview: 1 })
  const featured = pickFeaturedEvent(FALLBACK_SNAPSHOT.events, '2026-09-22')
  assert.equal(featured.id, 'banked-2101352781219258527-1-1')
  const card = homeCardModel(FALLBACK_SNAPSHOT, '2026-09-22')
  assert.equal(card.date, '2026-09-22')
  assert.equal(card.kicker, '发卡预告')
  assert.match(card.quote, /周二/)
})

test('month grid starts on Monday and can step across years', () => {
  const cells = buildMonthGrid('2026-09')
  assert.equal(cells[0].date, '2026-08-31')
  assert.equal(cells.find((cell) => cell.date === '2026-09-01')?.inMonth, true)
  assert.equal(shiftYearMonth('2026-01', -1), '2025-12')
})

test('parser drops malformed events and keeps trusted post URLs', () => {
  const parsed = parseCodexResetsPayload({
    ...FIXTURE,
    events: [
      ...FIXTURE.events,
      { id: 'bad', type: 'unknown', status: 'announced', posts: [] },
      {
        id: 'no-https',
        type: 'direct_reset',
        status: 'confirmed',
        title: 'x',
        createdAt: '2026-09-01T00:00:00.000+08:00',
        posts: [{ id: 'x', publishedAt: '2026-09-01T00:00:00.000+08:00', stage: '预告', text: 'x', originalText: 'x', url: 'http://example.com' }],
      },
    ],
  })
  assert.equal(parsed.events.length, 3)
  assert.equal(parsed.events.at(-1).posts.length, 0)
  assert.equal(parseCodexResetsPayload({ schemaVersion: 2, events: [] }), null)
})

test('home strip copy dedupes date and keeps one time window', () => {
  const model = homeCardModel(FALLBACK_SNAPSHOT, '2026-09-22')
  assert.equal(homeStripHeadline(model, '2026-09-22'), '今天')
  assert.equal(homeStripSubline(model), '15:00 – 9月23日 15:00')
  assert.doesNotMatch(homeStripSubline(model), /9月22日/)
})

test('spotlight post prefers the newest post on the featured date', () => {
  const events = [
    {
      id: 'credit-preview',
      type: 'reset_credit',
      status: 'announced',
      schedule: { from: '2026-09-22T15:00:00.000+08:00' },
      createdAt: '2026-09-20T00:48:38.000+08:00',
      posts: [{
        id: 'older',
        publishedAt: '2026-09-20T00:48:38.000+08:00',
        stage: '发卡预告',
        text: '旧帖',
        url: 'https://x.com/thsottiaux/status/older',
      }],
    },
    {
      id: 'reset-preview',
      type: 'direct_reset',
      status: 'announced',
      schedule: { from: '2026-09-22T12:00:00.000+08:00' },
      createdAt: '2026-09-22T12:31:00.000+08:00',
      posts: [{
        id: 'newer',
        publishedAt: '2026-09-22T12:31:00.000+08:00',
        stage: '预告',
        text: '我承诺过周二重置。',
        url: 'https://x.com/thsottiaux/status/newer',
      }],
    },
  ]
  assert.equal(newestPostOnDate(events, '2026-09-22').id, 'newer')
})

test('featured upcoming announcement beats an older confirmed reset', () => {
  const parsed = parseCodexResetsPayload(FIXTURE)
  const featured = pickFeaturedEvent(parsed.events, '2026-09-22')
  assert.equal(featured.id, 'credit-preview')
  const stillOpen = pickFeaturedEvent(parsed.events, '2026-09-23')
  assert.equal(stillOpen.id, 'credit-preview')
  const confirmedOnly = pickFeaturedEvent(parsed.events.filter((event) => event.status === 'confirmed'), '2026-09-23')
  assert.equal(confirmedOnly.id, 'reset-confirmed')
})

test('page is registered as an analysis tool and a rich-page work', async () => {
  const work = ENGINEERING_WORKS.find((item) => item.id === 'codex-reset')
  assert.equal(work.href, '/codex-reset')
  assert.deepEqual(work.subjects, ['ai_dev'])
  const tool = TOOL_ITEMS.find((item) => item.id === 'codex-reset')
  assert.equal(tool.type, 'analysis')
  assert.equal(tool.href, '/codex-reset')

  const [page, client, home, primary, nav, api] = await Promise.all([
    readFile(new URL('../../app/(site)/codex-reset/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/codex-reset/CodexResetClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/HomePrimaryColumnsClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/api/codex-resets/route.js', import.meta.url), 'utf8'),
  ])
  assert.match(page, /createRichPageMetadata\('codex-reset'\)/)
  assert.match(client, /\/api\/codex-resets/)
  assert.match(client, /TIBO_AVATAR_PATH/)
  assert.match(client, /CODEX_RESET_HERO_BG_PATH/)
  assert.match(client, /codex-reset-day-panel/)
  assert.match(client, /codex-reset-day-panel-bg/)
  assert.doesNotMatch(client, /codex-reset-day-panel-overlay/)
  assert.doesNotMatch(client, /codex-reset-day-panel-art/)
  assert.doesNotMatch(client, /codex-reset-spotlight/)
  assert.doesNotMatch(client, /重置日历/)
  assert.doesNotMatch(client, /codex-reset-issue-card/)
  assert.doesNotMatch(client, /codex-reset-featured-bg/)
  assert.doesNotMatch(client, /codex-reset-page-bg|codex-reset-figure/)
  assert.match(client, /不猜测下一次重置/)
  assert.match(home, /title: 'Codex 重置'/)
  assert.match(home, /<HomeCodexResetCard/)
  assert.match(home, /舆情分析/)
  assert.doesNotMatch(primary, /<HomeCodexResetCard/)
  assert.match(primary, /HomeFeaturedReadingClient/)
  const card = await readFile(new URL('../../app/(site)/components/HomeCodexResetCard.jsx', import.meta.url), 'utf8')
  assert.match(card, /home-codex-reset-panel/)
  assert.match(card, /home-codex-reset-strip/)
  assert.match(card, /homeStripHeadline|homeStripSubline/)
  assert.doesNotMatch(card, /home-opinion-heading|home-builder-panel/)
  assert.match(home, /<HomeCodexResetCard\s*\/>\s*\n\s*<BuilderAndSignalsPanel/)
  assert.match(nav, /href: '\/codex-reset'[\s\S]*label: 'Codex 重置'/)
  assert.match(nav, /title: '分析'[\s\S]*href: '\/codex-reset'/)
  assert.match(api, /AIHOT_CODEX_RESETS_URL/)
  assert.match(api, /source: 'fallback'/)
})
