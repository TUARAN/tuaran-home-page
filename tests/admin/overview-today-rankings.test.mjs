import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('总览 API 返回今日阅读与用户排行', async () => {
  const route = await readFile(new URL('../../app/api/admin/overview/route.js', import.meta.url), 'utf8')
  const dashboard = await readFile(
    new URL('../../app/(admin)/admin/AdminDashboardClient.jsx', import.meta.url),
    'utf8',
  )
  assert.match(route, /loadOverviewTodayRankings/)
  assert.match(route, /today:\s*todayRankings/)
  assert.match(dashboard, /today\?\.topContent/)
  assert.match(dashboard, /today\?\.topReaders/)
  assert.match(dashboard, /今日阅读与用户/)
})