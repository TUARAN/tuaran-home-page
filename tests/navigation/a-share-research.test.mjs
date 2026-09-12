import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('A股调研模板与策略默认折叠', async () => {
  const client = await readFile(new URL('../../app/(site)/a-share-research/AShareResearchClient.jsx', import.meta.url), 'utf8')
  assert.match(client, /当前调研模板与策略/)
  assert.match(client, /<details className="group mt-7/)
  assert.doesNotMatch(client, /<details[^>]*\sopen/)
  assert.match(client, /查看模板/)
  assert.match(client, /十段式公司观察/)
})

test('A股调研 is a content submenu and a sitemap route', async () => {
  const [nav, sitemap] = await Promise.all([
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/sitemap-static/sitemap.js', import.meta.url), 'utf8'),
  ])

  assert.match(nav, /href: '\/a-share-research', label: 'A股调研'/)
  assert.match(nav, /p\?\.startsWith\('\/a-share-research'\)/)
  assert.match(sitemap, /'\/a-share-research'/)
})

test('A股调研 page aggregates existing company research', async () => {
  const [page, client] = await Promise.all([
    readFile(new URL('../../app/(site)/a-share-research/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/a-share-research/AShareResearchClient.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(page, /listResearch\(\)/)
  assert.match(page, /filter\(isAShareCompanyObservation\)/)
  assert.match(page, /\/articles\/research\/companies\//)
  assert.match(page, /A_SHARE_RESEARCH_TEMPLATE_VERSION/)
  assert.match(page, /template\.status === 'active'/)
  assert.match(client, /当前调研模板与策略/)
  assert.match(client, /十段式公司观察/)
  assert.match(client, /自动草稿保留 72 小时人工复核窗口/)
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
