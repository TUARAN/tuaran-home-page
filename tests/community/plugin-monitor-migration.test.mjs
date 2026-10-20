import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

const migration = (name) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), 'utf8')

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
