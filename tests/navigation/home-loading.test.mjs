import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as engine from '../../lib/home/homeRecommendationEngine.js'
import * as coverPattern from '../../lib/home/homeCoverPattern.js'

const require = createRequire(import.meta.url)
const { transform } = require('next/dist/build/swc')
const Link = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)
const dependencies = {
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': Link,
  'next/navigation': { useRouter: () => ({ push() {} }) },
  '@tabler/icons-react': new Proxy({}, { get: () => () => null }),
  '../../../lib/home/homeRecommendationEngine': engine,
  '../../../lib/home/homeCoverPattern': coverPattern,
  '../../../lib/site/siteAnalytics': { trackSiteEvent() {} },
  '../../../lib/home/homeAuthority': { HOME_OBSERVATION_ENTRY_LINKS: [] },
  './H5PullToRefresh': ({ children }) => children,
  './HomeSectionCouplet': () => null,
  './LocaleProvider': { T: ({ zh }) => zh },
}

async function loadComponent(name) {
  const source = await readFile(new URL(`../../app/(site)/components/${name}.jsx`, import.meta.url), 'utf8')
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

const CoverPattern = (await loadComponent('HomeCoverPattern')).default
dependencies['./HomeCoverPattern'] = CoverPattern
dependencies['./HomeListCover'] = (await loadComponent('HomeListCover')).default
const Reading = (await loadComponent('HomeFeaturedReadingClient')).default
dependencies['./HomeFeaturedReadingClient'] = Reading
const { default: Columns, HomeInspirations } = await loadComponent('HomePrimaryColumnsClient')
const catalog = Array.from({ length: 24 }, (_, index) => ({
  id: `column:entry-${index}`, section: 'column', sectionLabel: '创作',
  title: `首屏文章 ${index}`, summary: `文章摘要 ${index}`, href: `/articles/entry-${index}`,
  date: '2026-09-10', sortKey: '2026-09-10',
}))
const props = {
  catalog,
  inspirations: [{ id: 'first-spark', date: '2026-09-10', title: '首屏灵感', summary: '无需等待推荐接口', category: 'ai' }],
}

function renderHomeColumns({ catalog: entries = catalog, inspirations: sparks = props.inspirations } = {}) {
  return renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(Columns, { catalog: entries }),
    React.createElement(HomeInspirations, { items: sparks }),
  ))
}

test('server HTML contains readable recommendations and inspirations before any network effects', () => {
  const html = renderHomeColumns(props)
  assert.match(html, /首屏文章/)
  assert.match(html, /首屏灵感/)
  assert.match(html, /href="\/feed\/first-spark"/)
  assert.doesNotMatch(html, /skeleton|invisible|aria-hidden="true"[^>]*>首屏|正在加载/)
})

test('inspirations remain readable even when the recommendation catalog is empty', () => {
  const html = renderHomeColumns({ ...props, catalog: [] })
  assert.match(html, /首屏灵感/)
  assert.doesNotMatch(html, /skeleton|invisible|aria-busy="true"/)
})

test('homepage inspiration preview keeps two mobile items and shows more on desktop', () => {
  const items = Array.from({ length: 3 }, (_, index) => ({
    id: `spark-${index}`,
    date: '2026-09-10',
    title: `灵感 ${index}`,
    summary: '首页精选',
    category: 'ai',
  }))
  const mobileHtml = renderToStaticMarkup(React.createElement(HomeInspirations, { items, instance: 'mobile' }))
  const desktopHtml = renderToStaticMarkup(React.createElement(HomeInspirations, { items }))
  assert.match(mobileHtml, /灵感 0/)
  assert.match(mobileHtml, /灵感 1/)
  assert.doesNotMatch(mobileHtml, /灵感 2/)
  assert.match(desktopHtml, /灵感 2/)
})

test('home inspiration card has a direct feed link without tabs or a subtitle', () => {
  const html = renderToStaticMarkup(React.createElement(HomeInspirations, { items: props.inspirations }))
  assert.match(html, /href="\/feed"/)
  assert.match(html, /查看全部/)
  assert.doesNotMatch(html, /tablist|tabpanel|随手记下的发现|首页灵感范围/)
})

test('initial recommendations are deterministic for matching server and hydration renders', () => {
  const first = renderToStaticMarkup(React.createElement(Reading, { catalog }))
  const second = renderToStaticMarkup(React.createElement(Reading, { catalog }))
  assert.equal(first, second)
})

test('home article list does not paint a built-in pin before admin settings load', () => {
  const html = renderToStaticMarkup(React.createElement(Reading, {
    catalog: [
      {
        id: 'research:topics:workbuddy-tutorial-resources',
        section: 'research',
        sectionLabel: '实践',
        tagLabel: 'WorkBuddy',
        title: '腾讯 WorkBuddy 免费学习资源',
        summary: '10 份 PDF、50 节视频',
        href: '/articles/research/topics/workbuddy-tutorial-resources',
        date: '2026-08-28',
        sortKey: '2026-08-28T11:18:00',
      },
      ...catalog,
    ],
  }))
  assert.match(html, /腾讯 WorkBuddy 免费学习资源/)
  assert.doesNotMatch(html, /置顶|home-badge-pinned/)
})

test('home article list keeps the latest tab and does not render a latest badge', () => {
  const html = renderToStaticMarkup(React.createElement(Reading, { catalog }))
  assert.match(html, /首屏文章/)
  assert.match(html, /推荐/)
  assert.match(html, /最新/)
  assert.match(html, /资源/)
  assert.match(html, /home-article-scope-ai_dev/)
  assert.match(html, />AI</)
  assert.match(html, /home-article-scope-observation/)
  assert.doesNotMatch(html, /home-badge-latest/)
})

test('server HTML paints one cover per recommendation row before hydration', () => {
  const html = renderToStaticMarkup(React.createElement(Reading, { catalog }))
  const rows = html.match(/class="h5-feed-row home-reading-item group/g) || []
  const covers = html.match(/class="home-reading-cover"><svg class="home-cover-pattern home-cover-tone-(?:accent|blue|green|stone)"/g) || []
  assert.ok(rows.length >= 6, `rows ${rows.length}`)
  assert.equal(covers.length, rows.length)
  assert.match(html, /viewBox="0 0 136 96"/)
})

test('a row with a real cover renders the image instead of a pattern', () => {
  const html = renderToStaticMarkup(React.createElement(Reading, {
    catalog: [
      {
        id: 'column:with-cover',
        section: 'column',
        sectionLabel: '创作',
        title: '带封面的文章',
        href: '/articles/with-cover',
        date: '2026-10-01',
        sortKey: '2026-10-01T00:00:00',
        cover: { src: 'https://example.com/cover.jpg', alt: '带封面的文章 封面' },
      },
      ...catalog,
    ],
  }))
  const row = html.slice(html.indexOf('with-cover"'), html.indexOf('</a>', html.indexOf('with-cover"')))
  assert.match(row, /<img src="https:\/\/example\.com\/cover\.jpg" alt="" loading="lazy"/)
  assert.doesNotMatch(row, /home-cover-pattern/)
})

test('home featured reading keeps the first painted batch after the recommendation API returns', async () => {
  const [clientSource, catalogSource, knowledgeSource] = await Promise.all([
    readFile(new URL('../../app/(site)/components/HomeFeaturedReadingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/home/homeRecommendationCatalogCore.js', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/research/researchKnowledgeItem.js', import.meta.url), 'utf8'),
  ])
  assert.match(clientSource, /mergeHomeRecommendationCatalog/)
  assert.match(clientSource, /selectHomeRecommendationItems/)
  assert.match(clientSource, /firstBatchLockedRef/)
  assert.match(clientSource, /runtimeCatalogReady/)
  assert.doesNotMatch(clientSource, /home-badge-latest/)
  assert.match(clientSource, /getHomeRecommendationRotateDelayMs/)
  assert.doesNotMatch(clientSource, /syncAutomaticBatch/)
  assert.doesNotMatch(clientSource, /if \(Array\.isArray\(data\?\.catalog\)\) setCatalog\(data\.catalog\)/)
  assert.match(catalogSource, /researchPublicSummary\(entry\)/)
  assert.match(knowledgeSource, /researchPublicSummary\(entry\)/)
})
