import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { fetchPublicSiteTrafficSummary } from '../../lib/site/umamiShareStats.mjs'

const [route, footer, trafficPage] = await Promise.all([
  readFile(new URL('../../app/api/site-traffic-stats/route.js', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/SiteFooterTrafficStats.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/traffic/page.jsx', import.meta.url), 'utf8'),
])

test('site-traffic-stats falls back to D1 when Umami is unavailable', async () => {
  const db = {
    prepare(sql) {
      const normalized = String(sql).replace(/\s+/g, ' ').trim()
      return {
        bind() {
          return this
        },
        async first() {
          if (normalized.includes('COUNT(DISTINCT')) return { total: 12 }
          if (normalized.includes('created_at >=')) return { total: 5 }
          return { total: 99 }
        },
      }
    },
  }

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => null,
  })

  try {
    const payload = await fetchPublicSiteTrafficSummary({}, Date.now(), db)
    assert.equal(payload.status, 'ok')
    assert.equal(payload.source, 'internal')
    assert.equal(payload.fallback, true)
    assert.equal(payload.metricKind, 'qualified-reads')
    assert.equal(payload.detailPath, '/traffic#qualified-reads')
    assert.equal(payload.totalPv, 99)
    assert.equal(payload.weekPv, 5)
    assert.equal(payload.weekUv, 12)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('footer and traffic page document the fallback link and qualified-read anchor', () => {
  assert.match(route, /fetchPublicSiteTrafficSummary\(getIntegrationEnv\(\), Date\.now\(\), db\)/)
  assert.match(footer, /stats\?\.fallback/)
  assert.match(footer, /\/traffic#qualified-reads/)
  assert.match(footer, /有效阅读/)
  assert.match(trafficPage, /id="qualified-reads"/)
  assert.match(trafficPage, /TrafficSourceNotice/)
})