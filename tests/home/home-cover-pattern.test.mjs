import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  HOME_COVER_PATTERN_COUNT,
  HOME_COVER_TONES,
  homeCoverPattern,
  normalizeHomeCoverSrc,
} from '../../lib/home/homeCoverPattern.js'
import { buildHomeRecommendationCatalog } from '../../lib/home/homeRecommendationCatalogCore.js'
import { chooseHomeRecommendationBatch } from '../../lib/home/homeRecommendationEngine.js'
import { articles } from '../../lib/article/articleMetadata.js'
import { RESEARCH_ENTRY_META } from '../../lib/research/catalog.js'

const realCatalog = buildHomeRecommendationCatalog(articles, Object.values(RESEARCH_ENTRY_META))
const settings = { batchSize: 14, pinnedIds: [] }

test('cover pattern is stable for the same id and in range for every catalog entry', () => {
  assert.ok(realCatalog.length > 200)
  for (const item of realCatalog) {
    const first = homeCoverPattern(item.id, item.section)
    assert.deepEqual(homeCoverPattern(item.id, item.section), first)
    assert.ok(Number.isInteger(first.pattern) && first.pattern >= 0 && first.pattern < HOME_COVER_PATTERN_COUNT, item.id)
    assert.ok(HOME_COVER_TONES.includes(first.tone), `${item.id} tone ${first.tone}`)
    assert.equal(typeof first.flip, 'boolean')
  }
})

test('cover pattern differs between entries and no style dominates the catalog', () => {
  const counts = new Map()
  for (const item of realCatalog) {
    const { pattern } = homeCoverPattern(item.id, item.section)
    counts.set(pattern, (counts.get(pattern) || 0) + 1)
  }
  assert.equal(counts.size, HOME_COVER_PATTERN_COUNT)
  const largestShare = Math.max(...counts.values()) / realCatalog.length
  assert.ok(largestShare < 0.2, `largest pattern share ${largestShare}`)
  const distinct = new Set(realCatalog.map((item) => JSON.stringify(homeCoverPattern(item.id, item.section))))
  assert.ok(distinct.size >= HOME_COVER_PATTERN_COUNT * HOME_COVER_TONES.length)
})

test('every home batch shows several cover styles instead of one repeated pattern', () => {
  for (let batch = 0; batch < 20; batch += 1) {
    const items = chooseHomeRecommendationBatch(realCatalog, settings, batch, [], { includeHighlights: batch === 0 })
    const patterns = new Set(items.map((item) => homeCoverPattern(item.id, item.section).pattern))
    assert.ok(items.length >= 10, `batch ${batch} has ${items.length} items`)
    assert.ok(patterns.size >= 5, `batch ${batch} shows ${patterns.size} patterns`)
  }
})

test('sections lean on their own tone without becoming a single colour', () => {
  const share = (section, tone, ids) => {
    const tones = ids.map((id) => homeCoverPattern(id, section).tone)
    return tones.filter((value) => value === tone).length / tones.length
  }
  const research = share('research', 'blue', realCatalog.filter((item) => item.section === 'research').map((item) => item.id))
  const ids = Array.from({ length: 400 }, (_, index) => `column:x-${index}`)
  const column = share('column', 'accent', ids)
  const resources = share('resources', 'green', ids)
  for (const [name, value] of [['research', research], ['column', column], ['resources', resources]]) {
    assert.ok(value > 0.5 && value < 0.8, `${name} home tone share ${value}`)
  }
})

test('catalog carries cover only for entries with a usable real cover', () => {
  const [withCover, withCoverUrl, without, unsafe] = buildHomeRecommendationCatalog([
    { slug: 'a', title: '甲', date: '2026-01-03', cover: 'https://example.com/a.jpg' },
    { slug: 'b', title: '乙', date: '2026-01-02', coverUrl: '/images/b.webp' },
    { slug: 'c', title: '丙', date: '2026-01-01' },
    { slug: 'd', title: '丁', date: '2025-12-31', cover: 'javascript:alert(1)' },
  ], [])
  assert.deepEqual(withCover.cover, { src: 'https://example.com/a.jpg', alt: '甲 封面' })
  assert.deepEqual(withCoverUrl.cover, { src: '/images/b.webp', alt: '乙 封面' })
  assert.ok(!Object.hasOwn(without, 'cover'))
  assert.ok(!Object.hasOwn(unsafe, 'cover'))
})

test('cover source accepts http(s) and site paths only', () => {
  assert.equal(normalizeHomeCoverSrc(' https://example.com/a.jpg '), 'https://example.com/a.jpg')
  assert.equal(normalizeHomeCoverSrc('/images/a.png'), '/images/a.png')
  for (const value of ['//evil.example/a.jpg', 'data:image/png;base64,AAAA', 'javascript:alert(1)', '', '   ', 42, null, undefined]) {
    assert.equal(normalizeHomeCoverSrc(value), '')
  }
})

test('home list renders a cover slot and the pattern component mirrors the pattern count', async () => {
  const [reading, pattern, stylesheet] = await Promise.all([
    readFile(new URL('../../app/(site)/components/HomeFeaturedReadingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/HomeCoverPattern.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  ])
  assert.match(reading, /home-reading-cover[\s\S]*<HomeListCover item=\{item\} \/>/)
  assert.match(reading, /home-reading-meta \$\{isPinned \? '' : 'hidden md:flex'\}/)
  const shapes = pattern.match(/\n  \/\/ .+\n  \(\) => \(/g) || []
  assert.equal(shapes.length, HOME_COVER_PATTERN_COUNT)
  assert.match(stylesheet, /\.home-reading-item \{\s*@apply grid grid-cols-\[minmax\(0,1fr\)_72px\]/)
  for (const tone of HOME_COVER_TONES) {
    assert.ok(pattern.includes(`'home-cover-tone-${tone}'`), `tone class ${tone} must be written out literally`)
    assert.match(stylesheet, new RegExp(`\\.home-cover-tone-${tone} \\{`))
  }
})
