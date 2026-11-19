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

test('status banner stays below navigation overlays and wraps long incident copy', async () => {
  const [banner, header] = await Promise.all([
    read('../app/(site)/components/SiteStatusBanner.jsx'),
    read('../app/(site)/components/SiteHeader.jsx'),
  ])
  assert.match(banner, /z-\[110\]/)
  assert.match(header, /site-header fixed[^\n]+z-\[120\]/)
  assert.match(banner, /sm:flex-wrap/)
  assert.match(banner, /break-words/)
})

test('status banner can dismiss one incident without hiding future updates', async () => {
  const banner = await read('../app/(site)/components/SiteStatusBanner.jsx')
  assert.match(banner, /aria-label="关闭这条预警"/)
  assert.match(banner, /localStorage\.setItem\(DISMISSED_STATUS_KEY, statusSignature\(status\)\)/)
  assert.match(banner, /localStorage\.getItem\(DISMISSED_STATUS_KEY\) === statusSignature\(data\)/)
  assert.match(banner, /status\.startedAt/)
})

test('monitor route is secret protected and status storage is independent from D1', async () => {
  const [monitor, store, workflow, runbook, wrangler, worker] = await Promise.all([
    read('../app/api/site-status/monitor/route.js'),
    read('../lib/site/siteStatusStore.js'),
    read('../.github/workflows/site-status-monitor.yml'),
    read('../docs/runbooks/site-status-automation.md'),
    read('../workers/site-status-scheduler/wrangler.jsonc'),
    read('../workers/site-status-scheduler/src/index.js'),
  ])
  assert.match(monitor, /x-site-status-secret/)
  assert.match(monitor, /safeEqual/)
  assert.match(store, /CONTENT_FEED/)
  assert.doesNotMatch(store, /env\?\.DB|getD1/)
  assert.doesNotMatch(workflow, /cron: '\*\/5 \* \* \* \*'/)
  assert.match(workflow, /cron: '17,47 \* \* \* \*'/)
  assert.match(workflow, /备份探活，不是主心跳/)
  assert.match(wrangler, /"crons": \["\*\/5 \* \* \* \*"\]/)
  assert.match(worker, /runIndependentProbes/)
  assert.match(runbook, /主跑手.*site-status-scheduler/s)
  assert.match(runbook, /现在还没有上线/)
  assert.match(runbook, /每 30 分钟/)
})

test('admin navigation exposes incidents through the unified operations center', async () => {
  const routes = await read('../lib/admin/adminRoutes.js')
  assert.match(routes, /href: '\/admin\/site-health\?tab=incidents'[\s\S]*label: '故障公告'/)
  assert.match(routes, /'\/admin\/site-status': '\/admin\/site-health\?tab=incidents'/)
})
