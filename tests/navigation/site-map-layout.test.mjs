import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../app/(site)/map/page.jsx', import.meta.url), 'utf8')

test('site map sections use the full content width without a fixed duplicate sidebar', () => {
  assert.doesNotMatch(source, /lg:grid-cols-\[260px_minmax\(0,1fr\)\]/)
  assert.doesNotMatch(source, /Primary Path/)
  assert.match(source, /visibleSections\.length > 1 \? 'md:grid-cols-2'/)
})

test('unpaired site map groups expand across the final row', () => {
  assert.match(source, /visibleSections\.length % 2 === 1/)
  assert.match(source, /'md:col-span-2'/)
  assert.match(source, /'sm:grid-cols-2 xl:grid-cols-3'/)
})
