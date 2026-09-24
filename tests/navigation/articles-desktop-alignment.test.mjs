import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('desktop article feed ignores spacing from hidden filter controls', async () => {
  const source = await readFile(
    new URL('../../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /flex min-w-0 flex-col gap-4 md:mt-3 lg:mt-0/)
  assert.doesNotMatch(source, /min-w-0 space-y-4 md:mt-3 lg:mt-0/)
})
