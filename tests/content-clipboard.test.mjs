import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildClipboardImageCandidates,
  copyRichText,
  markdownToPlainText,
  prepareXArticleHtml,
} from '../lib/contentClipboard.js'

test('markdownToPlainText removes presentation markers but keeps readable structure', () => {
  const markdown = [
    '# 标题',
    '',
    '这是 **重点**，也是 *补充*。',
    '',
    '> 一段引用',
    '',
    '- 第一项',
    '- [第二项](https://example.com/item)',
  ].join('\n')

  assert.equal(markdownToPlainText(markdown), [
    '标题',
    '',
    '这是 重点，也是 补充。',
    '',
    '一段引用',
    '',
    '- 第一项',
    '- 第二项 (https://example.com/item)',
  ].join('\n'))
})

test('markdownToPlainText turns images into readable labels and URLs', () => {
  assert.equal(
    markdownToPlainText('![产品截图](https://example.com/image.png "封面")'),
    '产品截图\nhttps://example.com/image.png',
  )
})

test('markdownToPlainText preserves fenced code without the fence', () => {
  assert.equal(
    markdownToPlainText('```js\nconst answer = 42\n```'),
    'const answer = 42',
  )
})

test('markdownToPlainText turns Markdown tables into readable rows', () => {
  const markdown = [
    '| 平台 | 状态 |',
    '| --- | :---: |',
    '| X | 已发布 |',
    '| 站内 | 草稿 |',
  ].join('\n')

  assert.equal(markdownToPlainText(markdown), [
    '平台 ｜ 状态',
    'X ｜ 已发布',
    '站内 ｜ 草稿',
  ].join('\n'))
})

test('markdownToPlainText does not rewrite table-like text inside code fences', () => {
  const markdown = '```md\n| a | b |\n| --- | --- |\n```'
  assert.equal(markdownToPlainText(markdown), '| a | b |\n| --- | --- |')
})

test('prepareXArticleHtml replaces unsupported tables with paragraph rows', () => {
  const html = '<div class="table-scroll"><table><thead><tr><th>平台</th><th>状态</th></tr></thead><tbody><tr><td><strong>X</strong></td><td>已发布</td></tr></tbody></table></div>'

  assert.equal(
    prepareXArticleHtml(html),
    '<div class="table-scroll"><p><strong>平台 ｜ 状态</strong></p><p><strong>X</strong> ｜ 已发布</p></div>',
  )
})

test('prepareXArticleHtml maps h1 to h2 because X reserves the title field', () => {
  assert.equal(prepareXArticleHtml('<h1>标题</h1><h2>章节</h2>'), '<h2>标题</h2><h2>章节</h2>')
})

test('buildClipboardImageCandidates retries remote images through the configured image proxy', () => {
  assert.deepEqual(
    buildClipboardImageCandidates('https://images.example.com/a photo.jpg?x=1'),
    [
      'https://images.example.com/a photo.jpg?x=1',
      'https://wsrv.nl/?url=https%3A%2F%2Fimages.example.com%2Fa%2520photo.jpg%3Fx%3D1&output=png',
    ],
  )
  assert.deepEqual(
    buildClipboardImageCandidates('https://wsrv.nl/?url=https%3A%2F%2Fexample.com%2Fa.jpg'),
    ['https://wsrv.nl/?url=https%3A%2F%2Fexample.com%2Fa.jpg'],
  )
})

test('copyRichText reports images when rich clipboard support is unavailable', async () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  let copiedText = ''
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (value) => { copiedText = value },
      },
    },
  })

  try {
    const result = await copyRichText({
      html: '<p>正文</p><img src="https://example.com/cover.png" alt="封面">',
      text: '正文',
    })
    assert.deepEqual(result, {
      copied: true,
      format: 'plain',
      imageCount: 1,
      embeddedImages: 0,
    })
    assert.equal(copiedText, '正文')
  } finally {
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor)
    else delete globalThis.navigator
  }
})
