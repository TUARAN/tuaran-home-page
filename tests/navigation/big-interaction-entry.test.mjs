import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('interactive directory exposes the whitepaper before its filters', async () => {
  const [directory, showcase] = await Promise.all([
    readFile(new URL('../../app/(site)/rich-pages/RichPagesDirectory.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/ShowcaseDirectory.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(directory, /featured=\{[\s\S]*href="\/resources\/big-interaction-whitepaper"/)
  assert.match(directory, /大互动绿皮书/)
  assert.match(showcase, /\{featured \? <section aria-label="精选阅读"[\s\S]*\{config\.categoryTabs \? \(/)
})
