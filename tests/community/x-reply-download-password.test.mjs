import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createXReplyDownloadPassword,
  readXReplyDownloadPassword,
  saveXReplyDownloadPassword,
  verifyXReplyDownloadPassword,
  xReplyDownloadPasswordStatus,
} from '../../lib/content/xReplyDownloadPassword.mjs'

function fakeDb() {
  let value = null
  return {
    prepare() {
      return {
        bind(...args) {
          return {
            async first() { return value === null ? null : { value } },
            async run() { value = args[1]; return { success: true } },
          }
        },
      }
    },
  }
}

test('generating a download password replaces the initial verifier without storing plaintext', async () => {
  const db = fakeDb()
  const initial = await readXReplyDownloadPassword(db)
  assert.equal(xReplyDownloadPasswordStatus(initial).initial, true)

  const first = await createXReplyDownloadPassword('owner')
  assert.match(first.password, /^[A-Za-z0-9_-]{24}$/)
  assert.equal(await verifyXReplyDownloadPassword(first.password, first.record), true)
  assert.equal(await verifyXReplyDownloadPassword(`${first.password}x`, first.record), false)
  await saveXReplyDownloadPassword(db, first.record)
  const stored = await readXReplyDownloadPassword(db)
  assert.equal(JSON.stringify(stored).includes(first.password), false)
  assert.equal(await verifyXReplyDownloadPassword(first.password, stored), true)
  assert.equal(xReplyDownloadPasswordStatus(stored).initial, false)
  assert.equal('hash' in xReplyDownloadPasswordStatus(stored), false)

  const second = await createXReplyDownloadPassword('owner')
  await saveXReplyDownloadPassword(db, second.record)
  const active = await readXReplyDownloadPassword(db)
  assert.equal(await verifyXReplyDownloadPassword(first.password, active), false)
  assert.equal(await verifyXReplyDownloadPassword(second.password, active), true)
})
