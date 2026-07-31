import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8')

test('public content navigation is organized by entry, goal and topic', () => {
  assert.match(source, /title: '入口'[\s\S]*href: '\/#start-here'/)
  assert.match(source, /title: '按用途'[\s\S]*href: '\/articles\?group=analysis'/)
  assert.match(source, /title: '按主题'[\s\S]*href: '\/articles\?subject=ai_dev'/)
  assert.match(source, /href: '\/articles\?entity=company'/)
  assert.match(source, /href: '\/articles\?delivery=subscribe'/)
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
  assert.equal(featuredEntries.length, 5)
  assert.match(source, /href: '\/#start-here'[^}\n]*featured: true/)
  assert.match(source, /href: '\/tools'[^}\n]*featured: true/)
  assert.match(source, /href: '\/works'[^}\n]*featured: true/)
  assert.match(source, /href: '\/community'[^}\n]*featured: true/)
  assert.match(source, /href: '\/site'[^}\n]*featured: true/)
})
