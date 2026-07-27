import assert from 'node:assert/strict'
import test from 'node:test'

import { readingVisitorName } from '../../lib/readingVisitorIdentity.mjs'

test('anonymous readers receive a privacy-safe marker from their visitor hash', () => {
  assert.equal(readingVisitorName({
    visitorType: 'anonymous',
    visitorKey: 'A1B2C3D4E5F6',
    userName: '匿名访客',
  }), '匿名访客 · a1b2c3')
})

test('named guest and account identities keep their recorded display name', () => {
  assert.equal(readingVisitorName({
    visitorType: 'guest',
    visitorKey: 'guest-id',
    userName: '🦫 机智的水豚 123456',
  }), '🦫 机智的水豚 123456')

  assert.equal(readingVisitorName({
    visitorType: 'user',
    visitorKey: 'github:123',
    userName: 'TUARAN',
  }), 'TUARAN')
})
