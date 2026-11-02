import assert from 'node:assert/strict'
import test from 'node:test'
import { readSyncblogDownload, saveSyncblogDownload, syncblogDownloadStatus } from '../../lib/content/syncblogDownload.mjs'
import { createXReplyDownloadPassword, verifyXReplyDownloadPassword } from '../../lib/content/xReplyDownloadPassword.mjs'
test('VIP config starts closed; persists verifier and package without exposing secrets in status', async () => {
  const rows = new Map()
  const db = { prepare: () => ({ bind: (...args) => ({ first: async () => rows.has(args[0]) ? { value: rows.get(args[0]) } : null, run: async () => rows.set(args[0], args[1]) }) }) }
  assert.equal(syncblogDownloadStatus(await readSyncblogDownload(db)).ready, false)
  const first = await createXReplyDownloadPassword()
  await saveSyncblogDownload(db, { objectKey: 'vip/test.zip', fileName: 'test.zip', password: first.record }, 'owner')
  const record = await readSyncblogDownload(db)
  assert.equal(syncblogDownloadStatus(record).ready, true)
  assert.equal(await verifyXReplyDownloadPassword(first.password, record.password), true)
  assert.equal(JSON.stringify([...rows]).includes(first.password), false)
  assert.equal('password' in syncblogDownloadStatus(record), false)
  assert.equal('objectKey' in syncblogDownloadStatus(record), false)
  const second = await createXReplyDownloadPassword()
  await saveSyncblogDownload(db, { ...record, password: second.record }, 'owner')
  assert.equal(await verifyXReplyDownloadPassword(first.password, (await readSyncblogDownload(db)).password), false)
  assert.equal(await verifyXReplyDownloadPassword(second.password, (await readSyncblogDownload(db)).password), true)
})
