import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8')

test('RSS subscription is a visible second-level item in the public content navigation', () => {
  assert.match(source, /title: '资源'[\s\S]*href: '\/resources\/rss'/)
  assert.match(source, /href: '\/resources\/rss', label: 'RSS 订阅', labelEn: 'RSS Feeds'/)
  assert.doesNotMatch(
    source,
    /href: '\/resources\/rss'[^}\n]*nav: false/,
  )
  assert.match(source, /p\?\.startsWith\('\/resources'\)/)
})

test('every public channel defines one featured overview entry', () => {
  const featuredEntries = source.match(/^\s+\{[^\n]*featured: true/gm) || []
  assert.equal(featuredEntries.length, 5)
  assert.match(source, /href: '\/articles'[^}\n]*featured: true/)
  assert.match(source, /href: '\/tools'[^}\n]*featured: true/)
  assert.match(source, /href: '\/works'[^}\n]*featured: true/)
  assert.match(source, /href: '\/community'[^}\n]*featured: true/)
  assert.match(source, /href: '\/site'[^}\n]*featured: true/)
})

test('detailed filters remain registered but are hidden from the main dropdowns', () => {
  const hiddenPaths = [
    '/articles?tab=posts',
    '/articles?tab=companies',
    '/articles?tab=resources&resource_group=content',
    '/tools#downloads',
    '/tools#x-platform',
    '/ranbi',
  ]

  for (const href of hiddenPaths) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(source, new RegExp(`href: '${escapedHref}'[^}\\n]*nav: false`))
  }
})
