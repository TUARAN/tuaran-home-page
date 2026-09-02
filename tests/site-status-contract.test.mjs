import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('site layout renders the status banner for all public routes', async () => {
  const [layout, banner] = await Promise.all([
    read('../app/(site)/layout.jsx'),
    read('../app/(site)/components/SiteStatusBanner.jsx'),
  ])
  assert.match(layout, /<SiteStatusBanner\s*\/>/)
  assert.match(banner, /fetch\('\/api\/site-status'/)
  assert.match(banner, /aria-live=/)
})

test('monitor route is secret protected and status storage is independent from D1', async () => {
  const [monitor, store, workflow] = await Promise.all([
    read('../app/api/site-status/monitor/route.js'),
    read('../lib/siteStatusStore.js'),
    read('../.github/workflows/site-status-monitor.yml'),
  ])
  assert.match(monitor, /x-site-status-secret/)
  assert.match(monitor, /safeEqual/)
  assert.match(store, /CONTENT_FEED/)
  assert.doesNotMatch(store, /env\?\.DB|getD1/)
  assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/)
})

test('admin navigation exposes the incident console', async () => {
  const routes = await read('../lib/adminRoutes.js')
  assert.match(routes, /href: '\/admin\/site-status', label: '故障公告'/)
})
