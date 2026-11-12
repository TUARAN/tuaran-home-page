import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

import { STATIC_PAGE_REGISTRY } from '../../lib/site/staticPageRegistry.mjs'

const dataSource = await readFile(new URL('../../app/(site)/articles/year-summary/yearSummaryData.js', import.meta.url), 'utf8')
const sandbox = {}
vm.runInNewContext(`${dataSource.replaceAll('export ', '')}\nresult = { YEAR_SUMMARY_ARTICLES, YEAR_SUMMARY_COLUMN, getYearSummaryGroups, getYearSummaryStats }`, sandbox)
const {
  YEAR_SUMMARY_ARTICLES,
  YEAR_SUMMARY_COLUMN,
  getYearSummaryGroups,
  getYearSummaryStats,
} = sandbox.result

const [page, diary, home, homeCard, timeline] = await Promise.all([
  readFile(new URL('../../app/(site)/articles/year-summary/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/diary/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomeYearSummaryCard.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/aceternity/timeline.jsx', import.meta.url), 'utf8'),
])

test('year summary stays on the existing Juejin series from mid-2020 through year-end 2025', () => {
  assert.equal(YEAR_SUMMARY_COLUMN.title, '年中年终总结')
  assert.match(YEAR_SUMMARY_COLUMN.subtitle, /2020 年中到 2025 年终/)
  assert.equal(YEAR_SUMMARY_ARTICLES.at(0).title, 'AIGC 的 3 个版本 25 年终总结')
  assert.equal(YEAR_SUMMARY_ARTICLES.at(-1).date, '2020-07-22')
  const groups = getYearSummaryGroups()
  assert.equal(groups.map((group) => group.year).join(','), '2025,2024,2023,2022,2021,2020')
  assert.equal(getYearSummaryStats().articles, YEAR_SUMMARY_ARTICLES.length)
  assert.equal(groups.reduce((sum, group) => sum + group.articles.length, 0), YEAR_SUMMARY_ARTICLES.length)
})

test('/articles/year-summary is a public timeline page instead of a diary redirect', () => {
  assert.doesNotMatch(page, /permanentRedirect|redirect\(/)
  assert.match(page, /from '\.\/yearSummaryData'/)
  assert.match(page, /<Timeline/)
  assert.match(page, /canonical: '\/articles\/year-summary'/)
  assert.match(page, /url: 'https:\/\/2aran\.com\/articles\/year-summary'/)
  assert.match(page, /openGraph/)
  assert.match(page, /application\/ld\+json/)
  assert.match(page, /getYearSummaryGroups\(\)/)
  assert.equal(
    STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/articles/year-summary' && entry.indexable && entry.sitemap),
    true,
  )
})

test('the year-summary subpage uses the Aceternity timeline beam and palette', () => {
  assert.match(timeline, /from 'motion\/react'/)
  assert.match(timeline, /from-purple-500/)
  assert.match(timeline, /via-blue-500/)
  assert.match(timeline, /dark:bg-neutral-950/)
  assert.match(page, /from '\.\.\/\.\.\/components\/aceternity\/timeline'/)
  assert.doesNotMatch(page, /magic-ui|react-chrono|react-vertical-timeline/)
})

test('homepage year-summary block stays on the existing homepage palette', () => {
  assert.match(home, /<HomeYearSummaryCard \/>/)
  assert.match(home, /<HomeDiarySeries preview=\{diaryPreview\} \/>/)
  assert.match(homeCard, /href="\/articles\/year-summary"/)
  assert.match(homeCard, /className="home-work-stack"/)
  assert.match(homeCard, /className="home-section-title"/)
  assert.match(homeCard, /YEAR_SUMMARY_COLUMN/)
  assert.doesNotMatch(homeCard, /from-purple-500|via-blue-500|bg-neutral-950|diary-sheet/)
  assert.doesNotMatch(home, /from-purple-500|via-blue-500|bg-neutral-950/)
})

test('diary keeps a year-summary entry that links to the independent page', () => {
  assert.match(diary, /id="year-summary"/)
  assert.match(diary, /aria-label="年中年终总结"/)
  assert.match(diary, /href="\/articles\/year-summary"/)
  assert.match(diary, /YEAR_SUMMARY_COLUMN\.title/)
  assert.doesNotMatch(diary, /permanentRedirect|from-purple-500|YearSummaryTimelineCard|yearSummaryGroups/)
  assert.match(diary, /selectDiarySeries\(archived, published\)/)
  assert.match(diary, /DIARY_SERIES_STARTED_ON/)
  assert.match(diary, /aria-label="浮生日记时间线"/)
})
