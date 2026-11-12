import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DAILY_TOP_INGEST_HEADER,
  DAILY_TOP_INGEST_SECRET_ENV,
  dailyTopObjectKey,
  loadCombinedDailyTopDays,
  thankYouTextFor,
} from '../../lib/interaction/dailyTop/store.js'
import {
  dailyTopCorsHeaders,
  handleDailyTopGet,
  handleDailyTopOptions,
  handleDailyTopPost,
} from '../../lib/interaction/dailyTop/http.js'
import { gitDailyTopDays } from '../../lib/interaction/dailyTop/gitCatalog.js'
import { expectedWindow, profileUrlFor } from '../../lib/interaction/dailyTop/model.js'
import { INTEGRATION_WEBHOOKS } from '../../lib/site/integrationCatalog.js'

const SECRET = 'test-daily-top-secret'
const NOW = new Date('2026-11-12T04:00:00Z')

function memoryBucket({ paginate = false } = {}) {
  const objects = new Map()
  return {
    objects,
    async get(key) {
      const text = objects.get(key)
      return text == null ? null : { text: async () => text }
    },
    async put(key, value) {
      objects.set(key, typeof value === 'string' ? value : new TextDecoder().decode(value))
    },
    async list({ prefix = '', cursor } = {}) {
      const keys = [...objects.keys()].filter((key) => key.startsWith(prefix)).sort()
      if (paginate && !cursor) {
        return { objects: keys.slice(0, 1).map((key) => ({ key })), truncated: keys.length > 1, cursor: keys.length > 1 ? 'next' : undefined }
      }
      const start = cursor === 'next' ? 1 : 0
      return { objects: keys.slice(start).map((key) => ({ key })), truncated: false }
    },
  }
}

function retarget(day, date, patch = {}) {
  return {
    schemaVersion: day.schemaVersion,
    date,
    timezone: day.timezone,
    window: expectedWindow(date),
    metric: day.metric,
    metricLabel: day.metricLabel,
    subject: day.subject,
    excludedHandles: [...day.excludedHandles],
    opponents: patch.opponents ?? day.opponents,
    events: patch.events ?? day.events,
    top: day.top.map(({ rank, handle, displayName, count, breakdown }) => ({ rank, handle, displayName, count, breakdown })),
  }
}

function envWith(bucket, secret = SECRET) {
  return { [DAILY_TOP_INGEST_SECRET_ENV]: secret, CONTENT_FEED: bucket }
}

test('backfill days 2026-11-10 and 2026-11-11 match the published top ten', () => {
  const days = gitDailyTopDays()
  const nov10 = days.find((day) => day.date === '2026-11-10')
  const nov11 = days.find((day) => day.date === '2026-11-11')
  assert.equal(nov10.top[1].displayName, '火山哥🕊️')
  assert.equal(nov10.top[2].displayName, 'allincrypto 熬鹰资本 🇨🇳')
  assert.equal(nov10.events, 786)
  assert.equal(nov10.opponents, 337)
  assert.deepEqual(nov10.window, expectedWindow('2026-11-10'))
  assert.deepEqual(nov10.top.map((row) => [row.handle, row.count, row.breakdown, row.profileUrl]), [
    ['HotmailfromSH', 15, '我回复 15', profileUrlFor('HotmailfromSH')],
    ['huoshan007', 15, '我回复 15', profileUrlFor('huoshan007')],
    ['thankUcrypto', 15, '我回复 15', profileUrlFor('thankUcrypto')],
    ['weiyux2021', 15, '我回复 15', profileUrlFor('weiyux2021')],
    ['xupaopaogm', 15, '我回复 15', profileUrlFor('xupaopaogm')],
    ['fngmn134813', 14, '对方回复 6 · 我回复 8', profileUrlFor('fngmn134813')],
    ['hao911519', 14, '对方回复 7 · 我回复 7', profileUrlFor('hao911519')],
    ['kinnacheung', 12, '对方回复 6 · 我回复 6', profileUrlFor('kinnacheung')],
    ['XueJieYaa', 8, '对方回复 1 · 我回复 7', profileUrlFor('XueJieYaa')],
    ['979293861Chen', 7, '对方回复 4 · 我回复 3', profileUrlFor('979293861Chen')],
  ])
  assert.equal(nov11.events, 749)
  assert.equal(nov11.opponents, 304)
  assert.equal(nov11.top[0].breakdown, '对方回复 2 · 我回复 1 · 我提及 30')
  assert.equal(nov11.top[0].profileUrl, 'https://x.com/grok')
  const thankYou = thankYouTextFor(nov11)
  assert.equal(thankYou, '感谢过去一天的互动，谢谢 @grok @weiyux2021 @HotmailfromSH @huoshan007 @thankUcrypto @xupaopaogm @uunvx91396249 @ynggu2548245 @zhiliaoX @DaFuXiao 愿意一起聊天。往期可以来大互动日历翻翻：https://2aran.com/resources/big-interaction-whitepaper/calendar')
  assert.doesNotMatch(thankYou, /第\s*\d+|^\d+\./)
  assert.equal(days.some((day) => day.date === '2026-11-09'), false)
})

test('GET returns the calendar default day, a requested day, and 404 for a missing or invalid date', async () => {
  const latest = await handleDailyTopGet(new Request('https://2aran.com/api/interaction/daily-top'), {}, NOW)
  assert.equal(latest.status, 200)
  const latestBody = await latest.json()
  assert.equal(latestBody.date, '2026-11-11')
  assert.equal(latestBody.calendarUrl, 'https://2aran.com/resources/big-interaction-whitepaper/calendar')
  assert.equal(latestBody.top[0].profileUrl, 'https://x.com/grok')
  assert.match(latestBody.thankYouText, /谢谢 @grok @weiyux2021 /)
  assert.match(latest.headers.get('cache-control'), /no-store/)

  const today = await handleDailyTopGet(
    new Request('https://2aran.com/api/interaction/daily-top'),
    {},
    new Date('2026-11-10T04:00:00Z'),
  )
  assert.equal((await today.json()).date, '2026-11-10')

  const byDate = await handleDailyTopGet(new Request('https://2aran.com/api/interaction/daily-top?date=2026-11-10'), {}, NOW)
  assert.equal((await byDate.json()).date, '2026-11-10')

  const missing = await handleDailyTopGet(new Request('https://2aran.com/api/interaction/daily-top?date=2026-11-09'), {}, NOW)
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'NOT_FOUND', date: '2026-11-09' })

  for (const date of ['2026-02-31', 'not-a-date']) {
    const response = await handleDailyTopGet(new Request(`https://2aran.com/api/interaction/daily-top?date=${date}`), {}, NOW)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'NOT_FOUND' })
  }
})

test('public GET CORS allows the site and extension origins', async () => {
  const cases = [
    ['https://2aran.com', 'https://2aran.com'],
    ['chrome-extension://abcdefghijklmnopabcdefghij', 'chrome-extension://abcdefghijklmnopabcdefghij'],
    ['safari-web-extension://A1B2C3D4-E5F6-7890-ABCD-EF1234567890', 'safari-web-extension://A1B2C3D4-E5F6-7890-ABCD-EF1234567890'],
    ['https://example.test', '*'],
  ]
  for (const [origin, expected] of cases) {
    const request = new Request('https://2aran.com/api/interaction/daily-top', { headers: { origin } })
    assert.equal(dailyTopCorsHeaders(request)['Access-Control-Allow-Origin'], expected)
    const response = await handleDailyTopGet(request, {}, NOW)
    assert.equal(response.headers.get('access-control-allow-origin'), expected)
  }
  const preflight = handleDailyTopOptions(new Request('https://2aran.com/api/interaction/daily-top', {
    method: 'OPTIONS',
    headers: { origin: 'chrome-extension://abcdefghijklmnopabcdefghij' },
  }))
  assert.equal(preflight.status, 204)
  assert.match(preflight.headers.get('access-control-allow-headers'), new RegExp(DAILY_TOP_INGEST_HEADER))
  assert.match(preflight.headers.get('access-control-allow-methods'), /GET/)
  assert.match(preflight.headers.get('access-control-allow-methods'), /POST/)
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null)
})

test('POST rejects a missing or wrong secret and does not store the secret', async () => {
  const bucket = memoryBucket()
  const day = retarget(gitDailyTopDays()[2], '2026-11-12', { events: 3 })
  const logs = []
  const methods = ['log', 'info', 'warn', 'error', 'debug']
  const originals = Object.fromEntries(methods.map((method) => [method, console[method]]))
  for (const method of methods) console[method] = (...args) => logs.push(args.join(' '))
  try {
    const unconfigured = await handleDailyTopPost(new Request('https://2aran.com/api/interaction/daily-top', {
      method: 'POST',
      headers: { 'content-type': 'application/json', [DAILY_TOP_INGEST_HEADER]: SECRET },
      body: JSON.stringify(day),
    }), { CONTENT_FEED: bucket })
    assert.equal(unconfigured.status, 503)
    assert.equal((await unconfigured.json()).error, 'DAILY_TOP_INGEST_SECRET_UNCONFIGURED')

    const rejected = await handleDailyTopPost(new Request('https://2aran.com/api/interaction/daily-top', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${SECRET}-no` },
      body: JSON.stringify(day),
    }), envWith(bucket))
    assert.equal(rejected.status, 401)
    const rejectedText = await rejected.text()
    assert.match(rejectedText, /UNAUTHORIZED/)
    assert.equal(rejectedText.includes(SECRET), false)

    const invalid = await handleDailyTopPost(new Request('https://2aran.com/api/interaction/daily-top', {
      method: 'POST',
      headers: { 'content-type': 'application/json', [DAILY_TOP_INGEST_HEADER]: SECRET },
      body: JSON.stringify({ ...day, events: -1 }),
    }), envWith(bucket))
    assert.equal(invalid.status, 400)
    assert.equal(bucket.objects.size, 0)
  } finally {
    for (const method of methods) console[method] = originals[method]
  }
  assert.equal(logs.join('\n').includes(SECRET), false)
})

test('an authenticated POST is readable immediately by GET and the calendar source', async () => {
  const bucket = memoryBucket({ paginate: true })
  const gitNov11 = gitDailyTopDays().find((day) => day.date === '2026-11-11')
  const corrected = retarget(gitNov11, '2026-11-11', { events: 750, opponents: 305 })
  const fresh = retarget(gitNov11, '2026-11-12', { events: 4, opponents: 2 })
  const headerPost = await handleDailyTopPost(new Request('https://2aran.com/api/interaction/daily-top', {
    method: 'POST',
    headers: { 'content-type': 'application/json', [DAILY_TOP_INGEST_HEADER]: SECRET },
    body: JSON.stringify(corrected),
  }), envWith(bucket))
  assert.equal(headerPost.status, 200)
  assert.equal((await headerPost.json()).day.events, 750)

  const bearerPost = await handleDailyTopPost(new Request('https://2aran.com/api/interaction/daily-top', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ day: fresh }),
  }), envWith(bucket))
  assert.equal(bearerPost.status, 200)
  assert.equal(bucket.objects.has(dailyTopObjectKey('2026-11-12')), true)

  const env = envWith(bucket)
  const correctedGet = await handleDailyTopGet(new Request('https://2aran.com/api/interaction/daily-top?date=2026-11-11'), env, NOW)
  assert.equal((await correctedGet.json()).events, 750)
  const freshGet = await handleDailyTopGet(new Request('https://2aran.com/api/interaction/daily-top'), env, NOW)
  const freshBody = await freshGet.json()
  assert.equal(freshBody.date, '2026-11-12')
  assert.equal(freshBody.events, 4)
  assert.equal(freshBody.top[0].profileUrl, 'https://x.com/grok')
  assert.match(freshBody.thankYouText, /往期可以来大互动日历翻翻：https:\/\/2aran\.com\/resources\/big-interaction-whitepaper\/calendar/)

  const combined = await loadCombinedDailyTopDays(bucket)
  assert.equal(combined.find((day) => day.date === '2026-11-11').events, 750)
  assert.equal(combined.find((day) => day.date === '2026-11-05').events, 1386)
  assert.equal(combined.at(-1).date, '2026-11-12')

  bucket.objects.set('interaction/daily-top/2026-11-10.json', '{')
  bucket.objects.set('interaction/daily-top/not-a-day.json', JSON.stringify(fresh))
  const skipped = await loadCombinedDailyTopDays(bucket)
  assert.equal(skipped.find((day) => day.date === '2026-11-10').events, 786)
  assert.equal(skipped.some((day) => day.date === 'not-a-day'), false)
})

test('ingest secret stays in the Pages secret name and is not given a repository value', async () => {
  const [route, http, wrangler] = await Promise.all([
    readFile(new URL('../../app/api/interaction/daily-top/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/interaction/dailyTop/http.js', import.meta.url), 'utf8'),
    readFile(new URL('../../wrangler.toml', import.meta.url), 'utf8'),
  ])
  assert.match(route, /runtime = 'edge'/)
  assert.match(route, /handleDailyTopGet/)
  assert.match(route, /handleDailyTopPost/)
  assert.doesNotMatch(http, /console\.(log|info|warn|error|debug)/)
  assert.match(wrangler, /DAILY_TOP_INGEST_SECRET/)
  assert.doesNotMatch(wrangler, /DAILY_TOP_INGEST_SECRET\s*=/)
  const webhook = INTEGRATION_WEBHOOKS.find((entry) => entry.id === 'daily-top-ingest')
  assert.equal(webhook.secretEnv, DAILY_TOP_INGEST_SECRET_ENV)
  assert.equal(webhook.path, 'POST /api/interaction/daily-top')
})
