import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL('../../app/(site)/articles/ArticleListItem.jsx', import.meta.url),
  'utf8',
)

test('article directory subject and content type tags use the same pill shape', () => {
  assert.match(
    source,
    /displaySubject[\s\S]*?<span className="inline-flex rounded-full border[\s\S]*?SUBJECT_META/,
  )
  assert.match(source, /truncate rounded-full border px-2 py-\[2px\]/)
  assert.doesNotMatch(source, /displaySubject[\s\S]*?<span className="inline-flex rounded-md border/)
})
