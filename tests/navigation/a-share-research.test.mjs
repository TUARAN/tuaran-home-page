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
  assert.match(page, /filter\(isAShareCompanyObservation\)/)
  assert.match(page, /\/articles\/research\/companies\//)
})

test('A股条目从普通公司调研目录和推荐链路中隔离', async () => {
  const [directory, detail] = await Promise.all([
    readFile(new URL('../../app/(site)/articles/buildKnowledgeItems.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/articles/research/[category]/[slug]/page.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(directory, /filter\(\(entry\) => !isAShareResearchEntry\(entry\)\)/)
  assert.match(directory, /subjects: \['business_market'\][\s\S]*title: 'A股调研'/)
  assert.match(detail, /isAShareResearch[\s\S]*\? '\/a-share-research'/)
  assert.match(detail, /relatedPool\.filter\(isAShareCompanyObservation\)/)
  assert.match(detail, /!isAShareResearchEntry\(e\)/)
})
