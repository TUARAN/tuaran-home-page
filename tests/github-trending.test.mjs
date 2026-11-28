import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { TOOL_ITEMS } from '../lib/site/toolItems.js'
import { STATIC_PAGE_REGISTRY } from '../lib/site/staticPageRegistry.mjs'
import {
  fetchTrendingJson,
  formatStarCount,
  GITHUB_TRENDING_FALLBACK_REF,
  GITHUB_TRENDING_MAIN_REF,
  GITHUB_TRENDING_PATH,
  GITHUB_TRENDING_REVALIDATE_SECONDS,
  loadGithubTrending,
  normalizeTrendingDaily,
  normalizeTrendingIndex,
  normalizeTrendingItem,
  resolveSelectedDate,
  HOME_GITHUB_TRENDING_LIMIT,
  homeGithubTrendingBlurb,
  selectHomeGithubTrendingItems,
  trendingJsonUrl,
  isTrendingMonthKey,
  shiftTrendingMonth,
  trendingMonthMatrix,
} from '../lib/page-data/githubTrending.js'

const INDEX = {
  latest: '2026-11-17',
  dates: ['2026-11-16', '2026-11-17'],
}

const DAILY = {
  date: '2026-11-17',
  generated_at: '2026-11-17T17:29:20+08:00',
  timezone: 'Asia/Shanghai',
  sources: ['github-trending-daily'],
  count: 2,
  items: [
    {
      full_name: 'ag-ui-protocol/ag-ui',
      description: 'AG-UI protocol',
      description_zh: 'AG-UI：Agent 与用户交互协议，把 Agent 接入前端应用。',
      language: 'TypeScript',
      stars: 19644,
      url: 'https://github.com/ag-ui-protocol/ag-ui',
      reason: 'GitHub 今日趋势，当天新增 791 star',
    },
    {
      full_name: 'tangerineturtle1/NX2navi',
      description: '',
      language: null,
      stars: 4294,
      url: 'https://github.com/tangerineturtle1/NX2navi',
      reason: '近 14 日新建仓库，星标较多',
    },
  ],
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('index normalization keeps unique dates newest first and repairs latest', () => {
  assert.deepEqual(normalizeTrendingIndex({
    latest: 'nope',
    dates: ['2026-11-16', 'bad', '2026-11-17', '2026-11-16'],
  }), {
    latest: '2026-11-17',
    dates: ['2026-11-17', '2026-11-16'],
  })
})

test('item normalization tolerates empty description and missing language, and rejects unsafe URLs', () => {
  const safe = normalizeTrendingItem(DAILY.items[1])
  assert.equal(safe.fullName, 'tangerineturtle1/NX2navi')
  assert.equal(safe.description, '')
  assert.equal(safe.language, '')
  assert.equal(safe.stars, 4294)
  assert.equal(normalizeTrendingItem({
    full_name: 'owner/repo',
    url: 'javascript:alert(1)',
    description: 'x',
  }).url, 'https://github.com/owner/repo')
  assert.equal(normalizeTrendingItem({
    full_name: '',
    url: 'https://evil.example/owner/repo',
  }), null)
  assert.equal(formatStarCount(19644), '19,644')
  assert.equal(formatStarCount(null), '—')
})

test('description_zh is normalized and preferred for display blurbs with English fallback', () => {
  const withZh = normalizeTrendingItem(DAILY.items[0])
  assert.equal(withZh.descriptionZh, 'AG-UI：Agent 与用户交互协议，把 Agent 接入前端应用。')
  assert.equal(withZh.description, 'AG-UI protocol')
  assert.equal(homeGithubTrendingBlurb(withZh), 'AG-UI：Agent 与用户交互协议，把 Agent 接入前端应用。')

  const withoutZh = normalizeTrendingItem(DAILY.items[1])
  assert.equal(withoutZh.descriptionZh, '')
  assert.equal(homeGithubTrendingBlurb(withoutZh), '近 14 日新建仓库，星标较多')

  const englishFallback = normalizeTrendingItem({
    full_name: 'owner/repo',
    description: 'English only',
    description_zh: '',
    url: 'https://github.com/owner/repo',
  })
  assert.equal(homeGithubTrendingBlurb(englishFallback), 'English only')
})

test('resolveSelectedDate prefers today when listed, otherwise latest, and keeps an explicit requested date', () => {
  const index = normalizeTrendingIndex(INDEX)
  assert.equal(resolveSelectedDate(index, '', new Date('2026-11-17T01:00:00+08:00')), '2026-11-17')
  assert.equal(resolveSelectedDate(index, '', new Date('2026-11-18T01:00:00+08:00')), '2026-11-17')
  assert.equal(resolveSelectedDate(index, '2026-11-16', new Date('2026-11-17T01:00:00+08:00')), '2026-11-16')
  assert.equal(resolveSelectedDate(index, '2026-11-18', new Date('2026-11-17T01:00:00+08:00')), '2026-11-18')
  assert.equal(resolveSelectedDate(index, '../secret', new Date('2026-11-17T01:00:00+08:00')), '')
})

test('daily normalization keeps a fallback date and drops invalid items', () => {
  const daily = normalizeTrendingDaily({
    items: [DAILY.items[0], { full_name: '', url: 'https://example.com' }],
  }, '2026-11-17')
  assert.equal(daily.date, '2026-11-17')
  assert.equal(daily.items.length, 1)
  assert.equal(daily.count, 1)
})

test('fetch prefers main and falls back to the preview branch only when main is missing', async () => {
  const seen = []
  const fetchImpl = async (url, options) => {
    seen.push({ url, revalidate: options?.next?.revalidate })
    if (url.includes(`/${GITHUB_TRENDING_MAIN_REF}/`)) return new Response('Not Found', { status: 404 })
    if (url.includes(`/${GITHUB_TRENDING_FALLBACK_REF}/`)) return jsonResponse(INDEX)
    throw new Error(`unexpected url ${url}`)
  }
  const result = await fetchTrendingJson('index.json', { fetchImpl })
  assert.equal(result.ok, true)
  assert.equal(result.ref, GITHUB_TRENDING_FALLBACK_REF)
  assert.equal(seen[0].url, trendingJsonUrl('index.json', GITHUB_TRENDING_MAIN_REF))
  assert.equal(seen[1].url, trendingJsonUrl('index.json', GITHUB_TRENDING_FALLBACK_REF))
  assert.ok(seen.every((entry) => entry.revalidate === GITHUB_TRENDING_REVALIDATE_SECONDS))
})

test('fetch uses main once it succeeds and does not hard-code only the preview branch', async () => {
  const seen = []
  const fetchImpl = async (url) => {
    seen.push(url)
    if (url.includes(`/${GITHUB_TRENDING_MAIN_REF}/`)) return jsonResponse(INDEX)
    throw new Error(`fallback should not be used: ${url}`)
  }
  const result = await fetchTrendingJson('index.json', { fetchImpl })
  assert.equal(result.ok, true)
  assert.equal(result.ref, GITHUB_TRENDING_MAIN_REF)
  assert.equal(seen.length, 1)
})

test('loadGithubTrending returns an unavailable state for a missing date without throwing', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/index.json')) return jsonResponse(INDEX)
    if (url.endsWith('/2026-11-17.json')) return jsonResponse(DAILY)
    return new Response('Not Found', { status: 404 })
  }
  const missing = await loadGithubTrending({
    date: '2026-11-18',
    now: new Date('2026-11-17T12:00:00+08:00'),
    fetchImpl,
  })
  assert.equal(missing.status, 'unavailable')
  assert.equal(missing.selectedDate, '2026-11-18')
  assert.equal(missing.daily, null)
  assert.deepEqual(missing.dates, ['2026-11-17', '2026-11-16'])

  const ok = await loadGithubTrending({
    now: new Date('2026-11-17T12:00:00+08:00'),
    fetchImpl,
  })
  assert.equal(ok.status, 'ok')
  assert.equal(ok.selectedDate, '2026-11-17')
  assert.equal(ok.daily.items[1].description, '')
  assert.equal(ok.daily.items[1].language, '')
})

test('trending month helpers validate keys, shift across year boundaries, and build a Monday-first grid', () => {
  assert.equal(isTrendingMonthKey('2026-11'), true)
  assert.equal(isTrendingMonthKey('2026-13'), false)
  assert.equal(isTrendingMonthKey('2026-1'), false)
  assert.equal(isTrendingMonthKey('../secret'), false)

  assert.equal(shiftTrendingMonth('2026-01', -1), '2025-12')
  assert.equal(shiftTrendingMonth('2025-12', 1), '2026-01')
  assert.equal(shiftTrendingMonth('2026-07', 0), '2026-07')
  assert.equal(shiftTrendingMonth('bad', 1), '')

  // 2026-11-01 是周日：周一打头的网格前补 6 个空格，30 天后尾部补到 42 格。
  const november = trendingMonthMatrix('2026-11')
  assert.equal(november.length, 42)
  assert.deepEqual(november.slice(0, 6), ['', '', '', '', '', ''])
  assert.equal(november[6], '2026-11-01')
  assert.equal(november[35], '2026-11-30')
  assert.deepEqual(november.slice(36), ['', '', '', '', '', ''])

  // 2024-02 闰月：2 月 1 日是周四，前补 3 格，29 天后尾部补到 35 格。
  const february = trendingMonthMatrix('2024-02')
  assert.equal(february.length, 35)
  assert.deepEqual(february.slice(0, 3), ['', '', ''])
  assert.equal(february[3], '2024-02-01')
  assert.equal(february[31], '2024-02-29')
  assert.deepEqual(february.slice(32), ['', '', ''])

  assert.deepEqual(trendingMonthMatrix('2026-13'), [])
  assert.deepEqual(trendingMonthMatrix(''), [])
})

test('the trending page keeps a server-rendered compact calendar without client components or buttons', async () => {
  const [page, helper] = await Promise.all([
    readFile(new URL('../app/(site)/tools/github-trending/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/page-data/githubTrending.js', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(page, /['"]use client['"]/)
  assert.match(page, /trendingMonthMatrix/)
  assert.match(page, /aria-label="按月历选日期"/)
  assert.match(page, /sm:flex-row sm:items-end/)
  assert.doesNotMatch(page, /mt-5 w-56/)
  // 日历常驻展示，不再折叠，也不保留旧的日期胶囊。
  assert.doesNotMatch(page, /<details|<summary/)
  assert.doesNotMatch(page, /rounded-full border px-3 py-1/)
  assert.match(page, /month=\$\{month\}/)
  assert.doesNotMatch(page, /<button/)
  assert.match(helper, /export function trendingMonthMatrix/)
})

test('the public page is a server-rendered read-only tool entry', async () => {
  const [page, helper, nav] = await Promise.all([
    readFile(new URL('../app/(site)/tools/github-trending/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/page-data/githubTrending.js', import.meta.url), 'utf8'),
    readFile(new URL('../lib/site/siteNav.js', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(page, /['"]use client['"]/)
  assert.match(page, /loadGithubTrending/)
  assert.doesNotMatch(page, /raw\.githubusercontent\.com|api\.github\.com/)
  assert.match(page, /清单只供查阅，不含自动点 star 或自动关注/)
  assert.doesNotMatch(page, /putStar|addStar|watchRepo|followUser|<button/)
  assert.doesNotMatch(page, /api\.github\.com\/user\/starred|api\.github\.com\/user\/following/)
  assert.doesNotMatch(helper, /putStar|addStar|watchRepo|followUser|api\.github\.com/)
  assert.match(helper, /GITHUB_TRENDING_MAIN_REF = 'main'/)
  assert.match(helper, /GITHUB_TRENDING_FALLBACK_REF = 'feat\/daily-trending-digest'/)
  assert.match(nav, /title: '分析'[\s\S]*href: '\/tools\/github-trending'[^}\n]*label: 'GitHub 热门'/)
  assert.equal(TOOL_ITEMS.some((item) => item.id === 'github-trending' && item.type === 'analysis' && item.href === GITHUB_TRENDING_PATH), true)
  assert.ok(STATIC_PAGE_REGISTRY.some((pageEntry) => pageEntry.path === GITHUB_TRENDING_PATH && pageEntry.indexable && pageEntry.sitemap))
  assert.throws(() => trendingJsonUrl('../secrets.json'))
})

test('homepage preview keeps at most five compact items and a quiet empty state', () => {
  const extra = Array.from({ length: 6 }, (_, index) => ({
    fullName: `owner/repo-${index + 1}`,
    url: `https://github.com/owner/repo-${index + 1}`,
    description: index === 1 ? '' : `Desc ${index + 1}`,
    reason: `Reason ${index + 1}`,
    stars: 10 + index,
  }))
  const preview = selectHomeGithubTrendingItems({
    status: 'ok',
    daily: { items: extra },
  })
  assert.equal(HOME_GITHUB_TRENDING_LIMIT, 5)
  assert.equal(preview.length, 5)
  assert.equal(preview[0].fullName, 'owner/repo-1')
  assert.equal(preview.at(-1).fullName, 'owner/repo-5')
  assert.equal(homeGithubTrendingBlurb(preview[0]), 'Desc 1')
  assert.equal(homeGithubTrendingBlurb(preview[1]), 'Reason 2')
  assert.deepEqual(selectHomeGithubTrendingItems({ status: 'index-unavailable', daily: null }), [])
  assert.deepEqual(selectHomeGithubTrendingItems({ status: 'unavailable', daily: { items: extra } }), [])
  assert.deepEqual(selectHomeGithubTrendingItems({ status: 'ok', daily: { items: [] } }), [])
})

test('homepage hosts a compact read-only GitHub trending section after the year notes', async () => {
  const [page, component, helper] = await Promise.all([
    readFile(new URL('../app/(site)/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/components/HomeGithubTrending.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/page-data/githubTrending.js', import.meta.url), 'utf8'),
  ])
  const yearIndex = page.indexOf('<HomeYearSummaryCard')
  const trendingIndex = page.indexOf('<HomeGithubTrending')
  const asideIndex = page.indexOf('home-side-stack hidden lg:block')
  assert.ok(yearIndex >= 0 && trendingIndex > yearIndex)
  assert.ok(asideIndex > trendingIndex)
  assert.match(page, /<HomeGithubTrending \/>/)
  assert.doesNotMatch(page, /hidden lg:block[\s\S]*<HomeGithubTrending/)
  assert.doesNotMatch(component, /['"]use client['"]/)
  assert.match(component, /loadGithubTrending/)
  assert.match(component, /selectHomeGithubTrendingItems/)
  assert.match(component, /查看全部/)
  assert.match(component, /href=\{GITHUB_TRENDING_PATH\}/)
  assert.match(component, /className="home-masonry-item"/)
  assert.doesNotMatch(component, /hidden lg:block|home-side-stack/)
  assert.doesNotMatch(component, /raw\.githubusercontent\.com|api\.github\.com/)
  assert.doesNotMatch(component, /putStar|addStar|watchRepo|followUser|<button/)
  assert.doesNotMatch(helper, /putStar|addStar|watchRepo|followUser|api\.github\.com/)
})
