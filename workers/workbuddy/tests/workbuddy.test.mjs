import assert from 'node:assert/strict'
import test from 'node:test'

import { signToken, verifyToken } from '../src/auth.js'
import { listResources } from '../src/database.js'
import { isTrustedMutation, parseByteRange, safeSegment } from '../src/index.js'

test('shared HS256 tokens round-trip and reject tampering', async () => {
  const secret = 'test-secret-with-enough-entropy'
  const token = await signToken({ user: { id: 'github:42' }, exp: Math.floor(Date.now() / 1000) + 60 }, secret)
  assert.equal((await verifyToken(token, secret)).user.id, 'github:42')
  // Change meaningful signature bits; the last base64url character includes padding bits.
  const parts = token.split('.')
  parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`
  assert.equal(await verifyToken(parts.join('.'), secret), null)
  assert.equal(await verifyToken(token, 'different-secret'), null)
})

test('expired session tokens are rejected', async () => {
  const token = await signToken({ exp: Math.floor(Date.now() / 1000) - 1 }, 'secret')
  assert.equal(await verifyToken(token, 'secret'), null)
})

test('API path segments allow expected slugs only', () => {
  assert.equal(safeSegment('workbuddy-guide-v1.2'), 'workbuddy-guide-v1.2')
  assert.equal(safeSegment('../secret'), '')
  assert.equal(safeSegment('a/b'), '')
  assert.equal(safeSegment(''), '')
})

test('mutating requests require same-origin browser requests', () => {
  assert.equal(
    isTrustedMutation(new Request('https://workbuddy.2aran.com/api/resources/a/unlock', { headers: { origin: 'https://workbuddy.2aran.com' } })),
    true,
  )
  assert.equal(
    isTrustedMutation(new Request('https://workbuddy.2aran.com/api/resources/a/unlock', { headers: { origin: 'https://evil.example' } })),
    false,
  )
})

test('catalog has a useful fallback before the D1 migration is applied', async () => {
  const db = { prepare() { throw new Error('no such table') } }
  const result = await listResources(db)
  assert.equal(result.fallback, true)
  assert.equal(result.resources.length, 6)
  assert.ok(result.resources.every((item) => item.resourceKey.startsWith('workbuddy:')))
  assert.ok(result.resources.every((item) => item.fileCount === 0))
})

test('published fallback resources keep stable prices and slugs', async () => {
  const db = { prepare() { throw new Error('no such table') } }
  const { resources } = await listResources(db, new URLSearchParams('category=视频教程'))
  assert.equal(resources.length, 1)
  assert.equal(resources[0].slug, 'workbuddy-workplace-video-course')
  assert.equal(resources[0].costPoints, 10)
})

test('range parsing handles PDF byte and suffix ranges and rejects invalid requests', () => {
  assert.deepEqual(parseByteRange('bytes=0-9', 100), { offset: 0, length: 10 })
  assert.deepEqual(parseByteRange('bytes=90-', 100), { offset: 90, length: 10 })
  assert.deepEqual(parseByteRange('bytes=-10', 100), { offset: 90, length: 10 })
  for (const range of ['bytes=-0', 'bytes=100-', 'bytes=8-2', 'bytes=0-1,8-9', 'bytes=-']) {
    assert.equal(parseByteRange(range, 100), false)
  }
})
