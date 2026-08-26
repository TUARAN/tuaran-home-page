import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(
  new URL('../../app/(site)/articles/ArticlesHeaderClient.jsx', import.meta.url),
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

test('article header reads one random quote from the public API', () => {
  assert.match(headerSource, /useTheme\(\)/)
  assert.match(headerSource, /fetch\('\/api\/quotes'/)
  assert.match(headerSource, /\[refreshQuote, resolvedTheme\]/)
  assert.match(headerSource, /quote \? <div/)
  assert.doesNotMatch(headerSource, /sessionStorage|exclude=/)
  assert.doesNotMatch(headerSource, /千里之行/)
  assert.doesNotMatch(headerSource, /从主题开始浏览|会在需要时出现/)
})

test('article header does not expose manual quote refresh controls', () => {
  assert.doesNotMatch(headerSource, /onClick=\{refreshQuote\}/)
  assert.doesNotMatch(headerSource, /换一句名言|刷新名言|IconRefresh/)
})
