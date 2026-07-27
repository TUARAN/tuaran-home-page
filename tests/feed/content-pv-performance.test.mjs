import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const BEACON_PATH = new URL('../../app/(site)/components/ContentPvBeacon.jsx', import.meta.url)
const PV_ROUTE_PATH = new URL('../../app/api/research-pv/route.js', import.meta.url)
const CLEANUP_ROUTE_PATH = new URL('../../app/api/maintenance/research-pv-hits/route.js', import.meta.url)
const CLEANUP_WORKFLOW_PATH = new URL('../../.github/workflows/research-pv-cleanup.yml', import.meta.url)

test('displayed reading count is read independently with cache and a bounded loading state', async () => {
  const source = await readFile(BEACON_PATH, 'utf8')
  const getPosition = source.indexOf('fetch(`/api/research-pv?keys=')
  const postPosition = source.indexOf("fetch('/api/research-pv', {")

  assert.match(source, /const DISPLAY_TIMEOUT_MS = 3_000/)
  assert.match(source, /const PV_CACHE_TTL_MS = 30_000/)
  assert.match(source, /content-pv-cache:/)
  assert.match(source, /controller\.abort\(\)/)
  assert.ok(getPosition >= 0 && postPosition > getPosition, 'read request should start before background write')
  assert.doesNotMatch(source, /request\s*=\s*fetch/)
})

test('page-view writes no longer clean history in the reader request', async () => {
  const source = await readFile(PV_ROUTE_PATH, 'utf8')

  assert.doesNotMatch(source, /DELETE FROM research_pv_hits/)
  assert.match(source, /stale-while-revalidate=60/)
})

test('expired reading history is cleaned by a protected daily workflow', async () => {
  const [route, workflow] = await Promise.all([
    readFile(CLEANUP_ROUTE_PATH, 'utf8'),
    readFile(CLEANUP_WORKFLOW_PATH, 'utf8'),
  ])

  assert.match(route, /x-pv-cleanup-secret/)
  assert.match(route, /DELETE FROM research_pv_hits WHERE created_at < \?1/)
  assert.match(route, /const HIT_RETENTION_MS = 120 \* DAY_MS/)
  assert.match(workflow, /cron: '23 18 \* \* \*'/)
  assert.match(workflow, /\/api\/maintenance\/research-pv-hits/)
})
