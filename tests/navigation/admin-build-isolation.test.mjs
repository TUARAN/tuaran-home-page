import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const adminBuildSource = await readFile(
  new URL('../../scripts/build-admin-pages.cjs', import.meta.url),
  'utf8'
)

test('admin build keeps the notifications API without its public scheduled child route', () => {
  assert.match(adminBuildSource, /KEPT_API_DIRECTORY_ENTRIES/)
  assert.match(adminBuildSource, /\['notifications', new Set\(\['route\.js'\]\)\]/)
  assert.match(adminBuildSource, /for \(const \[directory, keptEntries\] of KEPT_API_DIRECTORY_ENTRIES\)/)
})
