import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../../', import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), 'utf8')
}

test('media hosting keeps separate image and video size limits', async () => {
  const model = await source('lib/hostedImages.js')
  const route = await source('app/api/image-hosting/route.js')

  assert.match(model, /MAX_HOSTED_IMAGE_BYTES = 10 \* 1024 \* 1024/)
  assert.match(model, /MAX_HOSTED_VIDEO_BYTES = 50 \* 1024 \* 1024/)
  assert.match(route, /hostedMediaMaxBytes\(contentType\)/)
  assert.match(route, /FILE_TOO_LARGE/)
})

test('media hosting accepts browser-friendly image and video types', async () => {
  const model = await source('lib/hostedImages.js')

  for (const contentType of [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ]) {
    assert.ok(model.includes(`'${contentType}'`), `missing ${contentType}`)
  }
})

test('video uploads and public pages use video-aware rendering', async () => {
  const route = await source('app/api/image-hosting/route.js')
  const tool = await source('app/(site)/tools/image-hosting/ImageHostingTool.jsx')
  const sharePage = await source('app/(site)/i/[id]/page.jsx')

  assert.match(route, /prefix = mediaType === 'video' \? 'videos' : 'images'/)
  assert.match(tool, /<video src=\{previewUrl\} controls preload="metadata"/)
  assert.match(tool, /formatSize\(image\.sizeBytes\)/)
  assert.match(sharePage, /<video[\s\S]*?controls[\s\S]*?preload="metadata"/)
  assert.match(sharePage, /formatSize\(image\.sizeBytes\)/)
})
