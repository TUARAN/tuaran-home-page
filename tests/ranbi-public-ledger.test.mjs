import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalSnapshot,
  canonicalTransferLine,
  hashSnapshot,
  hashTransfers,
  publicAccount,
  publicDetail,
} from '../lib/ranbiPublicLedger.js'

test('public ledger hides login identifiers and keeps system accounts readable', async () => {
  const email = await publicAccount('email:reader@example.com')
  const guest = await publicAccount('guest:9194fe61-a342-48b5-b122-79ef5eea3f93')
  const pool = await publicAccount('pool:community')
  const burn = await publicAccount('system:burn')

  assert.equal(email.kind, 'reader')
  assert.equal(email.ref.startsWith('reader:'), true)
  assert.equal(JSON.stringify(email).includes('reader@example.com'), false)
  assert.equal(JSON.stringify(guest).includes('9194fe61'), false)
  assert.deepEqual(pool, { ref: 'pool:community', label: '社区参与池', kind: 'system' })
  assert.equal(burn.label, '燃币黑洞')
  assert.deepEqual(await publicAccount('email:reader@example.com'), email)
})

test('public details omit admin notes and keep content keys', () => {
  assert.equal(publicDetail('admin', 'admin:1:abc:请给 email:reader@example.com 加币'), '')
  assert.equal(publicDetail('guest_merge', 'guest_merge:guest:9194fe61-a342-48b5-b122-79ef5eea3f93'), '')
  assert.equal(publicDetail('unlock', 'unlock:research:topics:example'), 'research:topics:example')
  assert.equal(publicDetail('checkin', 'checkin:2026-10-08'), '2026-10-08')
})

test('snapshot hash covers balances and transfer lines in id order', async () => {
  const transfer = {
    id: 7,
    createdAt: 1791400000000,
    from: { ref: 'pool:community' },
    to: { ref: 'reader:abcdef123456' },
    amount: 5,
    reason: 'checkin',
    detail: '2026-10-08',
  }
  const line = canonicalTransferLine(transfer)
  assert.equal(line, '7|1791400000000|pool:community|reader:abcdef123456|5|checkin|2026-10-08')
  const transfersHash = await hashTransfers([line])
  const snapshot = {
    totalSupply: 21000000,
    accounted: 21000000,
    consistent: true,
    circulating: 5,
    burned: 0,
    accounts: [
      { accountId: 'pool:community', balance: 6299995 },
      { accountId: 'system:burn', balance: 0 },
    ],
    transferCount: 1,
    transfersHash,
  }
  const hash = await hashSnapshot(snapshot)
  assert.equal(hash, await hashSnapshot(snapshot))
  assert.equal(canonicalSnapshot(snapshot).includes('email:'), false)
  assert.equal(hash.length, 64)
})
