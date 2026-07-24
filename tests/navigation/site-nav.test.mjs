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
