import assert from 'node:assert/strict'
import test from 'node:test'

import { COMMUNITY_ACTION_SECRET_KEY } from '../../lib/community/communityActions.js'
import {
  authorizeCommunitySecret,
  authorizeDownloadInvite,
  createPersonInvite,
  markPersonInviteDownloaded,
  resetPersonInviteToDownloadable,
  revokePersonInvite,
} from '../../lib/content/xReplyPersonInvite.mjs'

function fakeDb({ ownerSecret = 'owner-master-secret', invites = [] } = {}) {
  const settings = new Map()
  if (ownerSecret) settings.set(COMMUNITY_ACTION_SECRET_KEY, ownerSecret)
  const rows = [...invites]

  function matchInvite(code) {
    return rows.find((row) => row.code === code) || null
  }

  return {
    _rows: rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (/FROM site_settings WHERE key/.test(sql)) {
                const key = args[0]
                if (!settings.has(key)) return null
                return { value: settings.get(key) }
              }
              if (/FROM x_reply_person_invites WHERE code/.test(sql)) {
                return matchInvite(args[0])
              }
              if (/FROM x_reply_person_invites WHERE id/.test(sql)) {
                return rows.find((row) => row.id === args[0]) || null
              }
              return null
            },
            async all() {
              if (/FROM x_reply_person_invites/.test(sql)) {
                return { results: [...rows].sort((a, b) => b.created_at - a.created_at) }
              }
              return { results: [] }
            },
            async run() {
              if (/INSERT INTO site_settings/.test(sql)) {
                settings.set(args[0], args[1])
                return { success: true, meta: { changes: 1 } }
              }
              if (/INSERT INTO x_reply_person_invites/.test(sql)) {
                rows.push({
                  id: args[0],
                  code: args[1],
                  label: args[2],
                  status: 'downloadable',
                  device_id: '',
                  account_handle: '',
                  download_count: 0,
                  last_download_at: null,
                  bound_at: null,
                  last_seen_at: null,
                  created_at: args[3],
                  updated_at: args[4],
                  created_by: args[5],
                })
                return { success: true, meta: { changes: 1 } }
              }
              if (/download_count = download_count \+ 1/.test(sql)) {
                const row = rows.find((item) => item.id === args[2])
                if (row && row.status === 'downloadable') {
                  row.download_count += 1
                  row.last_download_at = args[0]
                  row.updated_at = args[1]
                  return { success: true, meta: { changes: 1 } }
                }
                return { success: true, meta: { changes: 0 } }
              }
              if (/SET status = 'bound'/.test(sql)) {
                const row = rows.find((item) => item.id === args[5] && item.status === 'downloadable')
                if (!row) return { success: true, meta: { changes: 0 } }
                row.status = 'bound'
                row.device_id = args[0]
                row.account_handle = args[1]
                row.bound_at = args[2]
                row.last_seen_at = args[3]
                row.updated_at = args[4]
                return { success: true, meta: { changes: 1 } }
              }
              if (/SET status = 'downloadable'/.test(sql)) {
                const row = rows.find((item) => item.id === args[1])
                if (!row) return { success: true, meta: { changes: 0 } }
                row.status = 'downloadable'
                row.device_id = ''
                row.account_handle = ''
                row.bound_at = null
                row.updated_at = args[0]
                return { success: true, meta: { changes: 1 } }
              }
              if (/SET status = 'revoked'/.test(sql)) {
                const row = rows.find((item) => item.id === args[1] && item.status !== 'revoked')
                if (!row) return { success: true, meta: { changes: 0 } }
                row.status = 'revoked'
                row.updated_at = args[0]
                return { success: true, meta: { changes: 1 } }
              }
              if (/SET last_seen_at/.test(sql)) {
                const row = rows.find((item) => item.id === args[4])
                if (row) {
                  row.last_seen_at = args[0]
                  if (args[1]) row.account_handle = args[2]
                  row.updated_at = args[3]
                }
                return { success: true, meta: { changes: row ? 1 : 0 } }
              }
              return { success: true, meta: { changes: 0 } }
            },
          }
        },
      }
    },
  }
}

test('owner master always downloads; person code binds on first heartbeat then blocks download', async () => {
  const db = fakeDb()
  const created = await createPersonInvite(db, { label: '第一人', actor: 'owner' })
  assert.match(created.code, /^[A-Za-z0-9_-]{24}$/)

  const ownerDl = await authorizeDownloadInvite(db, 'owner-master-secret')
  assert.equal(ownerDl.ok, true)
  assert.equal(ownerDl.kind, 'owner')

  const personDl = await authorizeDownloadInvite(db, created.code)
  assert.equal(personDl.ok, true)
  assert.equal(personDl.kind, 'person')
  await markPersonInviteDownloaded(db, created.id)
  assert.equal(db._rows[0].download_count, 1)

  const auth = await authorizeCommunitySecret(db, created.code, {
    deviceId: 'device_abc12345',
    accountHandle: 'friend1',
    bind: true,
  })
  assert.equal(auth.ok, true)
  assert.equal(auth.bound, true)
  assert.equal(db._rows[0].status, 'bound')
  assert.equal(db._rows[0].device_id, 'device_abc12345')

  const blocked = await authorizeDownloadInvite(db, created.code)
  assert.equal(blocked.ok, false)
  assert.equal(blocked.error, 'INVITE_BOUND')

  const mismatch = await authorizeCommunitySecret(db, created.code, {
    deviceId: 'device_other999',
    bind: true,
  })
  assert.equal(mismatch.ok, false)
  assert.equal(mismatch.error, 'DEVICE_MISMATCH')

  const sameDevice = await authorizeCommunitySecret(db, created.code, {
    deviceId: 'device_abc12345',
    bind: true,
  })
  assert.equal(sameDevice.ok, true)

  await resetPersonInviteToDownloadable(db, created.id)
  assert.equal(db._rows[0].status, 'downloadable')
  assert.equal((await authorizeDownloadInvite(db, created.code)).ok, true)

  await revokePersonInvite(db, created.id)
  assert.equal((await authorizeDownloadInvite(db, created.code)).error, 'INVITE_REVOKED')
})

test('owner secret still authorizes loose routes without binding', async () => {
  const db = fakeDb()
  const created = await createPersonInvite(db, { label: '甲', actor: 'owner' })
  const loose = await authorizeCommunitySecret(db, created.code, { bind: false })
  assert.equal(loose.ok, true)
  assert.equal(db._rows[0].status, 'downloadable')
  const owner = await authorizeCommunitySecret(db, 'owner-master-secret', { bind: false })
  assert.equal(owner.ok, true)
  assert.equal(owner.kind, 'owner')
})
