import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { SECONDARY_SITES } from '../lib/secondarySites.js'
import { TOOL_ITEMS } from '../lib/toolItems.js'

const root = new URL('../', import.meta.url)
const [worksSource, sitesSource, sitemapSource] = await Promise.all([
  readFile(new URL('app/(site)/works/page.jsx', root), 'utf8'),
  readFile(new URL('app/(site)/sites/page.jsx', root), 'utf8'),
  readFile(new URL('app/(site)/sitemap.js', root), 'utf8'),
])

test('portfolio distinguishes independent products, built-in tools, and works', () => {
  assert.match(worksSource, /title: '独立产品'/)
  assert.match(worksSource, /title: '站内工具'/)
  assert.match(worksSource, /title: '作品与实验'/)
  assert.match(worksSource, /PRODUCT_WORK_ITEMS/)
  assert.match(worksSource, /SECONDARY_SITES/)
  assert.match(worksSource, /TOOL_ITEMS/)
})

test('every public subsite and every internal tool can enter the unified portfolio', () => {
  assert.ok(SECONDARY_SITES.length > 0)
  assert.ok(SECONDARY_SITES.every((site) => site.domain.endsWith('.2aran.com')))
  const internalTools = TOOL_ITEMS.filter((tool) => !/^https?:\/\//.test(tool.href))
  assert.ok(internalTools.length > 0)
  assert.ok(internalTools.every((tool) => tool.href.startsWith('/')))
})

test('legacy sites directory redirects to works and is absent from the sitemap', () => {
  assert.match(sitesSource, /permanentRedirect\('\/works'\)/)
  assert.doesNotMatch(sitemapSource, /['"]\/sites['"]/)
})
