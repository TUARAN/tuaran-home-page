import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import * as contentTaxonomy from '../../lib/content/contentTaxonomy.js'
import * as coverPattern from '../../lib/home/homeCoverPattern.js'

const require = createRequire(import.meta.url)
const { transform } = require('next/dist/build/swc')
const siteRoot = new URL('../../app/(site)/', import.meta.url)
const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)

// 按源码里逐字出现的 import 路径登记依赖，路径写错会直接报 Unexpected dependency。
const dependencies = {
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': Object.assign(Link, { useLinkStatus: () => ({ pending: false }) }),
  '../../../lib/content/contentTaxonomy': contentTaxonomy,
  '../../../lib/home/homeCoverPattern': coverPattern,
  '../components/CanvasOriginBadge': { __esModule: true, default: () => null },
  '../components/PaidUnlockBadge': { __esModule: true, default: () => null },
  '../../components/loading/LoadingPrimitives': { LoadingDots: () => null },
}

async function load(relPath) {
  const source = await readFile(new URL(relPath, siteRoot), 'utf8')
  const { code } = await transform(source, {
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  const loadedModule = { exports: {} }
  new Function('require', 'module', 'exports', code)((id) => {
    assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`)
    return dependencies[id]
  }, loadedModule, loadedModule.exports)
  return loadedModule.exports
}

const { default: CoverPattern } = await load('components/HomeCoverPattern.jsx')
dependencies['./HomeCoverPattern'] = CoverPattern
const { default: ListCover } = await load('components/HomeListCover.jsx')
dependencies['../components/HomeListCover'] = ListCover
const { default: ArticleListItem } = await load('articles/ArticleListItem.jsx')

const render = (item) => renderToStaticMarkup(React.createElement(ArticleListItem, { item, position: 0 }))
const PATTERN = /<svg class="home-cover-pattern home-cover-tone-(accent|blue|green|stone)"/

const item = (overrides) => ({
  id: 'research:topics:x',
  contentKind: 'analysis',
  subjects: ['humanities_history'],
  title: '标题',
  summary: '摘要',
  href: '/articles/research/topics/x',
  date: '2026-11-23',
  ...overrides,
})

// 目录行的形状与 buildKnowledgeItems 的输出一致：调研多数没有配图，文章与资源都没有。
function directoryFixture() {
  const rows = []
  for (let index = 0; index < 30; index += 1) {
    rows.push(item({
      id: `research:topics:r-${index}`,
      contentKind: 'analysis',
      href: `/articles/research/topics/r-${index}`,
      ...(index % 7 === 0 ? { image: { src: `https://example.com/r-${index}.jpg`, alt: `配图 ${index}` } } : {}),
    }))
  }
  for (let index = 0; index < 8; index += 1) {
    rows.push(item({ id: `post:p-${index}`, contentKind: 'article', href: `/articles/p-${index}` }))
  }
  for (let index = 0; index < 6; index += 1) {
    rows.push(item({ id: `resource:tool:x-${index}`, contentKind: 'resource', href: `/tools/x-${index}` }))
  }
  for (let index = 0; index < 4; index += 1) {
    rows.push(item({ id: `work:w-${index}`, contentKind: 'interactive', href: `/w-${index}` }))
  }
  return rows
}

test('every directory row has a thumbnail, with or without a real image', () => {
  const rows = directoryFixture()
  let withImage = 0
  for (const row of rows) {
    const html = render(row)
    const thumbs = html.match(/class="h5-feed-thumb /g) || []
    assert.equal(thumbs.length, 1, row.id)
    assert.match(html, /grid-cols-\[minmax\(0,1fr\)_72px\]/)
    assert.match(html, /md:grid-cols-\[minmax\(0,1fr\)_136px\]/)
    const covers = html.match(new RegExp(`${PATTERN.source}|<img src="[^"]+" alt="[^"]*" loading="lazy"`, 'g')) || []
    assert.equal(covers.length, 1, row.id)
    if (row.image) {
      withImage += 1
      assert.ok(html.includes(`src="${row.image.src}"`), row.id)
      assert.doesNotMatch(html, PATTERN)
    } else {
      assert.match(html, PATTERN)
    }
  }
  assert.ok(withImage > 0, 'fixture should contain rows with real images')
  assert.ok(withImage < rows.length, 'fixture should contain rows without images')
})

test('rows without an image get a pattern that is stable for the same id and group', () => {
  const first = render(item())
  const again = render(item())
  assert.equal(first, again)
  const tone = PATTERN.exec(first)[1]
  const other = PATTERN.exec(render(item({ id: 'research:topics:y' })))
  assert.ok(HOME_TONES.includes(tone) && HOME_TONES.includes(other[1]))
})

const HOME_TONES = ['accent', 'blue', 'green', 'stone']

test('the pattern changes with the content group so types read differently', () => {
  const toneOf = (contentKind) => PATTERN.exec(render(item({ contentKind })))[1]
  const tones = new Set(['article', 'analysis', 'resource', 'interactive'].map(toneOf))
  assert.ok(tones.size >= 2, [...tones].join(','))
})

test('the homepage featured list stays text-only and the stylesheet keeps the pattern rules', async () => {
  const [reading, catalogCore, pattern, stylesheet] = await Promise.all([
    readFile(new URL('components/HomeFeaturedReadingClient.jsx', siteRoot), 'utf8'),
    readFile(new URL('../../lib/home/homeRecommendationCatalogCore.js', import.meta.url), 'utf8'),
    readFile(new URL('components/HomeCoverPattern.jsx', siteRoot), 'utf8'),
    readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(reading, /HomeListCover|home-reading-cover/)
  assert.doesNotMatch(reading, /home-reading-meta[\s\S]{0,400}?\.(cover|image)/)
  assert.doesNotMatch(catalogCore, /homeCoverPattern|cover:/)
  assert.match(reading, /home-reading-meta \$\{isPinned \? '' : 'hidden md:flex'\}/)
  const shapes = pattern.match(/\n  \/\/ .+\n  \(\) => \(/g) || []
  assert.equal(shapes.length, 10)
  assert.match(stylesheet, /\.h5-feed-thumb svg \{/)
  assert.doesNotMatch(stylesheet, /\.home-reading-cover/)
  for (const tone of HOME_TONES) {
    assert.ok(pattern.includes(`'home-cover-tone-${tone}'`), `tone class ${tone} must be written out literally`)
    assert.match(stylesheet, new RegExp(`\\.home-cover-tone-${tone} \\{`))
  }
})
