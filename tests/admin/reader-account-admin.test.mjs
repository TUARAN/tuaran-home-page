import assert from 'node:assert/strict'
import test from 'node:test'

import {
  readerAccountUserId,
  readerUnlockAdminHref,
} from '../../lib/admin/readerAccountAdmin.mjs'

test('reader account mapping only applies to guest and logged-in identities', () => {
  assert.equal(readerAccountUserId({ key: 'guest:abc-123', type: 'guest' }), 'guest:abc-123')
  assert.equal(readerAccountUserId({ key: 'github:99', type: 'user' }), 'github:99')
  assert.equal(readerAccountUserId({ key: 'deadbeef', type: 'anonymous' }), '')
})

test('reader unlock admin href routes guests to the guest modal and accounts to points ledger', () => {
  assert.equal(
    readerUnlockAdminHref('guest:abc-123'),
    '/admin/users?tab=guests&guestUnlock=guest%3Aabc-123',
  )
  assert.equal(
    readerUnlockAdminHref('github:99'),
    '/admin/points?userId=github%3A99&view=ledger',
  )
  assert.equal(readerUnlockAdminHref(''), null)
})