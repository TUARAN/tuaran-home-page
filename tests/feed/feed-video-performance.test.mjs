import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const FEED_CLIENT_PATH = new URL('../../app/(site)/feed/FeedClient.jsx', import.meta.url)
const FEED_DATA_PATH = new URL('../../app/(site)/feed/data.js', import.meta.url)
const MIDDLEWARE_PATH = new URL('../../middleware.js', import.meta.url)
const HEADERS_PATH = new URL('../../public/_headers', import.meta.url)
const PUBLISH_SCRIPT_PATH = new URL('../../scripts/publish-feed-video.mjs', import.meta.url)

test('video assets bypass middleware and receive explicit immutable caching', async () => {
  const [middleware, headers] = await Promise.all([
    readFile(MIDDLEWARE_PATH, 'utf8'),
    readFile(HEADERS_PATH, 'utf8'),
  ])

  assert.match(middleware, /mp4\|webm\|m4v/)
  assert.match(headers, /\/feed\/\*\.mp4[\s\S]*Cache-Control: public, max-age=31536000, immutable/)
  assert.match(headers, /\/feed\/\*\.webm[\s\S]*Cache-Control: public, max-age=31536000, immutable/)
})

test('R2-backed feed videos use the configurable media origin', async () => {
  const data = await readFile(FEED_DATA_PATH, 'utf8')

  assert.match(data, /feedMediaUrl\('feed\/kimi-yang-zhilin-interview-2026-07-22\.mp4'\)/)
  assert.match(data, /feedMediaUrl\('feed\/humanoid-robot-beauty-inspiration-2026-07-02\.mp4'\)/)
  assert.match(data, /NEXT_PUBLIC_R2_PUBLIC_BASE/)
})

test('video cards warm metadata near the viewport and preserve a poster while buffering', async () => {
  const client = await readFile(FEED_CLIENT_PATH, 'utf8')

  assert.match(client, /VIDEO_PRELOAD_ROOT_MARGIN/)
  assert.match(client, /IntersectionObserver/)
  assert.match(client, /canWarmMetadata && isNearViewport/)
  assert.match(client, /preload=\{activated \? 'auto' : 'metadata'\}/)
  assert.match(client, /onCanPlay=/)
  assert.match(client, /正在加载视频/)
})

test('feed publishing enforces fast-start encoding and immutable R2 metadata', async () => {
  const script = await readFile(PUBLISH_SCRIPT_PATH, 'utf8')

  assert.match(script, /'-movflags', '\+faststart'/)
  assert.match(script, /'--content-type', 'video\/mp4'/)
  assert.match(script, /'--cache-control', CACHE_CONTROL/)
  assert.match(script, /'--remote'/)
})
