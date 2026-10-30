import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { readCommunityActionHistory, readXExtensionMonitor, recordCommunityActionReport } from '../../lib/community/communityActions.js'

const migration = (name) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), 'utf8')

function d1Adapter(sqlite) {
  return {
    prepare(sql) {
      const statement = sqlite.prepare(sql)
      const execute = (values) => ({
        async run() { return { meta: { changes: statement.run(...values).changes } } },
        async all() { return { results: statement.all(...values) } },
        async first() { return statement.get(...values) || null },
      })
      return {
        ...execute([]),
        bind(...values) { return execute(values) },
      }
    },
  }
}

test('post migration preserves old rows, repeated uploads replace counts, and history and monitor read posts', async () => {
  const sqlite = new DatabaseSync(':memory:')
  try {
    sqlite.exec(migration('0109_community_actions.sql'))
    sqlite.exec(migration('0112_x_extension_daily_reports.sql'))
    sqlite.prepare(`INSERT INTO x_extension_daily_reports (device_id, report_date, account_handle, comments, uploaded_at) VALUES (?, ?, ?, ?, ?)`)
      .run('device-x-daily', '2026-10-17', 'Tuaran', 2, 1000)
    sqlite.exec(migration('0119_x_extension_daily_report_posts.sql'))
    assert.equal(sqlite.prepare('SELECT posts FROM x_extension_daily_reports').get().posts, 0)
    sqlite.exec(migration('0115_x_extension_runtime.sql'))
    sqlite.exec(migration('0117_community_action_daily_counts.sql'))
    sqlite.exec(migration('0118_community_action_all_platform_counts.sql'))
    const db = d1Adapter(sqlite)
    const now = Date.parse('2026-10-18T08:00:00Z')
    assert.equal((await readCommunityActionHistory(db, { accountHandle: 'Tuaran', now })).dailyReports[0].counts.posts, 0)
    const beforePrunes = await readXExtensionMonitor(db, { date: '2026-10-17', accountHandle: 'Tuaran', now })
    assert.equal(beforePrunes.dailyMigrationRequired, true)
    assert.equal(beforePrunes.reportTotal, 1)
    assert.equal(beforePrunes.dailyReports[0].posts, 0)
    assert.equal(beforePrunes.dailyReports[0].prunes, 0)
    sqlite.exec(migration('0126_x_extension_daily_report_prunes.sql'))
    assert.equal(sqlite.prepare('SELECT prunes FROM x_extension_daily_reports').get().prunes, 0)
    const report = (posts) => ({
      deviceId: 'device-x-daily', platform: 'x', accountHandle: 'Tuaran',
      dailyReport: { date: '2026-10-17', accountHandle: 'Tuaran', counts: { comments: 2, likes: 1, follows: 0, unfollows: 0, followBacks: 0, posts } },
    })
    assert.equal((await recordCommunityActionReport(db, report(3), now)).dailyReportSaved, true)
    assert.equal((await recordCommunityActionReport(db, report(5), now + 1)).dailyReportSaved, true)
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS total, posts, prunes FROM x_extension_daily_reports').get().posts, 5)
    assert.equal(sqlite.prepare('SELECT prunes FROM x_extension_daily_reports').get().prunes, 0)
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM x_extension_daily_reports').get().total, 1)
    const history = await readCommunityActionHistory(db, { accountHandle: 'Tuaran', now })
    assert.equal(history.dailyReports[0].counts.posts, 5)
    assert.equal(history.dailyReports[0].counts.prunes, 0)
    const monitor = await readXExtensionMonitor(db, { date: '2026-10-17', accountHandle: 'Tuaran', now })
    assert.equal(monitor.dailyReports[0].posts, 5)
    assert.equal(monitor.dailyReports[0].prunes, 0)
    const withPrunes = {
      deviceId: 'device-x-daily', platform: 'x', accountHandle: 'Tuaran',
      dailyReport: { date: '2026-10-17', accountHandle: 'Tuaran', counts: { comments: 2, likes: 1, follows: 0, unfollows: 0, followBacks: 0, posts: 5, prunes: 6 } },
    }
    assert.equal((await recordCommunityActionReport(db, withPrunes, now + 2)).dailyReportSaved, true)
    assert.equal(sqlite.prepare('SELECT prunes FROM x_extension_daily_reports').get().prunes, 6)
    assert.equal((await readXExtensionMonitor(db, { date: '2026-10-17', accountHandle: 'Tuaran', now })).dailyReports[0].prunes, 6)
    sqlite.exec(migration('0127_x_extension_daily_report_comment_splits.sql'))
    assert.equal(sqlite.prepare('SELECT timeline_comments, notification_comments, kol_comments FROM x_extension_daily_reports').get().kol_comments, 0)
    const withSplits = {
      deviceId: 'device-x-daily', platform: 'x', accountHandle: 'Tuaran',
      dailyReport: {
        date: '2026-10-17', accountHandle: 'Tuaran',
        counts: {
          comments: 9, timelineComments: 2, notificationComments: 3, kolComments: 4,
          likes: 1, follows: 0, unfollows: 0, followBacks: 0, posts: 5, prunes: 6,
        },
      },
    }
    assert.equal((await recordCommunityActionReport(db, withSplits, now + 3)).dailyReportSaved, true)
    const splitRow = sqlite.prepare('SELECT comments, timeline_comments, notification_comments, kol_comments FROM x_extension_daily_reports').get()
    assert.equal(splitRow.comments, 9)
    assert.equal(splitRow.timeline_comments, 2)
    assert.equal(splitRow.notification_comments, 3)
    assert.equal(splitRow.kol_comments, 4)
    const splitMonitor = await readXExtensionMonitor(db, { date: '2026-10-17', accountHandle: 'Tuaran', now })
    assert.equal(splitMonitor.dailyReports[0].comments, 9)
    assert.equal(splitMonitor.dailyReports[0].timelineComments, 2)
    assert.equal(splitMonitor.dailyReports[0].notificationComments, 3)
    assert.equal(splitMonitor.dailyReports[0].kolComments, 4)
    assert.equal(splitMonitor.dailyMigrationRequired, false)
  } finally {
    sqlite.close()
  }
})

test('monitor still reads legacy daily reports before posts column migration', async () => {
  const sqlite = new DatabaseSync(':memory:')
  try {
    sqlite.exec(migration('0109_community_actions.sql'))
    sqlite.exec(migration('0112_x_extension_daily_reports.sql'))
    sqlite.exec(migration('0115_x_extension_runtime.sql'))
    sqlite.exec(migration('0117_community_action_daily_counts.sql'))
    sqlite.prepare(`INSERT INTO x_extension_daily_reports (device_id, report_date, account_handle, comments, uploaded_at) VALUES (?, ?, ?, ?, ?)`)
      .run('legacy-device', '2026-10-17', 'Tuaran', 2, 1000)
    const monitor = await readXExtensionMonitor(d1Adapter(sqlite), {
      date: '2026-10-17', accountHandle: 'Tuaran', now: Date.parse('2026-10-18T08:00:00Z'),
    })
    assert.equal(monitor.dailyMigrationRequired, true)
    assert.equal(monitor.reportTotal, 1)
    assert.equal(monitor.dailyReports[0].comments, 2)
    assert.equal(monitor.dailyReports[0].posts, 0)
    assert.equal(monitor.dailyReports[0].prunes, 0)
    assert.equal(monitor.dailyReports[0].timelineComments, 0)
    assert.equal(monitor.dailyReports[0].kolComments, 0)
  } finally {
    sqlite.close()
  }
})

test('monitor keeps reading daily reports before comment-split migration', async () => {
  const sqlite = new DatabaseSync(':memory:')
  try {
    sqlite.exec(migration('0109_community_actions.sql'))
    sqlite.exec(migration('0112_x_extension_daily_reports.sql'))
    sqlite.exec(migration('0115_x_extension_runtime.sql'))
    sqlite.exec(migration('0117_community_action_daily_counts.sql'))
    sqlite.exec(migration('0119_x_extension_daily_report_posts.sql'))
    sqlite.exec(migration('0126_x_extension_daily_report_prunes.sql'))
    sqlite.prepare(`INSERT INTO x_extension_daily_reports (device_id, report_date, account_handle, comments, posts, prunes, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run('split-pending', '2026-10-17', 'Tuaran', 5, 1, 2, 1000)
    const monitor = await readXExtensionMonitor(d1Adapter(sqlite), {
      date: '2026-10-17', accountHandle: 'Tuaran', now: Date.parse('2026-10-18T08:00:00Z'),
    })
    assert.equal(monitor.dailyMigrationRequired, true)
    assert.equal(monitor.dailyReports[0].comments, 5)
    assert.equal(monitor.dailyReports[0].timelineComments, 0)
    assert.equal(monitor.dailyReports[0].notificationComments, 0)
    assert.equal(monitor.dailyReports[0].kolComments, 0)
    assert.equal(monitor.dailyReports[0].prunes, 2)
  } finally {
    sqlite.close()
  }
})

test('daily receipt counts backfill and continue updating for all plugin platforms', () => {
  const db = new DatabaseSync(':memory:')
  try {
    db.exec(migration('0109_community_actions.sql'))
    db.exec(migration('0110_juejin_community_actions.sql'))
    const insert = db.prepare(`INSERT OR IGNORE INTO community_action_events (id, device_id, platform, task, result, occurred_at, created_at) VALUES (?, 'device-1', ?, ?, ?, ?, ?)`)
    const at = Date.parse('2026-10-17T16:15:00Z') // 10 月 18 日 00:15，北京时间
    insert.run('x-1', 'x', 'timeline-reply', 'success', at, at)
    insert.run('xhs-1', 'xhs', 'recommend-comment', 'success', at, at)
    insert.run('juejin-1', 'juejin', 'article-post', 'failed', at, at)
    db.exec(migration('0117_community_action_daily_counts.sql'))
    db.exec(migration('0118_community_action_all_platform_counts.sql'))
    insert.run('xhs-2', 'xhs', 'recommend-comment', 'success', at, at)
    insert.run('juejin-2', 'juejin', 'article-post', 'failed', at, at)
    insert.run('xhs-2', 'xhs', 'recommend-comment', 'success', at, at)
    const rows = db.prepare('SELECT platform, report_date, count FROM community_action_daily_counts ORDER BY platform').all()
    assert.deepEqual(rows.map((row) => [row.platform, row.report_date, row.count]), [
      ['juejin', '2026-10-18', 2], ['x', '2026-10-18', 1], ['xhs', '2026-10-18', 2],
    ])
  } finally {
    db.close()
  }
})
