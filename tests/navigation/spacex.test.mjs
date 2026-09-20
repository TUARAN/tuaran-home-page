import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getSpacexTimeline, normalizeLl2Launch, SPACEX_ARCHIVED_LAUNCHES } from '../../lib/spacexTimeline.js'
import { SPACEX_GROK_ARCHIVE_PROMPT } from '../../lib/spacexArchivePrompt.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'

test('SpaceX stays off primary nav and is a homepage easter egg', async () => {
  const [nav, mobileNav, header, page, egg, styles] = await Promise.all([
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/siteMobileNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/HomeSpacexEgg.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(nav, /href: '\/spacex'.*label: 'SpaceX'/)
  assert.doesNotMatch(mobileNav, /key: 'spacex'/)
  assert.doesNotMatch(header, /href="\/spacex"/)
  assert.match(page, /<HomeSpacexEgg/)
  assert.match(page, /spacex-logo\.webp/)
  assert.match(egg, /href=\{SPACEX_HREF\}/)
  assert.match(egg, /prefersReducedMotion/)
  assert.match(egg, /home-spacex-flight/)
  assert.doesNotMatch(egg, /\bdx:/)
  assert.match(styles, /home-spacex-liftoff/)
  assert.match(styles, /\.home-profile-spacex-icon \{[\s\S]{0,40}rotate\(-45deg\)/)
  assert.doesNotMatch(styles, /home-spacex-liftoff[\s\S]{0,420}var\(--dx\)/)
  assert.doesNotMatch(styles, /home-spacex-liftoff[\s\S]{0,420}rotate\(/)
  assert.match(styles, /\.home-profile-spacex-craft,[\s\S]{0,160}\.home-spacex-flight-craft,[\s\S]{0,80}animation: none !important;/)
  assert.ok(STATIC_PAGE_REGISTRY.some((entry) => entry.path === '/spacex' && entry.sitemap))
})

test('Launch Library records normalize into source-backed timeline entries', () => {
  const entry = normalizeLl2Launch({
    id: 'launch-1',
    name: 'Starship | Flight Test',
    net: '2026-08-20T12:00:00Z',
    url: 'https://example.com/launch-1',
    status: { name: 'Go for Launch' },
    pad: { location: { name: 'Starbase' } },
    mission: { description: '<p>Integrated flight test.</p>' },
  }, 'upcoming')

  assert.equal(entry.kind, 'launch')
  assert.equal(entry.topic, 'Starship')
  assert.equal(entry.summary, 'SpaceX 发射任务。发射地点：Starbase。当前状态：发射准备就绪。')
  assert.equal(entry.summaryEn, 'Integrated flight test.')
  assert.equal(entry.originalLanguage, 'en')
  assert.equal(entry.summaryOriginal, 'Integrated flight test.')
  assert.match(entry.summaryTranslated, /发射地点：Starbase/)
  assert.equal(entry.noteEn, 'Schedule subject to change · Starbase')
  assert.equal(entry.phase, 'upcoming')
  assert.equal(entry.sourceUrl, 'https://example.com/launch-1')
})

test('SpaceX timeline keeps editorial entries when the live source fails', async () => {
  const result = await getSpacexTimeline(async () => ({ ok: false, status: 503 }))
  assert.equal(result.launchSourceStatus, 'unavailable')
  assert.ok(result.entries.length >= 5)
  assert.ok(result.entries.some((entry) => entry.id === 'spacex-starlink-15-27-2026-09-20'))
})

test('archived launches keep exact mission facts and playable video', async () => {
  const launch = SPACEX_ARCHIVED_LAUNCHES.find((entry) => entry.id === 'spacex-starlink-15-27-2026-09-20')
  const classifiedLaunch = SPACEX_ARCHIVED_LAUNCHES.find((entry) => entry.id === 'spacex-ussf-259-2026-09-17')
  const client = await readFile(new URL('../../app/(site)/spacex/SpaceXTimelineClient.jsx', import.meta.url), 'utf8')

  assert.equal(launch.publishedAt, '2026-09-20T01:47:00Z')
  assert.match(launch.summaryTranslated, /B1093.*第 17 次飞行/)
  assert.match(launch.summaryTranslated, /整流罩半体完成第 40 次飞行/)
  assert.equal(launch.video.src, '/videos/starlink-15-27-fairing-separation-2026-09-20.mp4')
  assert.equal(classifiedLaunch.publishedAt, '2026-09-17T01:07:56Z')
  assert.match(classifiedLaunch.summaryTranslated, /B1097.*第 13 次飞行/)
  assert.match(classifiedLaunch.summaryTranslated, /任务细节未公开/)
  assert.equal(classifiedLaunch.video.src, '/videos/ussf-259-liftoff-2026-09-17.mp4')
  assert.match(classifiedLaunch.video.postUrl, /^https:\/\/x\.com\/SpaceX\/status\//)
  assert.match(client, /entry\.video\.src/)
  assert.match(client, /entry\.video\.postUrl/)
  assert.match(client, /controls playsInline preload="metadata"/)
  assert.match(client, /id="dashboard"/)
  assert.match(client, /SpaceX 章节与里程碑/)
  assert.match(client, /sticky top-0 max-h-screen/)
  assert.match(client, /aria-current=/)
  assert.match(client, /id="research"/)
  assert.match(client, /href=\{`#\$\{section\.id\}`\}/)
  assert.match(client, /730 场发射/)
  assert.match(client, /System comparison \/ 详细对比/)
  assert.match(client, /SYSTEM_DETAIL_ROWS\.map/)
  assert.match(client, /Falcon 9：约 7\.6 MN/)
  assert.match(client, /Starship 第十三次试飞/)
  assert.match(client, /min-h-\[100svh\]/)
  assert.doesNotMatch(client, /min-h-\[92svh\]/)
})

test('SpaceX dashboard exposes source totals and archive progress', async () => {
  const result = await getSpacexTimeline(async (url) => ({
    ok: true,
    json: async () => ({
      count: url.includes('/previous/') ? 730 : 12,
      results: [],
    }),
  }))

  assert.equal(result.stats.historicalLaunchCount, 730)
  assert.equal(result.stats.archivedVideoCount, 2)
  assert.equal(result.stats.upcomingLaunchCount, 0)
})

test('archived launch replaces the matching recent live-source record', async () => {
  const liveLaunch = {
    id: 'd1471f9d-e9d0-4146-8e97-90863e48bfc8',
    name: 'Falcon 9 Block 5 | Starlink Group 15-27',
    net: '2026-09-20T01:47:00Z',
    url: 'https://example.com/live-starlink-15-27',
    status: { name: 'Launch Successful' },
  }
  const result = await getSpacexTimeline(async () => ({
    ok: true,
    json: async () => ({ results: [liveLaunch] }),
  }))

  const matchingEntries = result.entries.filter((entry) => entry.publishedAt === liveLaunch.net)
  assert.equal(matchingEntries.length, 1)
  assert.equal(matchingEntries[0].id, 'spacex-starlink-15-27-2026-09-20')
  assert.ok(matchingEntries[0].video)
})

test('Grok archive prompt requests a strict, source-backed timeline record', async () => {
  const client = await readFile(new URL('../../app/(site)/spacex/SpaceXTimelineClient.jsx', import.meta.url), 'utf8')

  assert.match(SPACEX_GROK_ARCHIVE_PROMPT, /只输出一个 JSON 代码块/)
  assert.match(SPACEX_GROK_ARCHIVE_PROMPT, /launchedAtUtc/)
  assert.match(SPACEX_GROK_ARCHIVE_PROMPT, /needsVerification/)
  assert.match(SPACEX_GROK_ARCHIVE_PROMPT, /timelineDraft/)
  assert.match(SPACEX_GROK_ARCHIVE_PROMPT, /“首次”“纪录”“第 N 次”/)
  assert.match(client, /navigator\.clipboard\.writeText\(SPACEX_GROK_ARCHIVE_PROMPT\)/)
  assert.match(client, /复制 Grok 归档提示词/)
})
