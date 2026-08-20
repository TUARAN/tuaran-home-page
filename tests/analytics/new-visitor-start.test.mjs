import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const analyticsSource = await readFile(
  new URL('../../app/(site)/components/SiteBehaviorAnalytics.jsx', import.meta.url),
  'utf8',
)
const helperSource = await readFile(new URL('../../lib/siteAnalytics.js', import.meta.url), 'utf8')
const directorySource = await readFile(
  new URL('../../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url),
  'utf8',
)
const directoryItemSource = await readFile(
  new URL('../../app/(site)/articles/ArticleListItem.jsx', import.meta.url),
  'utf8',
)
const homeSource = await readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8')

test('new visitor start measurement has an explicit qualified behavior threshold', () => {
  assert.match(analyticsSource, /const ENGAGED_SECONDS = 30/)
  assert.match(analyticsSource, /const ENGAGED_SCROLL_RATIO = 0\.5/)
  assert.match(analyticsSource, /trackSiteEvent\('content_engaged'/)
  assert.match(analyticsSource, /markQualifiedStart\('content_engaged'/)
  assert.match(helperSource, /window\.sessionStorage/)
  assert.match(helperSource, /window\.localStorage/)
  assert.match(helperSource, /time_to_value_seconds/)
  assert.match(helperSource, /__tuaranAnalyticsQueue/)
  assert.match(analyticsSource, /flushSiteEvents/)
})

test('directory measures search, filters and result outcomes without sending raw queries', () => {
  assert.match(directorySource, /trackSiteEvent\('search_submit'/)
  assert.match(directorySource, /query_length:/)
  assert.match(directorySource, /results_count:/)
  assert.match(directorySource, /zero_results:/)
  assert.match(directorySource, /const SEARCH_SUGGESTIONS = \[/)
  assert.match(directorySource, /const SEARCH_SUGGESTIONS = \['AI Agent', '资源', '公司调研', '工程实践'\]/)
  assert.match(directorySource, /runSearch\(query, 'suggested'\)/)
  assert.doesNotMatch(directorySource, /aria-label="内容用途"/)
  assert.match(directoryItemSource, /data-analytics-event=\{analyticsEvent\}/)
  assert.doesNotMatch(directorySource, /trackSiteEvent\('search_submit',[\s\S]{0,300}\bquery:/)
})

test('directory exposes only topic and type filters, in that order', () => {
  const topicIndex = directorySource.indexOf('label="内容主题"')
  const typeIndex = directorySource.indexOf('label="内容类型"')
  assert.ok(topicIndex >= 0 && topicIndex < typeIndex)
  assert.equal(directorySource.match(/<FilterRow\b/g)?.length, 2)
  assert.doesNotMatch(directorySource, /label="系列"|label="细分类型"|label="分析对象"|label="获取方式"/)
  assert.match(directorySource, /const SUBJECT_DISPLAY_GROUPS = \[/)
  assert.match(directorySource, /技术与开发/)
  assert.match(directorySource, /产品与商业/)
  assert.match(directorySource, /创作与工作/)
  assert.match(directorySource, /人文与生活/)
  assert.match(directorySource, /CONTENT_GROUP_KEYS\.filter\(\(key\) => key !== 'all'\)/)
  assert.doesNotMatch(directorySource, /subjectCounts\[key\] > 0|groupCounts\[key\] > 0/)
  assert.doesNotMatch(directorySource, /<details|展开筛选|收起筛选/)
  assert.doesNotMatch(directorySource, /label="不限"/)
  assert.match(directorySource, /onReset=\{\(\) => applyFilters\(\{ subject: 'all' \}/)
  assert.match(directorySource, /onReset=\{\(\) => applyFilters\(\{ group: 'all' \}/)
  assert.match(directorySource, /data-filter-reset/)
  assert.match(directorySource, /border-0 bg-transparent p-0/)
  assert.match(directorySource, /subjectParam === 'product_business' \? 'business_market'/)
  assert.match(directorySource, /aria-label="已选筛选条件"/)
  assert.doesNotMatch(directorySource, /<FilterChip[\s\S]{0,120}\bcount=/)
  assert.doesNotMatch(directorySource, /全部主题|全部对象|全部方式|多维筛选/)
})

test('home offers stable goal-based start paths and marks their surface', () => {
  for (const id of ['learn-ai', 'companies', 'practice', 'interactive', 'resources', 'subscribe']) {
    assert.match(homeSource, new RegExp(`id: '${id}'`))
  }
  assert.match(homeSource, /href: '\/articles\?subject=ai_dev'[\s\S]*title: 'AI 与开发'/)
  assert.match(homeSource, /href: '\/articles\?subject=company_research'[\s\S]*title: '公司调研'/)
  assert.match(homeSource, /href: '\/articles\?group=practice'[\s\S]*title: '工程实践'/)
  assert.match(homeSource, /href: '\/rich-pages'[\s\S]*title: '互动专题'/)
  assert.match(homeSource, /href: '\/articles\?group=resource'[\s\S]*title: '资源'/)
  assert.match(homeSource, /href: '\/frontend-weekly'[\s\S]*title: '前端周看'/)
  assert.doesNotMatch(homeSource, /\?entity=company|\?delivery=subscribe|按使用方式/)
  assert.match(homeSource, /id="start-here"/)
  assert.match(homeSource, /data-analytics-surface="start_path"/)
})
