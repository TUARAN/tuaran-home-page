import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const headerSource = await readFile(
  new URL('../../app/(site)/articles/ArticlesHeaderClient.jsx', import.meta.url),
  'utf8',
)
const routeSource = await readFile(new URL('../../app/api/quotes/route.js', import.meta.url), 'utf8')

test('quote API avoids the previous quote and disables caching', () => {
  assert.match(routeSource, /id != \?/)
  assert.match(routeSource, /ORDER BY RANDOM\(\)/)
  assert.match(routeSource, /quote \? serialize\(quote\) : null/)
  assert.doesNotMatch(routeSource, /famousQuotes/)
  assert.match(routeSource, /'Cache-Control': 'no-store'/)
})

test('article header refreshes its quote when the resolved theme changes', () => {
  assert.match(headerSource, /useTheme\(\)/)
  assert.match(headerSource, /window\.sessionStorage\.getItem\(LAST_QUOTE_KEY\)/)
  assert.match(headerSource, /fetch\(`\/api\/quotes\?exclude=/)
  assert.match(headerSource, /\[refreshQuote, resolvedTheme\]/)
  assert.match(headerSource, /quote \? <div/)
  assert.doesNotMatch(headerSource, /千里之行/)
  assert.doesNotMatch(headerSource, /从主题开始浏览|会在需要时出现/)
})

test('article header does not expose manual quote refresh controls', () => {
  assert.doesNotMatch(headerSource, /onClick=\{refreshQuote\}/)
  assert.doesNotMatch(headerSource, /换一句名言|刷新名言|IconRefresh/)
})
