import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('A股调研 is a content submenu and a sitemap route', async () => {
  const [nav, sitemap] = await Promise.all([
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/sitemap.js', import.meta.url), 'utf8'),
  ])

  assert.match(nav, /href: '\/a-share-research', label: 'A股调研'/)
  assert.match(nav, /p\?\.startsWith\('\/a-share-research'\)/)
  assert.match(sitemap, /'\/a-share-research'/)
})

test('A股调研 page aggregates existing company research', async () => {
  const page = await readFile(new URL('../../app/(site)/a-share-research/page.jsx', import.meta.url), 'utf8')
  assert.match(page, /listResearch\(\)/)
  assert.match(page, /entry\.companyType === 'a_share'/)
  assert.match(page, /\/articles\/research\/companies\//)
})
