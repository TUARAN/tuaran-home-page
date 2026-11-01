import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { createReplyHistory } = require('../../tools/x-reply-clipboard-extension/replyHistory.js')

function memoryStorage(seed = {}) {
  const values = { ...seed }
  return {
    values,
    async get(keys) {
      return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, values[key]]))
    },
    async remove(keys) { for (const key of keys) delete values[key] }
  }
}

function memoryIndexedDB() {
  const rows = new Map()
  const db = {
    createObjectStore() {},
    transaction() {
      const tx = {
        pending: 0,
        objectStore() {
          return {
            get(key) {
              const request = {}
              queueMicrotask(() => { request.result = rows.get(key); request.onsuccess?.() })
              return request
            },
            put(value, key) {
              tx.pending += 1
              queueMicrotask(() => {
                rows.set(key, value)
                tx.pending -= 1
                if (tx.pending === 0) tx.oncomplete?.()
              })
            }
          }
        }
      }
      return tx
    }
  }
  return {
    rows,
    open() {
      const request = { result: db }
      queueMicrotask(() => { request.onupgradeneeded?.(); request.onsuccess?.() })
      return request
    }
  }
}

test('replies survive a new run, use account-specific keys, and read one target at a time', async () => {
  const storage = memoryStorage()
  const indexedDB = memoryIndexedDB()
  const first = createReplyHistory(storage, indexedDB)
  await first.load('@Alice')
  await first.add('Alice', '123456789')
  const nextRun = createReplyHistory(storage, indexedDB)
  await nextRun.load('alice')
  assert.equal(await nextRun.has('alice', '123456789'), true)
  assert.equal(await nextRun.has('bob', '123456789'), false)
  assert.equal(indexedDB.rows.get('alice:123456789'), 1)
  assert.equal(Object.keys(storage.values).length, 0)
})

test('old buckets, notification IDs and daily reply receipts migrate once', async () => {
  const storage = memoryStorage({
    'xrcRepliedTargets:v1:alice:0': { ids: ['1'] },
    xrcDailyReports: [
      { accountHandle: 'alice', targetKeys: ['timeline-reply:2', 'notification-reply:3', 'post-like:4'] },
      { accountHandle: 'bob', targetKeys: ['timeline-reply:5'] }
    ]
  })
  const indexedDB = memoryIndexedDB()
  const history = createReplyHistory(storage, indexedDB)
  await history.load('alice', ['6'])
  for (const id of ['1', '2', '3', '6']) assert.equal(await history.has('alice', id), true)
  for (const id of ['4', '5']) assert.equal(await history.has('alice', id), false)
  assert.equal(storage.values['xrcRepliedTargets:v1:alice:0'], undefined)
  assert.ok(storage.values.xrcDailyReports)
  assert.equal(await history.needsMigration('alice'), false)
})

test('migration retains more than the old 2000 notification records', async () => {
  const storage = memoryStorage()
  const indexedDB = memoryIndexedDB()
  const history = createReplyHistory(storage, indexedDB)
  const ids = Array.from({ length: 2200 }, (_, index) => String(index + 1))
  await history.load('alice', ids)
  const nextRun = createReplyHistory(storage, indexedDB)
  await nextRun.load('alice')
  assert.equal(await nextRun.has('alice', '1'), true)
  assert.equal(await nextRun.has('alice', '2200'), true)
})

test('content asks the extension background before selecting a reply target', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  const background = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  assert.match(background, /importScripts\([^)]*"replyHistory\.js"/)
  assert.match(source, /async function nextUnrepliedTweet\(tweets\)[\s\S]*?xrc-reply-history-has/)
  assert.match(source, /next = await nextUnrepliedTweet\(tweets\)/)
  assert.match(source, /if \(result === "ambiguous-sent"\)[\s\S]*?persistRepliedTarget\(next\.id\)/)
  assert.match(source, /if \(result === "send-unconfirmed"\)[\s\S]*?persistRepliedTarget\(next\.id\)/)
  assert.match(source, /if \(result === "ok" \|\| result === "sent-composer-open"\)[\s\S]*?persistRepliedTarget\(next\.id\)/)
})
