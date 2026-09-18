import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getResearchImages } from '../../lib/research/images.js'
import { buildResearchMarkdownDocument, renderMarkdown } from '../../lib/research/markdown.js'
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

test('自动配图不会插进围栏代码块', () => {
  const markdown = [
    '## 一、结论',
    '',
    '先给结论。',
    '',
    '## 二、示例',
    '',
    '可以给它这样的要求：',
    '',
    '```text',
    '请根据这个目录里的工作记录，生成一份周报草稿。',
    '',
    '先列出你找到的文件。',
    '```',
    '',
    '这是一个起步示例。',
  ].join('\n')
  const images = [{ src: 'https://example.com/team.jpg', alt: '创意团队工作场景' }]
  const doc = buildResearchMarkdownDocument(markdown, {
    images,
    title: '测试',
    seed: 'topics:workbuddy-tutorial-resources:codex',
  })
  const fence = /```text\n([\s\S]*?)\n```/.exec(doc)?.[1] || ''

  assert.match(fence, /请根据这个目录里的工作记录，生成一份周报草稿。/)
  assert.equal(fence.includes('!['), false)
  assert.match(doc, /```\n\n!\[[^\]]+\]\(https:\/\/example.com\/team.jpg\)/)
})

test('WorkBuddy 教程在生产 seed 下不会把氛围图插进周报示例', () => {
  const filename = '2026-08-28-workbuddy-tutorial-resources.md'
  const raw = fs.readFileSync(path.join(process.cwd(), 'research/topics', filename), 'utf8')
  const entry = entryFromResearchSource('topics', filename, raw)
  const seed = `${entry.category}:${entry.slug}:codex`
  const doc = buildResearchMarkdownDocument(entry.content, {
    images: entry.images,
    title: entry.title,
    seed,
  })
  const fence = /```text\n([\s\S]*?)\n```/.exec(doc)?.[1] || ''

  assert.match(fence, /请根据这个目录里的工作记录，生成一份周报草稿。/)
  assert.equal(fence.includes('创意团队工作场景'), false)
  assert.equal(fence.includes('!['), false)
  assert.match(doc, /创意团队工作场景/)
})
