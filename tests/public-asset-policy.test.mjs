import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluatePublicAssets,
  FILE_COUNT_WARNING,
  MAX_FILE_BYTES,
  PLATFORM_FILE_COUNT_LIMIT,
  REPOSITORY_FILE_COUNT_LIMIT,
} from '../scripts/public-asset-policy.mjs'

test('normal public assets pass without warning', () => {
  const result = evaluatePublicAssets([
    { file: 'favicon.ico', size: 1024 },
    { file: 'images/cover.jpg', size: 2 * 1024 * 1024 },
  ])
  assert.equal(result.fileCount, 2)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, [])
  assert.deepEqual(result.oversized, [])
})

test('a file larger than 25 MiB blocks the build', () => {
  const result = evaluatePublicAssets([
    { file: 'feed/huge.mp4', size: MAX_FILE_BYTES + 1 },
  ])
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /feed\/huge\.mp4/)
  assert.match(result.errors[0], /25\.00 MiB/)
  assert.equal(result.oversized.length, 1)
})

test('file count warning and repository budget sit below the platform cap', () => {
  assert.ok(FILE_COUNT_WARNING < REPOSITORY_FILE_COUNT_LIMIT)
  assert.ok(REPOSITORY_FILE_COUNT_LIMIT < PLATFORM_FILE_COUNT_LIMIT)

  const warning = evaluatePublicAssets(
    Array.from({ length: FILE_COUNT_WARNING }, (_, index) => ({ file: `${index}.txt`, size: 1 })),
  )
  assert.equal(warning.errors.length, 0)
  assert.equal(warning.warnings.length, 1)
  assert.match(warning.warnings[0], /approaching the repository budget/)

  const blocked = evaluatePublicAssets(
    Array.from({ length: REPOSITORY_FILE_COUNT_LIMIT }, (_, index) => ({ file: `${index}.txt`, size: 1 })),
  )
  assert.equal(blocked.warnings.length, 0)
  assert.equal(blocked.errors.length, 1)
  assert.match(blocked.errors[0], /repository budget/)
})
