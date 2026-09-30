import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { publishXPost } from '../lib/xDistribution.js'
import { recordXApiPostCost } from '../lib/xApiCost.js'
import {
  X_GENERIC_REPLY_LIBRARY,
  buildGenericXReplyMessages,
  normalizeXPostTarget,
  pickGenericXReply,
  sanitizeGeneratedXReply,
  validateXReplyText,
} from '../lib/xReplyTasks.js'

const credentials = {
  consumerKey: 'consumer-key',
  consumerSecret: 'consumer-secret',
  accessToken: 'access-token',
  accessTokenSecret: 'access-secret',
}

test('normalizes X and legacy Twitter status URLs to a Post target', () => {
  assert.deepEqual(normalizeXPostTarget('1234567890'), {
    ok: true,
    postId: '1234567890',
    url: 'https://x.com/i/web/status/1234567890',
  })
  assert.deepEqual(normalizeXPostTarget('https://twitter.com/example/status/987654321?s=20'), {
    ok: true,
    postId: '987654321',
    url: 'https://x.com/i/web/status/987654321',
  })
  assert.equal(normalizeXPostTarget('https://example.com/status/123').ok, false)
  assert.equal(normalizeXPostTarget('https://x.com/example').ok, false)
})

test('generic reply library uses stable bounded selection', () => {
  assert.ok(X_GENERIC_REPLY_LIBRARY.length >= 20)
  assert.equal(pickGenericXReply(() => 0), X_GENERIC_REPLY_LIBRARY[0])
  assert.equal(pickGenericXReply(() => 0.999999), X_GENERIC_REPLY_LIBRARY.at(-1))
  assert.equal(new Set(X_GENERIC_REPLY_LIBRARY).size, X_GENERIC_REPLY_LIBRARY.length)
})

test('sanitizes model output and rejects promotional reply shapes', () => {
  assert.equal(sanitizeGeneratedXReply('回复：这个角度挺有意思。\n多余内容'), '这个角度挺有意思。')
  assert.equal(sanitizeGeneratedXReply('看看 https://example.com'), '')
  assert.equal(sanitizeGeneratedXReply('@someone 说得好'), '')
  assert.equal(validateXReplyText('').error, 'REPLY_TEXT_REQUIRED')
  assert.match(buildGenericXReplyMessages()[0].content, /不假装读过不存在的细节/)
})

test('publishes an X reply with the official reply payload', async () => {
  let requestBody = null
  const result = await publishXPost('有点意思。', {
    credentials,
    replyToPostId: '1234567890',
    nonce: 'reply-nonce',
    timestamp: 1700000000,
    fetchImpl: async (_url, init) => {
      requestBody = JSON.parse(init.body)
      return new Response(JSON.stringify({ data: { id: '222', text: '有点意思。' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })

  assert.deepEqual(requestBody, {
    text: '有点意思。',
    reply: { in_reply_to_tweet_id: '1234567890' },
  })
  assert.equal(result.ok, true)
  assert.deepEqual(
    await publishXPost('test', { credentials, replyToPostId: 'not-an-id' }),
    { ok: false, status: 400, error: 'X_REPLY_TARGET_INVALID' },
  )
})

test('records reply cost under its own automation id', async () => {
  let binding = null
  const db = {
    prepare(sql) {
      assert.match(sql, /automation_id/)
      return {
        bind(...values) {
          binding = values
          return { run: async () => ({ meta: { changes: 1 } }) }
        },
      }
    },
  }
  const result = await recordXApiPostCost(db, {
    postId: 'reply-1',
    automationId: 'x-reply-admin',
    slot: 'manual-review',
    contentType: 'reply',
    text: '有点意思。',
    createdAt: 1700000000,
  })
  assert.equal(result.recorded, true)
  assert.deepEqual(binding, [
    'reply-1', 'x-reply-admin', 'manual-review', 'reply',
    'post_create', 15_000, 1700000000,
  ])
})

test('admin X reply surface requires owner auth and keeps model output non-publishing', async () => {
  const [route, publishRoute, client, navigation, migration] = await Promise.all([
    readFile(new URL('../app/api/admin/x-replies/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/x-replies/[id]/publish/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/x-replies/XReplyTasksClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/adminRoutes.js', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0103_x_reply_tasks.sql', import.meta.url), 'utf8'),
  ])

  assert.match(route, /getOwnerOrReject\(request\)/)
  assert.match(publishRoute, /getOwnerOrReject\(request\)/)
  assert.match(route, /metadata: \{ directPublish: false \}/)
  assert.match(publishRoute, /replyToPostId: row\.target_post_id/)
  assert.match(client, /随机短句并复制/)
  assert.match(client, /模型生成并复制/)
  assert.match(client, /window\.confirm/)
  assert.match(navigation, /\/admin\/x-replies/)
  assert.match(migration, /target_post_id TEXT NOT NULL UNIQUE/)
})
