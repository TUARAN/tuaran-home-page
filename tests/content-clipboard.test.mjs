import assert from 'node:assert/strict'
import test from 'node:test'

import { markdownToPlainText } from '../lib/contentClipboard.js'

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
