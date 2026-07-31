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
  assert.match(directorySource, /data-analytics-event=\{analyticsEvent\}/)
  assert.doesNotMatch(directorySource, /trackSiteEvent\('search_submit',[\s\S]{0,300}\bquery:/)
})

test('home offers stable goal-based start paths and marks their surface', () => {
  for (const id of ['learn-ai', 'companies', 'practice', 'resources', 'subscribe']) {
    assert.match(homeSource, new RegExp(`id: '${id}'`))
  }
  assert.match(homeSource, /id="start-here"/)
  assert.match(homeSource, /data-analytics-surface="start_path"/)
})
