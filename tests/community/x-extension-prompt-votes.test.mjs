import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePromptVote, readPublicPromptVotes, recordPromptVote } from '../../lib/community/xExtensionPromptVotes.js'

function memoryDb() {
  const rows = []
  return {
    prepare(sql) {
      let bound = []
      const statement = {
        bind(...args) {
          bound = args
          return statement
        },
        async run() {
              const [id, account, sourceId, promptKey, kind, content, topic, label, url, created, updated] = bound
              const existing = rows.find((row) => row.account_handle === account && row.source_id === sourceId)
              if (existing) {
                Object.assign(existing, {
                  prompt_key: promptKey, kind, content, topic, source_label: label, source_url: url, updated_at: updated,
                })
                return
              }
              rows.push({
                id, account_handle: account, source_id: sourceId, prompt_key: promptKey, kind, content,
                topic, source_label: label, source_url: url, created_at: created, updated_at: updated,
              })
            },
        async all() {
              if (sql.includes('GROUP BY')) {
                const totals = new Map()
                for (const row of rows) {
                  const key = `${row.prompt_key}\0${row.kind}`
                  totals.set(key, (totals.get(key) || 0) + 1)
                }
                return {
                  results: [...totals.entries()].map(([key, total]) => {
                    const [promptKey, kind] = key.split('\0')
                    return { promptKey, kind, total }
                  }),
                }
              }
              return {
                results: [...rows].sort((left, right) => right.updated_at - left.updated_at).map((row) => ({
                  promptKey: row.prompt_key,
                  kind: row.kind,
                  content: row.content,
                  topic: row.topic,
                  sourceLabel: row.source_label,
                  updatedAt: row.updated_at,
                })),
              }
        },
      }
      return statement
    },
  }
}

test('a sent-post vote keeps the latest judgment for the same account and source', async () => {
  assert.equal(normalizePromptVote({ kind: 'good', promptKey: 'postXPrompt', content: '两行。', sourceId: 'xtheme:1' }).ok, false)
  const db = memoryDb()
  const first = await recordPromptVote(db, {
    accountHandle: '@tuaran',
    sourceId: 'aihot:1',
    promptKey: 'postNormalPrompt',
    kind: 'good',
    content: '第一版。',
    topic: '存储',
    sourceLabel: 'AI HOT',
    sourceUrl: 'https://aihot.news/a',
  }, 10)
  assert.equal(first.ok, true)
  const flipped = await recordPromptVote(db, {
    accountHandle: 'tuaran',
    deviceId: 'ignored-when-handle-exists',
    sourceId: 'aihot:1',
    promptKey: 'postNormalPrompt',
    kind: 'bad',
    content: '改过的正文。',
  }, 20)
  assert.equal(flipped.kind, 'bad')
  await recordPromptVote(db, {
    accountHandle: '',
    deviceId: 'device-1',
    sourceId: 'xtheme:9',
    promptKey: 'postXPrompt',
    kind: 'good',
    content: '第一行。\n第二行。',
  }, 30)
  const listed = await readPublicPromptVotes(db)
  assert.equal(listed.groups.postNormalPrompt.good, 0)
  assert.equal(listed.groups.postNormalPrompt.bad, 1)
  assert.equal(listed.groups.postNormalPrompt.items[0].content, '改过的正文。')
  assert.equal(listed.groups.postXPrompt.good, 1)
  assert.equal(listed.groups.postPremiumPrompt.items.length, 0)
  assert.equal(normalizePromptVote({ kind: 'bad', promptKey: 'replyTimelinePrompt', content: '评论', sourceId: '1', accountHandle: 'a' }).ok, false)
})
