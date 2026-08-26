import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildXArticlePost,
  createXOAuth1Header,
  publishXPost,
  uploadXMedia,
  weightedTextLength,
} from '../../lib/xDistribution.js'

test('builds a conservative X post from article metadata', () => {
  const text = buildXArticlePost({
    title: '一篇很长的中文文章标题'.repeat(12),
    summary: '这是一段用于说明文章内容的摘要。'.repeat(30),
    url: 'https://2aran.com/articles/example',
  })

  assert.match(text, /https:\/\/2aran\.com\/articles\/example$/)
  const content = text.replace(/https:\/\/2aran\.com\/articles\/example$/, '')
  assert.ok(weightedTextLength(content) + 23 <= 280)
  assert.ok(text.includes('…'))
})

test('creates a deterministic OAuth 1.0a authorization header', async () => {
  const header = await createXOAuth1Header({
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    accessToken: 'access-token',
    accessTokenSecret: 'access-secret',
    nonce: 'fixed-nonce',
    timestamp: 1700000000,
  })

  assert.equal(
    header,
    'OAuth oauth_consumer_key="consumer-key", oauth_nonce="fixed-nonce", oauth_signature="j3NoV0%2FjiMd%2B7hgeJNOGyLtj%2Fhc%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1700000000", oauth_token="access-token", oauth_version="1.0"',
  )
})

test('does not attempt a publish without all server-side credentials', async () => {
  const result = await publishXPost('hello', { credentials: null })
  assert.deepEqual(result, { ok: false, status: 503, error: 'X_NOT_CONFIGURED' })
})

test('publishes through the official X create-post endpoint', async () => {
  let request = null
  const result = await publishXPost('hello', {
    credentials: {
      consumerKey: 'consumer-key',
      consumerSecret: 'consumer-secret',
      accessToken: 'access-token',
      accessTokenSecret: 'access-secret',
    },
    nonce: 'fixed-nonce',
    timestamp: 1700000000,
    fetchImpl: async (url, init) => {
      request = { url, init }
      return new Response(JSON.stringify({ data: { id: '123', text: 'hello' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })

  assert.equal(request.url, 'https://api.x.com/2/tweets')
  assert.equal(request.init.method, 'POST')
  assert.match(request.init.headers.Authorization, /^OAuth /)
  assert.equal(request.init.body, JSON.stringify({ text: 'hello' }))
  assert.deepEqual(result, {
    ok: true,
    post: { id: '123', text: 'hello', url: 'https://x.com/i/web/status/123' },
  })
})

test('uploads an image and attaches its media id to the X post', async () => {
  const credentials = {
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    accessToken: 'access-token',
    accessTokenSecret: 'access-secret',
  }
  let uploadRequest = null
  const upload = await uploadXMedia(new Blob(['jpeg-bytes'], { type: 'image/jpeg' }), {
    credentials,
    nonce: 'upload-nonce',
    timestamp: 1700000000,
    fetchImpl: async (url, init) => {
      uploadRequest = { url, init }
      return new Response(JSON.stringify({ data: { id: 'media-456' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })

  assert.equal(uploadRequest.url, 'https://api.x.com/2/media/upload')
  assert.equal(uploadRequest.init.method, 'POST')
  assert.match(uploadRequest.init.headers.Authorization, /^OAuth /)
  assert.ok(uploadRequest.init.body instanceof FormData)
  assert.equal(uploadRequest.init.body.get('media_category'), 'tweet_image')
  assert.deepEqual(upload, { ok: true, mediaId: 'media-456' })

  let postBody = null
  const published = await publishXPost('一起学习。#互相学习 #共同进步', {
    credentials,
    mediaIds: [upload.mediaId],
    nonce: 'post-nonce',
    timestamp: 1700000001,
    fetchImpl: async (_url, init) => {
      postBody = JSON.parse(init.body)
      return new Response(JSON.stringify({ data: { id: 'post-789' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })
  assert.deepEqual(postBody.media, { media_ids: ['media-456'] })
  assert.equal(published.ok, true)
})
