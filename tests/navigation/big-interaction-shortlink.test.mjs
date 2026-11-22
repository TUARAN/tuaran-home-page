import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('whitepaper share uses the fixed short URL and its route redirects to the document', async () => {
  const [whitepaper, shortRoute] = await Promise.all([
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/[code]/route.js', import.meta.url), 'utf8'),
  ])

  assert.match(whitepaper, /const shareUrl = 'https:\/\/x\.2aran\.com\/theory'/)
  assert.match(whitepaper, /<SharePageButton[^>]*url=\{shareUrl\} exactUrl shorten=\{false\}/)
  assert.match(shortRoute, /code === 'x'/)
  assert.match(shortRoute, /Response\.redirect\(new URL\('https:\/\/x\.2aran\.com\/theory'\), 308\)/)
})
