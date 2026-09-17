import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getResearchImages } from '../../lib/research/images.js'
import { renderMarkdown } from '../../lib/research/markdown.js'
import { entryFromResearchSource } from '../../lib/research/source.js'

test('autoImages: false 不抽氛围配图', () => {
  assert.deepEqual(
    getResearchImages({
      category: 'topics',
      slug: 'ai-money-stage-one-loop',
      topicType: 'thesis',
      autoImages: false,
    }),
    [],
  )
})

test('默认仍会抽氛围配图', () => {
  const images = getResearchImages({
    category: 'topics',
    slug: 'ai-money-stage-one-loop',
    topicType: 'thesis',
  })
  assert.ok(images.length >= 1)
})

test('这篇 AI 变现观察关掉自动配图后，正文不再插入氛围图', () => {
  const filename = '2026-09-16-ai-money-stage-one-loop.md'
  const raw = fs.readFileSync(path.join(process.cwd(), 'research/topics', filename), 'utf8')
  const entry = entryFromResearchSource('topics', filename, raw)

  assert.equal(entry.autoImages, false)
  assert.deepEqual(entry.images, [])
  assert.equal(entry.content.includes('![') && entry.content.includes('](/research/'), false)

  const html = renderMarkdown(entry.content, {
    images: entry.images,
    title: entry.title,
    seed: `${entry.category}/${entry.slug}`,
  })
  assert.equal(html.includes('images.unsplash.com'), false)
  assert.equal(html.includes('<figure'), false)
})
