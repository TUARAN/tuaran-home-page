import assert from 'node:assert/strict'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'

import { readingVisitorName } from '../../lib/auth/readingVisitorIdentity.mjs'
import { READER_USER_PREFIX } from '../../lib/automation/engagementBot.js'
import { readFile } from 'node:fs/promises'

const beaconSource = await readFile(
  new URL('../../app/(site)/components/ContentPvBeacon.jsx', import.meta.url),
  'utf8',
)
const analyticsDashboardSource = await readFile(
  new URL('../../app/(admin)/admin/content-weekly/ContentWeeklyClient.jsx', import.meta.url),
  'utf8',
)
const analyticsRouteSource = await readFile(
  new URL('../../app/api/admin/analytics-sources/route.js', import.meta.url),
  'utf8',
)
const contentAnalyticsRouteSource = await readFile(
  new URL('../../app/api/admin/content-weekly/route.js', import.meta.url),
  'utf8',
)
const readerDetailRouteSource = await readFile(
  new URL('../../app/api/admin/content-weekly/reader/route.js', import.meta.url),
  'utf8',
)
const siteTrafficStatsRouteSource = await readFile(
  new URL('../../app/api/site-traffic-stats/route.js', import.meta.url),
  'utf8',
)
const siteFooterTrafficSource = await readFile(
  new URL('../../app/(site)/components/SiteFooterTrafficStats.jsx', import.meta.url),
  'utf8',
)

test('anonymous readers receive a privacy-safe marker from their visitor hash', () => {
  assert.equal(readingVisitorName({
    visitorType: 'anonymous',
    visitorKey: 'A1B2C3D4E5F6',
    userName: '匿名访客',
  }), '匿名访客 · a1b2c3')
})

test('named guest and account identities keep their recorded display name', () => {
  assert.equal(readingVisitorName({
    visitorType: 'guest',
    visitorKey: 'guest-id',
    userName: '🦫 机智的水豚 123456',
  }), '🦫 机智的水豚 123456')

  assert.equal(readingVisitorName({
    visitorType: 'user',
    visitorKey: 'github:123',
    userName: 'TUARAN',
  }), 'TUARAN')
})

test('content reads wait for a visible engagement signal before writing', () => {
  assert.match(beaconSource, /MIN_QUALIFIED_READING_MS/)
  assert.match(beaconSource, /document\.visibilityState !== 'visible'/)
  assert.match(beaconSource, /signal: 'content_read_v2'/)
  assert.doesNotMatch(beaconSource, /挂载时给 \/api\/research-pv 记一次访问/)
})

test('public footer traffic uses umami share stats without owner auth', () => {
  assert.match(siteTrafficStatsRouteSource, /fetchPublicSiteTrafficSummary/)
  assert.match(siteTrafficStatsRouteSource, /s-maxage=300/)
  assert.doesNotMatch(siteTrafficStatsRouteSource, /getOwnerOrReject/)
  assert.match(siteFooterTrafficSource, /\/api\/site-traffic-stats/)
  assert.match(siteFooterTrafficSource, /总浏览/)
  assert.match(siteFooterTrafficSource, /有效阅读/)
  assert.match(siteFooterTrafficSource, /7 日 UV/)
  assert.match(siteFooterTrafficSource, /prominent/)
  assert.match(siteFooterTrafficSource, /mt-1\.5 flex flex-wrap items-baseline gap-x-4/)
  assert.match(siteFooterTrafficSource, /\/traffic#qualified-reads/)
})

test('admin analytics centralizes source roles and live integrations', () => {
  assert.match(analyticsDashboardSource, /title="统一统计总览"/)
  assert.match(analyticsDashboardSource, /主口径 · 站点访问/)
  assert.match(analyticsDashboardSource, /主口径 · 内容消费/)
  assert.match(analyticsDashboardSource, /诊断口径 · 边缘流量/)
  assert.match(analyticsDashboardSource, /指标字典与差异说明/)
  assert.match(analyticsRouteSource, /UMAMI_API_KEY/)
  assert.match(analyticsRouteSource, /UMAMI_SHARE_SLUG/)
  assert.match(analyticsRouteSource, /x-umami-share-token/)
  assert.match(analyticsRouteSource, /x-umami-share-context/)
  assert.match(analyticsRouteSource, /CLOUDFLARE_ANALYTICS_TOKEN/)
  assert.match(analyticsRouteSource, /requestSource: 'eyeball'/)
})

test('content analytics defaults to the recent seven-day period', () => {
  assert.match(analyticsDashboardSource, /const \[days, setDays\] = useState\(7\)/)
})

test('admin analytics exposes a true cumulative history range', () => {
  assert.match(analyticsDashboardSource, /\{ days: 'all', label: '历史累计' \}/)
  assert.match(analyticsRouteSource, /requestedRange === 'all'/)
  assert.match(contentAnalyticsRouteSource, /requestedRange === 'all'/)
  assert.match(contentAnalyticsRouteSource, /cumulativeAnalyticsWindow/)
})

test('active readers expand into a per-reader detail behind the owner guard', () => {
  assert.match(readerDetailRouteSource, /getOwnerOrReject/)
  assert.match(readerDetailRouteSource, /CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END/)
  assert.match(readerDetailRouteSource, /quality = 'qualified'/)
  assert.match(readerDetailRouteSource, /first_seen/)
  assert.match(readerDetailRouteSource, /readingVisitorName/)
  assert.match(readerDetailRouteSource, /getUnlockCountsForUsers/)
  assert.match(readerDetailRouteSource, /unlockAdminHref/)
  assert.match(analyticsDashboardSource, /content-weekly\/reader/)
  assert.match(analyticsDashboardSource, /toggleReader/)
  assert.match(analyticsDashboardSource, /查看解锁记录/)
})

test('engagement feedback excludes in-site bot comments from both the list and totals', () => {
  assert.match(contentAnalyticsRouteSource, /READER_USER_PREFIX/)
  assert.match(contentAnalyticsRouteSource, /BOT_COMMENT_USER_PATTERN/)
  assert.match(contentAnalyticsRouteSource, /FROM article_comments\s+WHERE user_id NOT LIKE \?1/)
  assert.match(contentAnalyticsRouteSource, /FROM article_comments\s+WHERE user_id NOT LIKE \?2/)
  assert.match(contentAnalyticsRouteSource, /bind\(periodStart, BOT_COMMENT_USER_PATTERN\)/)
})

test('reader: exclusion keeps real reader comments and drops only bot rows', () => {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE article_comments (
    id INTEGER PRIMARY KEY, article_key TEXT NOT NULL, user_id TEXT NOT NULL, created_at INTEGER NOT NULL
  )`)
  db.exec(`INSERT INTO article_comments VALUES
    (1, 'article:a', 'reader:qingshi', 40),
    (2, 'article:b', 'reader:nanan', 30),
    (3, 'article:a', 'github:123', 20),
    (4, 'article:c', 'guest:abc', 10)`)
  const pattern = `${READER_USER_PREFIX}%`
  const rows = db.prepare(
    `SELECT id FROM article_comments WHERE user_id NOT LIKE ? ORDER BY created_at DESC`,
  ).all(pattern)
  assert.deepEqual(rows.map((row) => row.id), [3, 4])
  const total = db.prepare(
    `SELECT COUNT(*) AS total_comments, COUNT(DISTINCT article_key) AS article_count,
            SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS period_comments
     FROM article_comments WHERE user_id NOT LIKE ?2`,
  ).get(10, pattern)
  assert.equal(Number(total.total_comments), 2)
  assert.equal(Number(total.article_count), 2)
  assert.equal(Number(total.period_comments), 2)
  db.close()
})

test('top-liked articles and like totals ignore in-site bot votes', () => {
  assert.match(contentAnalyticsRouteSource, /const BOT_VOTER_KEY_PATTERN/)
  assert.match(contentAnalyticsRouteSource, /user:\$\{READER_USER_PREFIX\}%/)
  const likeQueries = contentAnalyticsRouteSource.match(/FROM article_likes[\s\S]*?voter_key NOT LIKE \?4/g) || []
  assert.equal(likeQueries.length, 2)
  assert.match(contentAnalyticsRouteSource, /bind\(periodStart, previousStart, now, BOT_VOTER_KEY_PATTERN\)/)
  assert.match(contentAnalyticsRouteSource, /bind\(periodStart, previousStart, now, BOT_VOTER_KEY_PATTERN, LIMIT\)/)
})

test('voter: exclusion keeps real likes and drops only bot votes', () => {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE article_likes (
    id INTEGER PRIMARY KEY, article_key TEXT NOT NULL, voter_key TEXT NOT NULL,
    user_id TEXT, created_at INTEGER NOT NULL
  )`)
  db.exec(`INSERT INTO article_likes VALUES
    (1, 'article:a', 'user:reader:qingshi', 'reader:qingshi', 40),
    (2, 'article:a', 'user:reader:nanan', 'reader:nanan', 35),
    (3, 'article:b', 'user:reader:gubai', 'reader:gubai', 30),
    (4, 'article:a', 'user:1001', '1001', 20),
    (5, 'article:c', 'guest:abc', NULL, 10)`)
  const pattern = `user:${READER_USER_PREFIX}%`
  const totals = db.prepare(
    `SELECT
       SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS total,
       SUM(CASE WHEN created_at >= ?2 AND created_at < ?1 THEN 1 ELSE 0 END) AS previous_total
     FROM article_likes WHERE created_at >= ?2 AND created_at <= ?3
       AND voter_key NOT LIKE ?4`,
  ).get(15, 0, 100, pattern)
  assert.equal(Number(totals.total), 1)
  assert.equal(Number(totals.previous_total), 1)
  const top = db.prepare(
    `SELECT article_key,
       SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS total
     FROM article_likes WHERE created_at >= ?2 AND created_at <= ?3
       AND voter_key NOT LIKE ?4
     GROUP BY article_key HAVING SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) > 0
     ORDER BY total DESC LIMIT ?5`,
  ).all(15, 0, 100, pattern, 12)
  assert.deepEqual(top.map((row) => row.article_key), ['article:a'])
  db.close()
})
