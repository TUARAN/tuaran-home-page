import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageSource = await readFile(
  new URL('../../app/(site)/articles/page.jsx', import.meta.url),
  'utf8',
)
const routeSource = await readFile(new URL('../../app/api/quotes/route.js', import.meta.url), 'utf8')

test('quote API returns a random enabled generated quote and disables caching', () => {
  assert.match(routeSource, /WHERE enabled = 1/)
  assert.match(routeSource, /ORDER BY RANDOM\(\)/)
  assert.match(routeSource, /quote \? serialize\(quote\) : null/)
  assert.doesNotMatch(routeSource, /famousQuotes/)
  assert.doesNotMatch(routeSource, /exclude/)
  assert.match(routeSource, /'Cache-Control': 'no-store'/)
})

test('articles directory header does not show quotes or a latest-publish shortcut', () => {
  assert.match(pageSource, /内容导航/)
  assert.doesNotMatch(pageSource, /ArticlesHeaderClient|\/api\/quotes|最新发布|\/articles\/published/)
})
