import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as engine from '../../lib/homeRecommendationEngine.js'

const require = createRequire(import.meta.url)
const { transform } = require('next/dist/build/swc')
const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
const dependencies = {
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': Link,
  'next/navigation': { useRouter: () => ({ push() {} }) },
  '@tabler/icons-react': new Proxy({}, { get: () => () => null }),
  '../../../lib/homeRecommendationEngine': engine,
  '../../../lib/siteAnalytics': { trackSiteEvent() {} },
  './H5PullToRefresh': ({ children }) => children,
  './LocaleProvider': { T: ({ zh }) => zh },
}

async function loadComponent(name) {
  const source = await readFile(new URL(`../../app/(site)/components/${name}.jsx`, import.meta.url), 'utf8')
  const { code } = await transform(source, {
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)((id) => {
    assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`)
    return dependencies[id]
  }, module, module.exports)
  return module.exports.default
}

const Reading = await loadComponent('HomeFeaturedReadingClient')
dependencies['./HomeFeaturedReadingClient'] = Reading
const Columns = await loadComponent('HomePrimaryColumnsClient')
const catalog = Array.from({ length: 24 }, (_, index) => ({
  id: `column:entry-${index}`, section: 'column', sectionLabel: '创作',
  title: `首屏文章 ${index}`, summary: `文章摘要 ${index}`, href: `/articles/entry-${index}`,
  date: '2026-09-10', sortKey: '2026-09-10',
}))
const props = {
  catalog,
  inspirations: [{ id: 'first-spark', date: '2026-09-10', title: '首屏灵感', summary: '无需等待推荐接口' }],
  pinnedInspirationIds: ['first-spark'],
}

test('server HTML contains readable recommendations and inspirations before any network effects', () => {
  const html = renderToStaticMarkup(React.createElement(Columns, props))
  assert.match(html, /首屏文章/)
  assert.match(html, /首屏灵感/)
  assert.match(html, /href="\/feed\/first-spark"/)
  assert.doesNotMatch(html, /skeleton|invisible|aria-hidden="true"[^>]*>首屏|正在加载/)
})

test('inspirations remain readable even when the recommendation catalog is empty', () => {
  const html = renderToStaticMarkup(React.createElement(Columns, { ...props, catalog: [] }))
  assert.match(html, /首屏灵感/)
  assert.doesNotMatch(html, /skeleton|invisible|aria-busy="true"/)
})

test('initial recommendations are deterministic for matching server and hydration renders', () => {
  const first = renderToStaticMarkup(React.createElement(Reading, { catalog }))
  const second = renderToStaticMarkup(React.createElement(Reading, { catalog }))
  assert.equal(first, second)
})

test('home featured reading keeps the first painted batch after the recommendation API returns', async () => {
  const [clientSource, catalogSource, knowledgeSource] = await Promise.all([
    readFile(new URL('../../app/(site)/components/HomeFeaturedReadingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/homeRecommendationCatalogCore.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/researchKnowledgeItem.js', import.meta.url), 'utf8'),
  ])
  assert.match(clientSource, /mergeHomeRecommendationCatalog/)
  assert.match(clientSource, /selectHomeRecommendationItems/)
  assert.match(clientSource, /firstBatchLockedRef/)
  assert.match(clientSource, /getHomeRecommendationRotateDelayMs/)
  assert.doesNotMatch(clientSource, /syncAutomaticBatch/)
  assert.doesNotMatch(clientSource, /if \(Array\.isArray\(data\?\.catalog\)\) setCatalog\(data\.catalog\)/)
  assert.match(catalogSource, /researchPublicSummary\(entry\)/)
  assert.match(knowledgeSource, /researchPublicSummary\(entry\)/)
})
