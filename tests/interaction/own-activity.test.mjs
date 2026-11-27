import assert from 'node:assert/strict'
import test from 'node:test'

import { interactionAgentHandles } from '../../lib/interaction/agentPool.js'
import { loadOwnActivityDays, loadOwnActivityDaysForPool, ownActivityMetrics } from '../../lib/interaction/dailyTop/ownActivity.js'

function row(reportDate, counts) {
  return { report_date: reportDate, ...counts }
}

test('own activity metrics keep the admin daily-report labels and add follow-backs into follows', () => {
  const metrics = ownActivityMetrics({ comments: 4, likes: 2, follows: 1, followBacks: 3, timelineComments: 1 })
  assert.deepEqual(metrics.map((metric) => metric.label), [
    '评论合计', '评论首页', '评论回复', '评论大V', '点赞', '关注（含回关）', '取关', '其中回关', '发帖', '删帖', '删评论',
  ])
  assert.equal(metrics.find((metric) => metric.key === 'follows').count, 4)
  assert.equal(metrics.find((metric) => metric.key === 'followBacks').count, 3)
  assert.equal(metrics.find((metric) => metric.key === 'comments').count, 4)
})

test('a report day is shown on the next calendar day and same-day rows are summed', async () => {
  const db = {
    prepare() {
      return {
        bind() { return this },
        async all() {
          return {
            results: [
              row('2026-11-09', { comments: 4, likes: 2, follows: 1, unfollows: 0, followBacks: 3, posts: 1, prunes: 0, replyPrunes: 0, timelineComments: 1, notificationComments: 2, kolComments: 1 }),
              row('2026-11-09', { comments: 1, likes: 0, follows: 0, unfollows: 1, followBacks: 0, posts: 0, prunes: 0, replyPrunes: 1, timelineComments: 0, notificationComments: 1, kolComments: 0 }),
              row('2026-11-15', { comments: 9, likes: 0, follows: 0, unfollows: 0, followBacks: 0, posts: 0, prunes: 0, replyPrunes: 0, timelineComments: 0, notificationComments: 0, kolComments: 0 }),
            ],
          }
        },
      }
    },
  }
  const days = await loadOwnActivityDays(db, { today: '2026-11-15', accountHandle: 'tarsixseveneig1' })
  assert.deepEqual(days.map((day) => day.date), ['2026-11-10'])
  assert.equal(days[0].sourceDate, '2026-11-09')
  assert.equal(days[0].accountHandle, 'tarsixseveneig1')
  assert.equal(days[0].metrics.find((metric) => metric.key === 'comments').count, 5)
  assert.equal(days[0].metrics.find((metric) => metric.key === 'likes').count, 2)
  assert.equal(days[0].metrics.find((metric) => metric.key === 'follows').count, 4)
  assert.equal(days[0].metrics.find((metric) => metric.key === 'unfollows').count, 1)
  assert.equal(days[0].metrics.find((metric) => metric.key === 'replyPrunes').count, 1)
  assert.equal(days[0].metrics.find((metric) => metric.key === 'notificationComments').count, 3)
})

test('missing optional columns fall back, and a missing table returns no days', async () => {
  let attempts = 0
  const db = {
    prepare(sql) {
      return {
        bind() { return this },
        async all() {
          attempts += 1
          if (String(sql).includes('SUM(reply_prunes)')) {
            const error = new Error('no such column: reply_prunes')
            throw error
          }
          return { results: [row('2026-11-14', { comments: 2, likes: 1, follows: 0, unfollows: 0, followBacks: 0, posts: 0, prunes: 0, timelineComments: 2, notificationComments: 0, kolComments: 0 })] }
        },
      }
    },
  }
  const days = await loadOwnActivityDays(db, { today: '2026-11-15' })
  assert.equal(attempts, 2)
  assert.equal(days[0].date, '2026-11-15')
  assert.equal(days[0].sourceDate, '2026-11-14')
  assert.equal(days[0].metrics.find((metric) => metric.key === 'replyPrunes').count, 0)
  assert.equal(days[0].metrics.find((metric) => metric.key === 'comments').count, 2)

  const missing = {
    prepare() {
      return { bind() { return this }, async all() { throw new Error('no such table: x_extension_daily_reports') } }
    },
  }
  assert.deepEqual(await loadOwnActivityDays(missing, { today: '2026-11-15' }), [])
  assert.deepEqual(await loadOwnActivityDays(null, { today: '2026-11-15' }), [])
})

test('pool loader merges each account on the same calendar date', async () => {
  const db = {
    prepare() {
      return {
        bind(_from, _to, handle) {
          this.handle = handle
          return this
        },
        async all() {
          if (this.handle === 'TuaranX') {
            return { results: [{ report_date: '2026-11-14', comments: 2, likes: 0, follows: 0, unfollows: 0, follow_backs: 0, posts: 1, prunes: 0, timeline_comments: 0, notification_comments: 0, kol_comments: 0 }] }
          }
          return { results: [{ report_date: '2026-11-14', comments: 5, likes: 1, follows: 0, unfollows: 0, follow_backs: 0, posts: 0, prunes: 0, timeline_comments: 0, notification_comments: 0, kol_comments: 0 }] }
        },
      }
    },
  }
  const days = await loadOwnActivityDaysForPool(db, { today: '2026-11-15', handles: ['tarsixseveneig1', 'TuaranX'] })
  assert.equal(days.length, 2)
  assert.deepEqual(days.map((day) => day.accountHandle).sort(), ['TuaranX', 'tarsixseveneig1'].sort())
  assert.deepEqual(new Set(days.map((day) => day.date)), new Set(['2026-11-15']))
  assert.equal(interactionAgentHandles().length, 6)
})
