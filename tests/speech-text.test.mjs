import assert from 'node:assert/strict'
import test from 'node:test'

import { pickChineseVoice, splitSpeechText, stripMarkdownForSpeech } from '../lib/speechText.js'

test('stripMarkdownForSpeech keeps readable prose and drops markup', () => {
  const markdown = [
    '# 标题',
    '',
    '这是[链接](https://example.com)和`代码`。',
    '',
    '![配图](https://example.com/a.png)',
    '',
    '> 引用一句。',
    '',
    '- 第一条',
    '1. 第二条',
    '',
    '```js',
    'console.log(1)',
    '```',
  ].join('\n')

  assert.equal(
    stripMarkdownForSpeech(markdown),
    '标题 这是链接和代码。 引用一句。 第一条 第二条',
  )
})

test('splitSpeechText keeps short sentences together and splits long units', () => {
  assert.deepEqual(splitSpeechText('你好。世界。', 10), ['你好。世界。'])
  assert.deepEqual(splitSpeechText('第一句。第二句很长。', 8), ['第一句。', '第二句很长。'])
  assert.deepEqual(splitSpeechText('abcdefghij', 4), ['abcd', 'efgh', 'ij'])
})

test('pickChineseVoice prefers zh, then yue, then the first voice', () => {
  assert.equal(pickChineseVoice([]), null)
  assert.equal(
    pickChineseVoice([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'zh-CN', name: 'Tingting' },
    ]).name,
    'Tingting',
  )
  assert.equal(
    pickChineseVoice([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'yue-HK', name: 'Sinji' },
    ]).name,
    'Sinji',
  )
  assert.equal(
    pickChineseVoice([{ lang: 'en-US', name: 'Samantha' }]).name,
    'Samantha',
  )
})
