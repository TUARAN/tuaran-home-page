import test from 'node:test'
import assert from 'node:assert/strict'

import { AUTO_PUBLISH_DELAY_MS } from '../lib/aSharePublishCore.js'
import { autoPublishOldestDueDraft } from '../lib/aSharePublisher.js'

test('没有满 3 天的待复核稿时跳过自动发布', async () => {
  const calls = []
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql, values })
          return this
        },
        async first() {
          return null
        },
      }
    },
  }
  const now = Date.UTC(2026, 7, 12, 1, 0, 0)
  const result = await autoPublishOldestDueDraft({ db, env: {}, now })
  assert.deepEqual(result, { ok: true, skipped: true, reason: 'none-due' })
  assert.match(calls[0].sql, /status = 'pending'/)
  assert.match(calls[0].sql, /ORDER BY updated_at ASC LIMIT 1/)
  assert.deepEqual(calls[0].values, [now - AUTO_PUBLISH_DELAY_MS])
})
