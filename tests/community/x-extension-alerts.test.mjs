import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const xReceipt = require('../../tools/x-reply-clipboard-extension/receipt.js')
const NOW = Date.parse('2026-10-12T02:00:00.000Z')

test('X receipt preserves an offline error and uploads it after reconnect', async () => {
  const store = { xrcCommunityReport: { secret: 'secret-value', deviceId: 'device-x-001', accountHandle: 'Tuaran', queue: [] } }
  const requests = []
  let offline = true
  globalThis.chrome = {
    storage: { local: { async get(key) { return { [key]: store[key] } }, async set(payload) { Object.assign(store, payload) } } },
    runtime: { getManifest() { return { version: '3.10.3' } } },
  }
  globalThis.fetch = async (url, options) => {
    if (offline) throw new Error('offline')
    requests.push({ url, options })
    return { ok: true }
  }
  try {
    const result = await xReceipt.accept({ task: 'timeline-reply', result: 'failed', errorCode: 'x-transient-error', targetId: '123' })
    assert.equal(result.error, 'network')
    assert.equal(store.xrcCommunityReport.queue.length, 1)
    offline = false
    await xReceipt.heartbeatFromBackground()
    assert.equal(store.xrcCommunityReport.queue.length, 0)
    assert.equal(JSON.parse(requests[0].options.body).events[0].errorCode, 'x-transient-error')
  } finally {
    delete globalThis.chrome
    delete globalThis.fetch
  }
})

test('plugin incidents create one owner notification per 30-minute window', async () => {
  const source = await readFile(new URL('../../lib/site/siteNotifications.js', import.meta.url), 'utf8')
  const helper = source.match(/const EXTENSION_ALERT_LABELS = \{[\s\S]*?(?=\n\/\*\*\n \* 自动化任务失败告警)/)?.[0]
  assert.ok(helper)
  const notifications = []
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes('SELECT id FROM comment_notifications')) {
                const recent = notifications.find((item) => item.key === args[1] && item.at >= args[2])
                return recent ? { id: recent.id } : null
              }
              const id = notifications.length + 1
              notifications.push({ id, key: args[2], at: args[4], excerpt: args[3] })
              return { id }
            },
          }
        },
      }
    },
  }
  const context = vm.createContext({ findOwnerAccount: async () => ({ id: 'owner-1' }), Date })
  vm.runInContext(helper.replace('export async function', 'async function'), context)
  const alert = context.createExtensionAlertNotification
  const input = { deviceId: 'device-x-001', task: 'timeline-reply', errorCode: 'x-transient-error', accountHandle: 'Tuaran', extensionVersion: '3.10.3', targetId: '123', createdAt: NOW }
  assert.equal((await alert(db, input)).created, true)
  assert.equal((await alert(db, { ...input, createdAt: NOW + 1000 })).reason, 'recently_notified')
  assert.equal(notifications.length, 1)
  assert.match(notifications[0].excerpt, /X 页面提示临时错误/)
  assert.match(notifications[0].excerpt, /@Tuaran/)
  assert.equal((await alert(db, { ...input, createdAt: NOW + 31 * 60 * 1000 })).created, true)
  assert.equal(notifications.length, 2)
})
