import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('whitepaper share uses the fixed short URL and its route redirects to the document', async () => {
  const [whitepaper, shortRoute] = await Promise.all([
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/x/page.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(whitepaper, /const shareUrl = 'https:\/\/2aran\.com\/x'/)
  assert.match(whitepaper, /<SharePageButton[^>]*url=\{shareUrl\} exactUrl shorten=\{false\}/)
  assert.match(shortRoute, /permanentRedirect\('\/resources\/big-interaction-whitepaper'\)/)
})
