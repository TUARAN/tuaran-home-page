import assert from 'node:assert/strict'
import test from 'node:test'

import { COMMUNITY_ACTION_SECRET_KEY } from '../../lib/community/communityActions.js'
import { saveBoundXReplyInvite } from '../../lib/content/xReplyInviteBind.mjs'
import {
  readXReplyDownloadPassword,
  verifyXReplyDownloadPassword,
  X_REPLY_DOWNLOAD_PASSWORD_KEY,
} from '../../lib/content/xReplyDownloadPassword.mjs'

function fakeDb(seed = {}) {
  const store = new Map(Object.entries(seed))
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (/FROM site_settings WHERE key/.test(sql)) {
                const key = args[0]
                if (!store.has(key)) return null
                return { value: store.get(key) }
              }
              return null
            },
            async run() {
              if (/INSERT INTO site_settings/.test(sql)) {
                store.set(args[0], args[1])
              }
              return { success: true }
            },
          }
        },
      }
    },
    _store: store,
  }
}

test('bound invite writes the same plaintext as download verifier and receipt secret', async () => {
  const db = fakeDb()
  const first = await saveBoundXReplyInvite(db, 'owner')
  assert.match(first.invite, /^[A-Za-z0-9_-]{24}$/)
  assert.equal(first.invite, first.secret)
  assert.equal(first.password, first.invite)
  assert.equal(db._store.get(COMMUNITY_ACTION_SECRET_KEY), first.invite)
  assert.equal(JSON.stringify(db._store.get(X_REPLY_DOWNLOAD_PASSWORD_KEY)).includes(first.invite), false)
  const record = await readXReplyDownloadPassword(db)
  assert.equal(await verifyXReplyDownloadPassword(first.invite, record), true)

  const second = await saveBoundXReplyInvite(db, 'owner')
  assert.notEqual(second.invite, first.invite)
  assert.equal(db._store.get(COMMUNITY_ACTION_SECRET_KEY), second.invite)
  assert.equal(await verifyXReplyDownloadPassword(first.invite, await readXReplyDownloadPassword(db)), false)
  assert.equal(await verifyXReplyDownloadPassword(second.invite, await readXReplyDownloadPassword(db)), true)
})
