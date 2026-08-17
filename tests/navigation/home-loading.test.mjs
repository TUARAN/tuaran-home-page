import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [pageSource, columnsSource, readingSource] = await Promise.all([
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomePrimaryColumnsClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomeFeaturedReadingClient.jsx', import.meta.url), 'utf8'),
])

test('homepage article and inspiration columns share one readiness boundary', () => {
  assert.match(pageSource, /<HomePrimaryColumnsClient/)
  assert.match(columnsSource, /onReadyChange=\{handleReadyChange\}/)
  assert.match(columnsSource, /<HomeInspirations[^>]+ready=\{ready\}/)
  assert.match(readingSource, /onReadyChange\?\.\(recommendationsReady\)/)
})

test('homepage inspiration skeleton mirrors cards while content is pending', () => {
  assert.match(columnsSource, /home-inspiration-skeleton/)
  assert.match(columnsSource, /home-inspiration-skeleton-thumbnail/)
  assert.match(columnsSource, /aria-busy=\{!ready\}/)
  assert.match(columnsSource, /ready \? 'opacity-100' : 'invisible opacity-0'/)
})
