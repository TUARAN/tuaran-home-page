import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getSpacexTimeline, normalizeLl2Launch } from '../../lib/spacexTimeline.js'

test('SpaceX has a standalone header entry and remains a sitemap route', async () => {
  const [nav, mobileNav, header, sitemap] = await Promise.all([
    readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/siteMobileNav.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/sitemap.js', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(nav, /href: '\/spacex'.*label: 'SpaceX'/)
  assert.doesNotMatch(mobileNav, /key: 'spacex'/)
  assert.match(header, /href="\/spacex"/)
  assert.match(header, /spacex-logo\.webp/)
  assert.match(sitemap, /'\/spacex'/)
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
  assert.ok(result.entries.length >= 4)
  assert.ok(result.entries.every((entry) => entry.kind !== 'launch'))
})
