import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import * as assetLibrary from '../../lib/xPostAssets.js'
import * as greetings from '../../lib/morningGreeting.js'
import * as greetingLlm from '../../lib/dailyGreetingLlm.js'
import * as culture from '../../lib/dailyCultureStory.js'
import * as community from '../../lib/xCommunityPosts.js'
import * as usPosts from '../../lib/xUsAudiencePosts.js'
import * as cryptoPosts from '../../lib/xCryptoPosts.js'
import * as postingSchedule from '../../lib/xPostingSchedule.js'

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
    'OAuth oauth_consumer_key="consumer-key", oauth_nonce="fixed-nonce", oauth_signature="j3NoV0%2FjiMd%2B7hgeJNOGyLtj%2Fhc%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1700000000", oauth_token="access-token", oauth_version="1.0"', // gitleaks:allow — deterministic fixture signature
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

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1cAAAAASUVORK5CYII='

async function assetFixture(t) {
  const sqlite = new DatabaseSync(':memory:')
  t.after(() => sqlite.close())
  sqlite.exec(await readFile(new URL('../../migrations/0082_x_post_assets.sql', import.meta.url), 'utf8'))
  sqlite.exec('CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER, updated_by TEXT)')
  const db = { prepare(sql) {
    const statement = sqlite.prepare(sql)
    function bound(args = []) {
      return { bind: (...values) => bound(values),
        async run() { return { meta: { changes: Number(statement.run(...args).changes) } } },
        async first() { return statement.get(...args) || null },
        async all() { return { results: statement.all(...args) } },
      }
    }
    return bound()
  } }
  const objects = new Map()
  const bucket = {
    async put(key, bytes) { objects.set(key, bytes) },
    async get(key) { const bytes = objects.get(key); return bytes ? { arrayBuffer: async () => bytes.buffer, body: bytes } : null },
    async delete(key) { objects.delete(key) },
  }
  return { db, bucket, objects, sqlite }
}

test('asset claims fence concurrent workers and never reclaim ambiguous or published posts', async (t) => {
  const { db, sqlite } = await assetFixture(t)
  const input = { date: '2026-08-28', slot: 'morning', contentType: 'greeting' }
  const first = await assetLibrary.claimXAsset(db, input)
  assert.equal(first.acquired, true)
  assert.equal((await assetLibrary.claimXAsset(db, input)).acquired, false)
  sqlite.exec('UPDATE x_post_assets SET lease_until = 0')
  const newer = await assetLibrary.claimXAsset(db, input)
  assert.equal(newer.acquired, true)
  await assert.rejects(assetLibrary.updateXAsset(db, first, { status: 'ready' }), /LEASE_LOST/)
  for (const status of ['publishing', 'publish-unknown', 'published']) {
    sqlite.prepare('UPDATE x_post_assets SET status = ?, lease_until = 0').run(status)
    assert.equal((await assetLibrary.claimXAsset(db, input)).acquired, false)
  }
})

test('images persist to R2, retries reuse them, and list pagination retains history', async (t) => {
  const { db, bucket, objects } = await assetFixture(t)
  const asset = await assetLibrary.claimXAsset(db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
  let generated = 0
  const input = { db, bucket, asset, random: () => 0, ai: { run: async () => { generated++; return { image: PNG } } }, createPrompt: async () => 'Morning light on a coffee cup.' }
  const image = await assetLibrary.prepareXImage(input)
  assert.equal(image.type, 'image/png')
  assert.equal(objects.size, 1)
  assert.match(asset.row.object_key, /^images\/x-posts\/2026-08-28\/morning\//)
  assert.deepEqual(await (await assetLibrary.prepareXImage(input)).arrayBuffer(), await image.arrayBuffer())
  assert.equal(generated, 1)
  await assetLibrary.claimXAsset(db, { date: '2026-08-29', slot: 'morning', contentType: 'greeting' })
  const page = await assetLibrary.listXAssets(db, { type: 'greeting', limit: 1 })
  assert.equal(page.items[0].date, '2026-08-29')
  assert.ok(page.nextCursor)
  const older = await assetLibrary.listXAssets(db, { before: page.nextCursor, limit: 1 })
  assert.equal(older.items[0].date, '2026-08-28')
  assert.match(older.items[0].imageUrl, /^\/api\/admin\/morning-greeting\/assets\//)
  objects.clear()
  await assert.rejects(assetLibrary.prepareXImage(input), /STORED_OBJECT_MISSING/)
  assert.equal(generated, 1)
})

test('format draw has a 50 percent boundary and saved image drafts do not draw again', async (t) => {
  const { db } = await assetFixture(t)
  for (const [index, draw] of [0, 0.499999, 0.5, 0.999999].entries()) {
    const asset = await assetLibrary.claimXAsset(db, { date: '2026-08-29', slot: `test-${index}`, contentType: 'greeting' })
    const format = await assetLibrary.saveXPostDraft(db, asset, { text: 'A saved draft.', random: () => draw })
    assert.equal(format, draw < 0.5 ? 'image' : 'text')
    assert.equal(await assetLibrary.saveXPostDraft(db, asset, {
      text: asset.row.text,
      random: () => { throw new Error('retry must not draw again') },
    }), format)
  }
})

test('invalid generated bytes cannot become an X image', () => {
  for (const image of [null, '', 'garbage!', btoa('<html>failed</html>')]) {
    assert.throws(() => assetLibrary.decodeXImage(image), /X_IMAGE_INVALID/)
  }
  assert.equal(assetLibrary.decodeXImage(PNG).mime, 'image/png')
})

async function cronFixture(t, overrides = {}) {
  const fixture = await assetFixture(t)
  const calls = { images: 0, copy: 0, upload: 0, publish: 0 }
  const env = { DB: fixture.db, MEDIA: fixture.bucket, MORNING_GREETING_SECRET: 'test-secret', AI: { run: async () => { calls.images++; return { image: PNG } } } }
  const dependencies = {
    ...assetLibrary, ...greetings, ...greetingLlm, ...culture, ...community, ...usPosts, ...cryptoPosts,
    ...postingSchedule,
    saveXPostDraft: (db, asset, options) => assetLibrary.saveXPostDraft(db, asset, { ...options, random: () => 0 }),
    prepareXImage: (options) => assetLibrary.prepareXImage({ ...options, random: () => 0 }),
    getOptionalRequestContext: () => ({ env }),
    getXCredentials: () => ({ configured: true }),
    listEnabledMorningGreetingTexts: async () => [],
    callDeepSeek: async (args) => {
      if (args.task.taskType === 'image-prompt') return { content: 'Warm light, a quiet creative workspace. No text.' }
      calls.copy++
      return { content: 'Make a small thing today. Share what you learned.', model: 'test-model' }
    },
    callOllama: async () => { throw new Error('not used') },
    uploadXMedia: async (blob) => { assert.ok(blob.size); calls.upload++; return { ok: true, mediaId: 'media-123' } },
    publishXPost: async (text, options) => {
      assert.deepEqual(options.mediaIds, ['media-123'])
      calls.publish++
      return { ok: true, post: { id: `post-${calls.publish}`, text, url: `https://x.com/i/web/status/${calls.publish}` } }
    },
    recordXApiPostCost: async () => {},
    xPostCreatePricing: () => ({ key: 'post', microUsd: 15000 }),
    ...overrides,
  }
  const source = (await readFile(new URL('../../app/api/distribution/x/greeting/route.js', import.meta.url), 'utf8'))
    .replace(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm, '')
    .replace(/^export /gm, '')
  const post = new Function(...Object.keys(dependencies), `${source}\nreturn POST`)(...Object.values(dependencies))
  const invoke = (query = 'period=morning', secret = 'test-secret') => post(new Request(`https://2aran.com/api/distribution/x/greeting?${query}`, { method: 'POST', headers: { 'x-morning-greeting-secret': secret } }))
  return { ...fixture, calls, env, invoke }
}

test('completion after midnight does not consume the next scheduled day', async (t) => {
  const { invoke, sqlite } = await cronFixture(t)
  sqlite.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run(
    greetings.greetingLastRunKey('morning'),
    JSON.stringify({ ok: true, date: '2000-01-01', at: Date.now() }),
  )
  assert.equal((await invoke()).status, 201)
  assert.equal((await invoke()).status, 200)
})

test('scheduled requests recheck time and date before generating or claiming', async (t) => {
  const task = { id: 'morning', date: greetings.shanghaiDateKey(), scheduledAt: Date.now() + 60_000 }
  const { invoke, calls, sqlite } = await cronFixture(t, { xPostingSchedule: async () => [task] })
  const query = `period=morning&scheduledDate=${task.date}`
  assert.equal((await (await invoke(query)).json()).reason, 'outside_schedule_window')
  task.scheduledAt = Date.now() - 61 * 60_000
  assert.equal((await (await invoke(query)).json()).reason, 'outside_schedule_window')
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM x_post_assets').get().count, 0)
  assert.equal(calls.copy, 0)
  task.scheduledAt = Date.now() - 60_000
  assert.equal((await (await invoke('period=morning&scheduledDate=2000-01-01')).json()).reason, 'outside_schedule_window')
  assert.equal((await invoke(query)).status, 201)
})

test('all five task types generate, persist and publish images, then skip repeated triggers', async (t) => {
  const { invoke, calls, objects } = await cronFixture(t)
  for (const query of ['period=morning', 'community=community_friends', 'story=culture_morning', 'crypto=crypto_knowledge', 'us=us_morning']) {
    const response = await invoke(query)
    assert.equal(response.status, 201, JSON.stringify(await response.clone().json()))
    assert.match((await response.json()).imagePath, /\/assets\//)
    const repeated = await invoke(query)
    assert.equal(repeated.status, 200)
    assert.equal((await repeated.json()).skipped, true)
  }
  assert.deepEqual(calls, { images: 5, copy: 5, upload: 5, publish: 5 })
  assert.equal(objects.size, 5)
})

test('all five task types can publish text without AI, R2 or media upload', async (t) => {
  let publishes = 0
  const { invoke, env, calls, sqlite } = await cronFixture(t, {
    saveXPostDraft: (db, asset, options) => assetLibrary.saveXPostDraft(db, asset, { ...options, random: () => 0.5 }),
    publishXPost: async (text, options) => {
      assert.deepEqual(options.mediaIds, [])
      return { ok: true, post: { id: `text-${++publishes}`, text, url: 'https://x.com/i/web/status/123' } }
    },
  })
  delete env.AI
  delete env.MEDIA
  for (const slot of postingSchedule.X_POST_SLOTS) {
    const response = await invoke(`${slot.query}=${slot.id}`)
    assert.equal(response.status, 201)
    assert.equal((await response.json()).imagePath, '')
    assert.equal((await invoke(`${slot.query}=${slot.id}`)).status, 200)
  }
  assert.equal(publishes, postingSchedule.X_POST_SLOTS.length)
  assert.equal(calls.images, 0)
  assert.equal(calls.upload, 0)
  const rows = sqlite.prepare('SELECT * FROM x_post_assets').all()
  assert.equal(rows.length, postingSchedule.X_POST_SLOTS.length)
  assert.ok(rows.every((row) => row.asset_source === 'text' && row.status === 'published'))
})

test('text retries preserve their format and draft even when the next draw would select an image', async (t) => {
  let draws = 0
  let publishes = 0
  const { invoke, calls, sqlite } = await cronFixture(t, {
    saveXPostDraft: (db, asset, options) => assetLibrary.saveXPostDraft(db, asset, { ...options, random: () => ++draws === 1 ? 0.9 : 0 }),
    publishXPost: async (text, options) => {
      assert.deepEqual(options.mediaIds, [])
      if (++publishes === 1) return { ok: false, status: 429, xStatus: 429, error: 'RATE_LIMITED' }
      return { ok: true, post: { id: 'text-retry', text, url: 'https://x.com/i/web/status/123' } }
    },
  })
  assert.equal((await invoke()).status, 429)
  const draft = sqlite.prepare('SELECT * FROM x_post_assets').get()
  assert.equal((await invoke()).status, 201)
  assert.equal(sqlite.prepare('SELECT * FROM x_post_assets').get().text, draft.text)
  assert.equal(draws, 1)
  assert.equal(calls.copy, 1)
  assert.equal(calls.images, 0)
  assert.equal(calls.upload, 0)
})

test('upload failure keeps the draft/image and retry does not regenerate either', async (t) => {
  let uploads = 0
  const { invoke, calls, sqlite } = await cronFixture(t, { uploadXMedia: async () => ++uploads === 1 ? { ok: false, status: 502, error: 'X_MEDIA_UNREACHABLE' } : { ok: true, mediaId: 'media-123' } })
  assert.equal((await invoke()).status, 502)
  assert.equal(calls.publish, 0)
  const before = sqlite.prepare('SELECT * FROM x_post_assets').get()
  assert.ok(before.object_key)
  assert.equal(before.status, 'failed')
  assert.equal((await invoke()).status, 201)
  const after = sqlite.prepare('SELECT * FROM x_post_assets').get()
  assert.equal(after.object_key, before.object_key)
  assert.equal(after.text, before.text)
  assert.equal(calls.copy, 1)
  assert.equal(calls.images, 1)
})

test('generation, persistence, authentication and pause failures cannot send text-only posts', async (t) => {
  const { invoke, calls, env, sqlite, bucket } = await cronFixture(t)
  assert.equal((await invoke('period=morning', 'wrong')).status, 401)
  sqlite.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run(greetings.MORNING_GREETING_SETTING_KEY, 'paused')
  assert.equal((await invoke()).status, 423)
  sqlite.exec('DELETE FROM site_settings')
  env.AI.run = async () => { throw new Error('generation failed') }
  assert.equal((await invoke()).status, 502)
  env.AI.run = async () => ({ image: PNG })
  bucket.put = async () => { throw new Error('R2 unavailable') }
  assert.equal((await invoke()).status, 502)
  assert.equal(calls.publish, 0)
  assert.equal(calls.upload, 0)
})

test('uncertain X response never triggers an automatic duplicate publish', async (t) => {
  let sent = 0
  const { invoke, sqlite } = await cronFixture(t, { publishXPost: async () => { sent++; return { ok: false, status: 502, error: 'X_UNREACHABLE' } } })
  assert.equal((await invoke()).status, 502)
  assert.equal(sqlite.prepare('SELECT status FROM x_post_assets').get().status, 'publish-unknown')
  const retry = await invoke()
  assert.equal(retry.status, 409)
  assert.equal((await retry.json()).error, 'X_PUBLISH_REQUIRES_REVIEW')
  assert.equal(sent, 1)
})

test('image management and original-file routes reject non-owners before touching storage', async () => {
  for (const path of ['route.js', '[id]/route.js']) {
    const source = (await readFile(new URL(`../../app/api/admin/morning-greeting/assets/${path}`, import.meta.url), 'utf8'))
      .replace(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm, '')
      .replace(/^export /gm, '')
    const denied = new Response('Forbidden', { status: 403 })
    const get = new Function('getOwnerOrReject', 'getD1', 'getR2', `${source}\nreturn GET`)(
      async () => ({ ok: false, response: denied }),
      () => assert.fail('Must not read D1 before authorization'),
      () => assert.fail('Must not read R2 before authorization'),
    )
    assert.equal((await get(new Request('https://example.com/api/admin/morning-greeting/assets'), { params: Promise.resolve({ id: 'private' }) })).status, 403)
  }
})

test('confirmed X rejection can retry, while an unreadable old run record fails closed', async (t) => {
  let sent = 0
  const { invoke, sqlite, calls } = await cronFixture(t, {
    publishXPost: async () => ++sent === 1
      ? { ok: false, status: 400, xStatus: 429, error: 'X_PUBLISH_FAILED' }
      : { ok: true, post: { id: '123', url: 'https://x.com/i/web/status/123' } },
  })
  assert.equal((await invoke()).status, 400)
  assert.equal((await invoke()).status, 201)
  assert.equal(sent, 2)
  assert.equal(calls.images, 1)
  sqlite.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run(greetings.greetingLastRunKey('noon'), '{broken')
  assert.equal((await invoke('period=noon')).status, 503)
  assert.equal(sent, 2)
})

async function seedPool(fixture, type = 'greeting', id = 'pool-one') {
  const key = `images/x-posts/pool/${id}.png`
  const bytes = Uint8Array.from(Buffer.from(PNG, 'base64'))
  fixture.objects.set(key, bytes)
  fixture.sqlite.prepare(`INSERT INTO x_image_pool (id,content_type,title,object_key,mime_type,size_bytes,image_model,prompt,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(id, type, id, key, 'image/png', bytes.length, 'Codex imagegen', 'Quiet scene', Date.now())
  return key
}

test('image briefs randomize art direction independently of the post category', () => {
  const styles = [/anime/i, /Japanese.*woodblock/i, /cyberpunk/i, /abstract/i, /modernis/i, /watercolor/i, /paper.cut/i, /monochrome.*photograph/i]
  for (const contentType of assetLibrary.X_ASSET_TYPES) {
    for (const [index, expected] of styles.entries()) {
      const messages = assetLibrary.buildXImageBriefMessages({ text: 'A shared meal.', contentType, slot: 'morning', random: () => index / 8 })
      assert.match(messages[0].content, expected)
      assert.match(messages[0].content, /No text/)
      assert.equal(JSON.parse(messages[1].content).post, 'A shared meal.')
      if (contentType === 'crypto-insight') assert.match(messages[0].content, /no price chart/i)
    }
  }
})

test('random values on both sides of 0.5 choose generation or direct same-theme pool use', async (t) => {
  for (const value of [0, 0.499999, 0.5, 0.999999]) {
    const fixture = await assetFixture(t)
    const key = await seedPool(fixture)
    await seedPool(fixture, 'crypto-insight', 'other-theme')
    const asset = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
    let images = 0
    let prompts = 0
    let submittedPrompt = ''
    const image = await assetLibrary.prepareXImage({ ...fixture, asset, random: () => value,
      ai: { run: async (_model, args) => { images++; submittedPrompt = args.prompt; return { image: PNG } } },
      createPrompt: async () => { prompts++; return 'A cup on a table.' },
    })
    assert.ok(image.size)
    if (value < 0.5) {
      assert.equal(images, 1)
      assert.equal(prompts, 1)
      assert.equal(asset.row.asset_source, 'generated')
      assert.notEqual(asset.row.object_key, key)
      assert.match(submittedPrompt, value === 0 ? /anime/i : /abstract/i)
      assert.equal(submittedPrompt, asset.row.prompt)
    } else {
      assert.equal(images, 0)
      assert.equal(prompts, 0)
      assert.equal(asset.row.object_key, key)
      assert.equal(asset.row.asset_source, 'pool')
      assert.equal(asset.row.fallback_error, '')
      assert.equal(fixture.objects.size, 2)
    }
    const reused = await assetLibrary.prepareXImage({ ...fixture, asset,
      random: () => assert.fail('A saved image must be reused before drawing a new strategy'),
      createPrompt: () => assert.fail('Do not regenerate a saved image'),
    })
    assert.deepEqual(await reused.arrayBuffer(), await image.arrayBuffer())
  }
})

test('direct pool selection uses only enabled curated assets and randomizes the chosen asset', async (t) => {
  const fixture = await assetFixture(t)
  await seedPool(fixture, 'greeting', 'a-disabled')
  fixture.sqlite.exec('UPDATE x_image_pool SET enabled = 0')
  await seedPool(fixture, 'greeting', 'b-first')
  const key = await seedPool(fixture, 'greeting', 'c-second')
  await seedPool(fixture, 'crypto-insight', 'z-other-theme')
  const old = await assetLibrary.claimXAsset(fixture.db, { date: '9999-08-27', slot: 'morning', contentType: 'greeting' })
  await assetLibrary.updateXAsset(fixture.db, old, { status: 'published', object_key: 'old-generated.png', mime_type: 'image/png' })
  fixture.objects.set('old-generated.png', Uint8Array.from(Buffer.from(PNG, 'base64')))
  const asset = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
  await assetLibrary.prepareXImage({ ...fixture, asset, random: () => 0.999999 })
  assert.equal(asset.row.object_key, key)
  assert.equal(assetLibrary.xAssetView(asset.row).fallbackError, '')
})

test('generation draws style separately from strategy and passes the same direction to the brief and image model', async (t) => {
  const fixture = await assetFixture(t)
  const asset = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
  const draws = [0.1, 0.9]
  let briefStyle = ''
  let modelPrompt = ''
  await assetLibrary.prepareXImage({ ...fixture, asset, random: () => draws.shift(),
    createPrompt: async (style) => { briefStyle = style; return 'A shared breakfast.' },
    ai: { run: async (_model, args) => { modelPrompt = args.prompt; return { image: PNG } } },
  })
  assert.match(briefStyle, /Monochrome editorial photography/)
  assert.ok(modelPrompt.startsWith(briefStyle))
  assert.match(modelPrompt, /A shared breakfast/)
  assert.equal(asset.row.prompt, modelPrompt)
  assert.deepEqual(draws, [])
})

test('direct pool selection skips missing objects but cannot commit after lease expiry', async (t) => {
  const fixture = await assetFixture(t)
  const missing = await seedPool(fixture, 'greeting', 'a-missing')
  const good = await seedPool(fixture, 'greeting', 'b-good')
  fixture.objects.delete(missing)
  const asset = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
  const draws = [0.75, 0]
  await assetLibrary.prepareXImage({ ...fixture, asset, random: () => draws.shift() })
  assert.equal(asset.row.object_key, good)
  assert.equal(asset.row.fallback_error, '')
  const expired = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-29', slot: 'morning', contentType: 'greeting' })
  fixture.sqlite.exec('UPDATE x_post_assets SET lease_until = 0')
  await assert.rejects(assetLibrary.prepareXImage({ ...fixture, asset: expired, random: () => 0.75 }), /LEASE_LOST/)
  assert.equal(fixture.sqlite.prepare('SELECT object_key FROM x_post_assets WHERE id = ?').get(expired.row.id).object_key, '')
})

test('direct pool failures never generate an image or send a text-only post', async (t) => {
  const fixture = await cronFixture(t, {
    prepareXImage: (options) => assetLibrary.prepareXImage({ ...options, random: () => 0.75 }),
  })
  assert.equal((await fixture.invoke()).status, 502)
  assert.equal(fixture.sqlite.prepare('SELECT error FROM x_post_assets').get().error, 'X_IMAGE_POOL_UNAVAILABLE')
  const key = await seedPool(fixture)
  fixture.objects.delete(key)
  assert.equal((await fixture.invoke()).status, 502)
  assert.equal(fixture.sqlite.prepare('SELECT error FROM x_post_assets').get().error, 'X_IMAGE_POOL_OBJECT_MISSING')
  assert.equal(fixture.calls.images, 0)
  assert.equal(fixture.calls.upload, 0)
  assert.equal(fixture.calls.publish, 0)
})

test('all five task types can publish directly from the pool without generating prompts or images', async (t) => {
  const fixture = await cronFixture(t, {
    prepareXImage: (options) => assetLibrary.prepareXImage({ ...options, random: () => 0.75 }),
    callDeepSeek: async (args) => {
      assert.notEqual(args.task.taskType, 'image-prompt')
      return { content: 'Make a small thing today. Share what you learned.', model: 'test-model' }
    },
  })
  for (const type of assetLibrary.X_ASSET_TYPES) await seedPool(fixture, type, `pool-${type}`)
  for (const query of ['period=morning', 'community=community_friends', 'story=culture_morning', 'crypto=crypto_knowledge', 'us=us_morning']) {
    const response = await fixture.invoke(query)
    assert.equal(response.status, 201, JSON.stringify(await response.clone().json()))
  }
  assert.equal(fixture.calls.images, 0)
  assert.equal(fixture.calls.publish, 5)
  assert.equal(fixture.objects.size, 5)
  const rows = fixture.sqlite.prepare('SELECT asset_source, fallback_error FROM x_post_assets').all()
  assert.ok(rows.every((row) => row.asset_source === 'pool' && row.fallback_error === ''))
})

test('generation failure chooses only a same-theme R2 pool image and reuses it on retry', async (t) => {
  let uploads = 0
  const fixture = await cronFixture(t, { uploadXMedia: async () => ++uploads === 1
    ? { ok: false, status: 502, error: 'X_MEDIA_UNREACHABLE' }
    : { ok: true, mediaId: 'media-123' } })
  const key = await seedPool(fixture)
  await seedPool(fixture, 'crypto-insight', 'other-theme')
  let attempts = 0
  fixture.env.AI.run = async () => { attempts++; throw new Error('provider unavailable') }
  assert.equal((await fixture.invoke()).status, 502)
  const before = fixture.sqlite.prepare('SELECT * FROM x_post_assets').get()
  assert.equal(before.object_key, key)
  assert.equal(fixture.calls.publish, 0)
  assert.equal((await fixture.invoke()).status, 201)
  const row = fixture.sqlite.prepare('SELECT * FROM x_post_assets').get()
  assert.equal(row.object_key, key)
  assert.equal(row.asset_source, 'pool')
  assert.equal(row.pool_asset_id, 'pool-one')
  assert.equal(row.status, 'published')
  assert.equal(row.fallback_error, 'X_IMAGE_GENERATION_FAILED')
  assert.equal(row.text, before.text)
  assert.equal(uploads, 2)
  assert.equal(attempts, 1)
  assert.equal(fixture.calls.publish, 1)
})

test('owner can list, preview and download the same R2 pool bytes; disabled assets stay hidden', async (t) => {
  const fixture = await assetFixture(t)
  await seedPool(fixture)
  await seedPool(fixture, 'crypto-insight', 'other-theme')
  const dependencies = { ...assetLibrary, ...community,
    getOwnerOrReject: async () => ({ ok: true }),
    getD1: () => fixture.db, getR2: () => fixture.bucket,
    getOptionalRequestContext: () => ({ env: { MEDIA: fixture.bucket, AI: {} } }),
  }
  const handlers = []
  for (const route of ['route.js', '[id]/route.js']) {
    const source = (await readFile(new URL(`../../app/api/admin/morning-greeting/assets/${route}`, import.meta.url), 'utf8'))
      .replace(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm, '').replace(/^export /gm, '')
    handlers.push(new Function(...Object.keys(dependencies), `${source}\nreturn GET`)(...Object.values(dependencies)))
  }
  const [list, original] = handlers
  const response = await list(new Request('https://example.com/api/admin/morning-greeting/assets?type=greeting'))
  const data = await response.json()
  assert.equal(data.available, true)
  assert.deepEqual(data.pool.map((item) => item.id), ['pool-one'])
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  const url = new URL(data.pool[0].imageUrl, 'https://example.com')
  const params = { params: Promise.resolve({ id: 'pool-one' }) }
  for (const download of [false, true]) {
    if (download) url.searchParams.set('download', '1')
    const image = await original(new Request(url), params)
    assert.equal(image.status, 200)
    assert.equal(image.headers.get('Content-Type'), 'image/png')
    assert.equal(image.headers.get('Cache-Control'), 'private, no-store')
    assert.equal(image.headers.get('Content-Disposition'), download ? 'attachment; filename="x-post.png"' : null)
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), Buffer.from(PNG, 'base64'))
  }
  fixture.sqlite.exec('UPDATE x_image_pool SET enabled = 0')
  assert.equal((await original(new Request(url), params)).status, 404)
  assert.deepEqual((await (await list(new Request('https://example.com/api/admin/morning-greeting/assets'))).json()).pool, [])
})

test('bounded image timeout falls back without waiting for the provider indefinitely', async (t) => {
  const fixture = await assetFixture(t)
  await seedPool(fixture)
  const asset = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
  const image = await assetLibrary.prepareXImage({ db: fixture.db, bucket: fixture.bucket, asset,
    ai: { run: () => new Promise(() => {}) }, createPrompt: async () => 'Morning light', imageTimeoutMs: 5, random: () => 0 })
  assert.ok(image.size)
  assert.equal(asset.row.fallback_error, 'X_IMAGE_TIMEOUT')
  assert.equal(asset.row.asset_source, 'pool')
})

test('fallback ignores missing pool objects and never bypasses an expired lease', async (t) => {
  const fixture = await assetFixture(t)
  const missing = await seedPool(fixture, 'greeting', 'a-missing')
  const good = await seedPool(fixture, 'greeting', 'b-good')
  fixture.objects.delete(missing)
  const asset = await assetLibrary.claimXAsset(fixture.db, { date: '2026-08-28', slot: 'morning', contentType: 'greeting' })
  const options = { db: fixture.db, bucket: fixture.bucket, asset, ai: null, random: () => 0 }
  await assetLibrary.prepareXImage(options)
  assert.equal(asset.row.object_key, good)
  fixture.sqlite.exec('UPDATE x_post_assets SET lease_until = 0')
  asset.row.object_key = ''
  await assert.rejects(assetLibrary.prepareXImage(options), /LEASE_LOST/)
})
