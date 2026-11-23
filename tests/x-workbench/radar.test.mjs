import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { BOARD_DIMS, parseTweetUrl, boardWindow, filterAndSort, levelOf, normalizeIngestItem, signalScore } from '../../lib/x/workbench/radarCore.js'
import { addWatch, ingestItems, leaderboard, listRadar, removeWatch } from '../../lib/x/workbench/radarStore.js'

function makeDb() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync(new URL('../../migrations/0134_x_workbench_radar.sql', import.meta.url), 'utf8'))
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...args).changes } }),
  })
  return { prepare: (sql) => stmt(sql), batch: async (l) => { for (const s of l) await s.run() } }
}

const NOW = Date.UTC(2026, 10, 22, 6) // UTC 06:00 = 北京 14:00，统计日从当天 UTC 00:00 起
const H = 3_600_000
const post = (over = {}) => ({ id: '1000001', handle: 'Alice', createdAt: NOW - 2 * H, text: 'hello', likes: 100, reposts: 10, replies: 5, views: 5000, ...over })

test('入库清洗：非法 id/账号/时间被拒，链接自动生成', () => {
  assert.equal(normalizeIngestItem(post({ id: 'abc' }), NOW), null)
  assert.equal(normalizeIngestItem(post({ handle: 'bad name' }), NOW), null)
  assert.equal(normalizeIngestItem(post({ createdAt: NOW + 5 * H }), NOW), null)
  assert.equal(normalizeIngestItem(post({ createdAt: NOW - 40 * 24 * H }), NOW), null)
  const ok = normalizeIngestItem(post({ url: 'https://evil.example', likes: -5, views: '123' }), NOW)
  assert.equal(ok.url, 'https://x.com/alice/status/1000001')
  assert.equal(ok.likes, 0)
  assert.equal(ok.views, 123)
})

test('爆发指数：同样互动越新越高；等级阈值', () => {
  const base = normalizeIngestItem(post(), NOW)
  const old = { ...base, tweetAt: NOW - 48 * H }
  assert.ok(signalScore(base, NOW) > signalScore(old, NOW))
  assert.ok(signalScore(base, NOW) <= 100)
  assert.deepEqual([90, 75, 55, 10].map(levelOf), ['burst', 'fast', 'rising', 'normal'])
})

test('筛选与排序：级别、形式、展示量、监控账号', () => {
  const a = normalizeIngestItem(post({ id: '1000001', handle: 'a', views: 100, likes: 1, reposts: 0, replies: 0 }), NOW)
  const b = normalizeIngestItem(post({ id: '1000002', handle: 'b', media: 'video', views: 90000, likes: 9000, reposts: 2000 }), NOW)
  const c = normalizeIngestItem(post({ id: '1000003', handle: 'c', media: 'image', views: 8000, createdAt: NOW - 1 * H }), NOW)
  const all = [a, b, c]
  assert.equal(filterAndSort(all, { sort: 'score' }, NOW)[0].id, '1000002')
  assert.deepEqual(filterAndSort(all, { media: 'video' }, NOW).map((i) => i.id), ['1000002'])
  assert.deepEqual(filterAndSort(all, { minViews: 5000, sort: 'views' }, NOW).map((i) => i.id), ['1000002', '1000003'])
  assert.deepEqual(filterAndSort(all, { sort: 'time' }, NOW).map((i) => i.id), ['1000003', '1000001', '1000002'].filter((id) => id) .sort((x, y) => all.find((i) => i.id === y).tweetAt - all.find((i) => i.id === x).tweetAt))
  assert.deepEqual(filterAndSort(all, { handles: new Set(['c']) }, NOW).map((i) => i.id), ['1000003'])
})

test('统计日界线：北京时间 08:00 = UTC 00:00', () => {
  const day = Date.UTC(2026, 10, 22)
  assert.deepEqual([boardWindow('today', NOW).from, boardWindow('yesterday', NOW).from, boardWindow('yesterday', NOW).to], [day, day - 86400000, day])
  assert.equal(boardWindow('7d', NOW).from, day - 6 * 86400000)
  assert.equal(boardWindow('nope', NOW).key, 'today')
  assert.deepEqual(Object.keys(BOARD_DIMS), ['posts', 'replies', 'views', 'likes'])
})

test('入库去重且指标只增不减；榜单按维度聚合', async () => {
  const db = makeDb()
  const r = await ingestItems(db, 'u1', [post(), post({ id: 'bad' })], NOW)
  assert.deepEqual([r.accepted, r.rejected], [1, 1])
  await ingestItems(db, 'u2', [post({ likes: 50, views: 9000 })], NOW + 1000)
  const radar = await listRadar(db, 'u1', {}, NOW)
  assert.equal(radar.items.length, 1)
  assert.equal(radar.items[0].likes, 100)
  assert.equal(radar.items[0].views, 9000)
  await ingestItems(db, 'u1', [
    post({ id: '2000001', handle: 'bob', views: 800000, likes: 10 }),
    post({ id: '2000002', handle: 'bob', views: 1, likes: 1 }),
    post({ id: '3000001', handle: 'carol', createdAt: NOW - 30 * H, views: 99999999 }),
  ], NOW)
  const byViews = await leaderboard(db, 'today', 'views', NOW)
  assert.deepEqual(byViews.rows.map((x) => x.handle), ['bob', 'alice'])
  assert.equal((await leaderboard(db, 'today', 'posts', NOW)).rows[0].handle, 'bob')
  const nextMorning = Date.UTC(2026, 10, 23, 1)
  assert.equal((await leaderboard(db, 'today', 'posts', nextMorning)).rows.length, 0)
  const carried = await leaderboard(db, 'auto', 'posts', nextMorning)
  assert.equal(carried.fallback, true)
  assert.equal(carried.from, Date.UTC(2026, 10, 22))
  assert.ok(carried.rows.some((row) => row.handle === 'bob'))
  assert.deepEqual((await leaderboard(db, 'yesterday', 'views', NOW)).rows.map((x) => x.handle), ['carol'])
  assert.equal((await leaderboard(db, 'today', 'bogus', NOW)).dim, 'views')
})

test('监控账号：加备注、上限、只看监控、删除', async () => {
  const db = makeDb()
  await ingestItems(db, 'u1', [post(), post({ id: '1000002', handle: 'bob' })], NOW)
  assert.equal((await addWatch(db, 'u1', 'bad name')).error, 'INVALID_HANDLE')
  await addWatch(db, 'u1', '@Bob', '对标账号', NOW)
  const only = await listRadar(db, 'u1', { watchOnly: true }, NOW)
  assert.deepEqual(only.items.map((i) => [i.handle, i.note, i.watched]), [['bob', '对标账号', true]])
  assert.equal((await listRadar(db, 'u2', { watchOnly: true }, NOW)).items.length, 0)
  for (let i = 0; i < 49; i++) await addWatch(db, 'u1', `w${i}`, '', NOW)
  assert.equal((await addWatch(db, 'u1', 'extra', '', NOW)).error, 'WATCH_LIMIT')
  assert.equal((await addWatch(db, 'u1', 'bob', '改备注', NOW)).ok, true)
  await removeWatch(db, 'u1', 'bob')
  assert.equal((await listRadar(db, 'u1', {}, NOW)).watch.some((w) => w.handle === 'bob'), false)
})

test('手动收录从 Snowflake 解析时间，拒绝伪装域名与路径', () => {
  const id = ((BigInt(NOW - H) - 1288834974657n) << 22n).toString()
  assert.deepEqual(parseTweetUrl(`https://x.com/Alice/status/${id}?s=20`), { handle: 'Alice', id, createdAt: NOW - H })
  for (const url of [`https://evilx.com/Alice/status/${id}`, `https://x.com.evil.test/Alice/status/${id}`, `http://x.com/Alice/status/${id}`, `https://x.com/Alice/status/${id}/photo/1`, `https://u@x.com/Alice/status/${id}`]) assert.equal(parseTweetUrl(url), null)
})

test('冠军历史仅计算完整统计日，无采集日保留空位', async () => {
  const { championHistory } = await import('../../lib/x/workbench/radarStore.js')
  const db = makeDb()
  await ingestItems(db, 'u1', [post({ createdAt: NOW - 24 * H })], NOW)
  const history = await championHistory(db, 'views', NOW)
  assert.equal(history.days.length, 7)
  assert.equal(history.days[0].champion.handle, 'alice')
  assert.equal(history.days[1].champion, null)
  assert.equal(history.days[0].from - history.days[1].from, 24 * H)
})

test('榜单分享图转义采集昵称，限制十名并标注采集范围', async () => {
  const { buildBoardSvg } = await import('../../lib/x/workbench/posterCore.js')
  const svg = buildBoardSvg({ rows: [{ handle: 'foo', display_name: '<script>bad</script>', views: 123 }] })
  assert.ok(!svg.includes('<script>'))
  assert.ok(svg.includes('&lt;script&gt;'))
  assert.ok(svg.includes('仅覆盖采集推文'))
  assert.ok(svg.includes('123'))
})
