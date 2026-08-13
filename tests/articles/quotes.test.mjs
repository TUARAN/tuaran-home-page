import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { FAMOUS_QUOTES } from '../../lib/famousQuotes.js'

const headerSource = await readFile(
  new URL('../../app/(site)/articles/ArticlesHeaderClient.jsx', import.meta.url),
  'utf8',
)
const routeSource = await readFile(new URL('../../app/api/quotes/route.js', import.meta.url), 'utf8')

test('quote collection stays short and has stable unique identifiers', () => {
  assert.equal(FAMOUS_QUOTES.length, 100)
  assert.equal(new Set(FAMOUS_QUOTES.map((quote) => quote.id)).size, FAMOUS_QUOTES.length)
  assert.equal(
    new Set(FAMOUS_QUOTES.map((quote) => `${quote.text}\u0000${quote.author}`)).size,
    FAMOUS_QUOTES.length,
  )
  for (const quote of FAMOUS_QUOTES) {
    assert.ok(quote.text.length <= 28, `${quote.id} is too long`)
    assert.ok(quote.author)
    assert.ok(quote.source)
    assert.match(quote.sourceUrl, /^https:\/\/zh\.wikisource\.org\//)
  }
})

test('quote API avoids the previous quote and disables caching', () => {
  assert.match(routeSource, /id != \?/)
  assert.match(routeSource, /ORDER BY RANDOM\(\)/)
  assert.match(routeSource, /fallbackQuote\(exclude\)/)
  assert.match(routeSource, /'Cache-Control': 'no-store'/)
})

test('article header refreshes its quote when the resolved theme changes', () => {
  assert.match(headerSource, /useTheme\(\)/)
  assert.match(headerSource, /window\.sessionStorage\.getItem\(LAST_QUOTE_KEY\)/)
  assert.match(headerSource, /fetch\(`\/api\/quotes\?exclude=/)
  assert.match(headerSource, /\[refreshQuote, resolvedTheme\]/)
  assert.doesNotMatch(headerSource, /从主题开始浏览|会在需要时出现/)
})

test('article header does not expose manual quote refresh controls', () => {
  assert.doesNotMatch(headerSource, /onClick=\{refreshQuote\}/)
  assert.doesNotMatch(headerSource, /换一句名言|刷新名言|IconRefresh/)
})
