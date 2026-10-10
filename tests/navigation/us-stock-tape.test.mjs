import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

test('当下标的 is a banner entry on Markets & Web3 and stays in the sitemap', async () => {
  const [nav, page, sidebar] = await Promise.all([
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/web3/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/web3/Web3Sidebar.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(nav, /href: '\/web3\/us-stocks', label: '美股走势'/)
  assert.match(page, /href="\/web3\/us-stocks"[\s\S]*当下标的/)
  assert.doesNotMatch(page, /id="us-stocks"/)
  assert.doesNotMatch(sidebar, /us-stocks/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/web3/us-stocks' && entry.sitemap))
})
