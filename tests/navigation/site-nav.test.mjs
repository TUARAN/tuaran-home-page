import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8')

test('public content navigation is organized by entry, topic and type', () => {
  const topicIndex = source.indexOf("title: '内容主题'")
  const typeIndex = source.indexOf("title: '内容类型'")
  assert.match(source, /title: '入口'[\s\S]*href: '\/articles'/)
  assert.doesNotMatch(source, /href: '\/#start-here'|label: '从这里开始'/)
  assert.match(source, /title: '内容主题'[\s\S]*href: '\/articles\?subject=ai_dev'/)
  assert.match(source, /href: '\/articles\?subject=product_experience'[\s\S]*label: '产品与体验'/)
  assert.match(source, /href: '\/articles\?subject=business_market'[\s\S]*label: '商业与市场'/)
  assert.match(source, /href: '\/articles\?subject=company_research'[\s\S]*label: '公司调研'/)
  assert.doesNotMatch(source, /product_business|产品与商业/)
  assert.match(source, /href: '\/articles\?subject=life_family'/)
  assert.match(source, /title: '内容类型'[\s\S]*href: '\/articles\?group=article'/)
  assert.match(source, /title: '内容类型'[\s\S]*href: '\/rich-pages'[^}\n]*label: '互动'/)
  assert.match(source, /title: '内容类型'[\s\S]*href: '\/articles\?group=resource'/)
  assert.ok(topicIndex >= 0 && topicIndex < typeIndex)
  assert.doesNotMatch(source, /title: '按用途'/)
  assert.doesNotMatch(source, /label: '学习与入门'|label: '深度理解'|label: '获取资料'/)
})

test('different taxonomy dimensions are not presented as one resource hierarchy', () => {
  assert.doesNotMatch(source, /label: '内容资源'/)
  assert.doesNotMatch(source, /label: '国外资源'/)
  assert.doesNotMatch(source, /label: '下载资源'/)
  assert.doesNotMatch(source, /href: '\/articles\?tab=/)
  assert.match(source, /href: '\/resources\/rss'[^}\n]*nav: false/)
})

test('every public channel defines one featured overview entry in its grid', () => {
  const featuredEntries = source.match(/^\s+\{[^\n]*featured: true/gm) || []
  assert.equal(featuredEntries.length, 4)
  assert.match(source, /href: '\/tools'[^}\n]*featured: true/)
  assert.match(source, /href: '\/works'[^}\n]*featured: true/)
  assert.match(source, /href: '\/community'[^}\n]*featured: true/)
  assert.match(source, /href: '\/help'[^}\n]*featured: true/)
})
