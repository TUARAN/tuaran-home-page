import assert from 'node:assert/strict'
import test from 'node:test'

import {
  escapeSqlLiteral,
  extractRecoveryCandidates,
  parseWranglerRows,
} from '../scripts/rekey-soft-sticker.mjs'

test('soft sticker rekey parses successful wrangler D1 results', () => {
  assert.deepEqual(
    parseWranglerRows(JSON.stringify([{ success: true, results: [{ id: 1 }] }])),
    [{ id: 1 }]
  )
})

test('soft sticker rekey rejects unsuccessful wrangler D1 results', () => {
  assert.throws(
    () => parseWranglerRows(JSON.stringify([{ success: false, results: [] }])),
    /有效的 D1 查询结果/
  )
})

test('soft sticker rekey escapes SQL string literals', () => {
  assert.equal(escapeSqlLiteral("a'b"), "a''b")
})

test('soft sticker recovery finds local generation candidates without old prompts', () => {
  const events = [
    { payload: { type: 'message', input: "const password = 'ignored'" } },
    { payload: { type: 'custom_tool_call', input: "const password = 'records-key'" } },
    {
      payload: {
        type: 'custom_tool_call',
        input: "encryptPayload({schemaVersion:1,markdown},'memoir-key')",
      },
    },
  ]
  assert.deepEqual(extractRecoveryCandidates(events), ['records-key', 'memoir-key'])
})
