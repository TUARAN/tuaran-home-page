import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const {
  REPOSITORY_RAW_LIMIT_BYTES,
  evaluateWorkerSize,
} = require('../scripts/worker-size-policy.cjs')

function measurement(rawBytes, gzipBytes = Math.floor(rawBytes / 4)) {
  return { rawBytes, gzipBytes, files: [] }
}

test('missing baseline warns without blocking a safely sized Worker', () => {
  const result = evaluateWorkerSize({ measurement: measurement(12 * 1024 * 1024), baseline: null })
  assert.equal(result.errors.length, 0)
  assert.equal(result.warnings.length, 1)
})

test('small build variation passes without warning', () => {
  const baseline = { rawBytes: 12 * 1024 * 1024, gzipBytes: 3 * 1024 * 1024 }
  const result = evaluateWorkerSize({
    measurement: measurement(baseline.rawBytes + 64 * 1024, baseline.gzipBytes + 32 * 1024),
    baseline,
  })
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, [])
})

test('moderate growth emits a diagnostic warning', () => {
  const baseline = { rawBytes: 12 * 1024 * 1024, gzipBytes: 3 * 1024 * 1024 }
  const result = evaluateWorkerSize({
    measurement: measurement(baseline.rawBytes + 256 * 1024, baseline.gzipBytes + 140 * 1024),
    baseline,
  })
  assert.equal(result.errors.length, 0)
  assert.equal(result.warnings.length, 1)
})

test('material raw-size regression blocks the build', () => {
  const baseline = { rawBytes: 10 * 1024 * 1024, gzipBytes: 2.5 * 1024 * 1024 }
  const result = evaluateWorkerSize({
    measurement: measurement(baseline.rawBytes + 600 * 1024, baseline.gzipBytes + 160 * 1024),
    baseline,
  })
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /grew by/)
})

test('repository raw-size hard limit always blocks the build', () => {
  const result = evaluateWorkerSize({
    measurement: measurement(REPOSITORY_RAW_LIMIT_BYTES),
    baseline: null,
  })
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /repository limit/)
})
