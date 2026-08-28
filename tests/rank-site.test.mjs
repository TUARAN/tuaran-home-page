import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { RANK_ITEMS, RANK_TIERS } from '../lib/rankData.js'
import { SECONDARY_SITES } from '../lib/secondarySites.js'
import { DOMAIN_REGISTRY, getDomainRecord } from '../lib/domainRegistry.js'

test('rank site exposes a complete five-tier AI list', () => {
  assert.deepEqual(RANK_TIERS.map((tier) => tier.label), ['夯', '顶级', '人上人', 'NPC', '拉完了'])
  assert.ok(RANK_ITEMS.length >= 12)
  assert.ok(RANK_ITEMS.every((item) => RANK_TIERS.some((tier) => tier.id === item.tier)))
  assert.equal(new Set(RANK_ITEMS.map((item) => item.id)).size, RANK_ITEMS.length)
})

test('rank subdomain rewrites its root to the isolated rank route', async () => {
  const middleware = await readFile(new URL('../middleware.js', import.meta.url), 'utf8')
  assert.match(middleware, /RANK_HOST = 'rank\.2aran\.com'/)
  assert.match(middleware, /host === RANK_HOST && pathname === '\/'/)
  assert.match(middleware, /url\.pathname = '\/rank'/)
  assert.match(middleware, /NextResponse\.rewrite\(url\)/)
})

test('secondary sites explain their intentionally different deployment boundaries', () => {
  const sites = Object.fromEntries(SECONDARY_SITES.map((site) => [site.id, site]))
  assert.match(sites.rank.deployment, /主站 Pages/)
  assert.match(sites.gptplus.deployment, /独立静态站/)
  assert.match(sites.poemcn.deployment, /独立 Worker/)
  assert.ok(SECONDARY_SITES.every((site) => site.deploymentDetail))
})

test('domain registry records DNS, runtime, audience, and activation separately', () => {
  assert.equal(DOMAIN_REGISTRY.length, 10)
  assert.equal(new Set(DOMAIN_REGISTRY.map((item) => item.domain)).size, DOMAIN_REGISTRY.length)
  assert.ok(DOMAIN_REGISTRY.every((item) => item.target && item.platform && item.audience && item.proxy && item.status))
  assert.deepEqual(
    {
      target: getDomainRecord('rank.2aran.com').target,
      proxy: getDomainRecord('rank.2aran.com').proxy,
      status: getDomainRecord('rank.2aran.com').status,
    },
    { target: 'tuaran.pages.dev', proxy: 'proxied', status: 'active' },
  )
})
