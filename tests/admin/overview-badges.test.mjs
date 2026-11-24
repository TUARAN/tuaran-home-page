import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { loadAdminBadges } from '../../lib/admin/badgeCounts.mjs'

function fakeDb({ users = 0, failWith = null, onQuery = () => {} } = {}) {
  return {
    prepare(sql) {
      onQuery(sql)
      return {
        first: async () => {
          if (failWith) throw failWith
          return { users }
        },
      }
    },
  }
}

test('徽标计数只查 site_users 的 COUNT', async () => {
  const queries = []
  const badges = await loadAdminBadges(fakeDb({ users: 44, onQuery: (sql) => queries.push(sql) }))
  assert.deepEqual(badges, { users: 44 })
  assert.equal(queries.length, 1)
  assert.match(queries[0], /COUNT\(\*\) AS users FROM site_users/)
  assert.doesNotMatch(queries[0], /research_pv_hits/)
})

test('读不到表时返回 0，不抛错', async () => {
  assert.deepEqual(await loadAdminBadges(fakeDb({ failWith: new Error('no such table: site_users') })), { users: 0 })
  assert.deepEqual(await loadAdminBadges(null), { users: 0 })
})

test('overview 路由把 badges 分支放在整表聚合之前', async () => {
  const source = await readFile(new URL('../../app/api/admin/overview/route.js', import.meta.url), 'utf8')
  assert.match(source, /searchParams\.get\('fields'\) === 'badges'/)
  assert.match(source, /readThroughEdgeCache\('admin:overview:badges'/)
  assert.match(source, /loadAdminBadges\(db\)/)

  const badgesBranch = source.indexOf('if (wantBadgesOnly)')
  const aggregation = source.indexOf('FROM research_pv_hits')
  assert.ok(badgesBranch > 0, 'badges 分支应存在')
  assert.ok(aggregation > 0, '完整总览聚合应保留')
  assert.ok(badgesBranch < aggregation, 'badges 分支必须在整表聚合之前返回')
})

test('后台侧栏请求只取 badges 字段', async () => {
  const shell = await readFile(new URL('../../app/(admin)/components/AdminShell.jsx', import.meta.url), 'utf8')
  assert.match(shell, /fetch\('\/api\/admin\/overview\?fields=badges'/)
})
