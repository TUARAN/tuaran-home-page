import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EGO_BROWSER_PROFILE,
  EGO_PUBLISH_PLATFORM_IDS,
  buildEgoPublishPrompt,
} from '../lib/article/egoPublishPrompt.js'

const sample = {
  title: '示例文章',
  url: 'https://2aran.com/articles/research/topics/demo',
  summary: '一段摘要',
  tags: ['Cloudflare', ' 智能体 '],
  markdown: [
    '> **涂阿燃** · [2aran.com →](https://2aran.com)',
    '',
    '![题图](/research/demo/01.webp)',
    '',
    '```js',
    'console.log(1)',
    '```',
  ].join('\n'),
}

test('首期只覆盖掘金和 CSDN', () => {
  assert.deepEqual(EGO_PUBLISH_PLATFORM_IDS, ['juejin', 'csdn'])
  const prompt = buildEgoPublishPrompt(sample)
  assert.match(prompt, /发布到掘金、CSDN/)
  assert.match(prompt, /## 掘金（https:\/\/juejin\.cn\//)
  assert.match(prompt, /## CSDN（https:\/\/editor\.csdn\.net\/md\/）/)
})

test('指令固定使用 ego lite 的 Aran 账号', () => {
  assert.deepEqual(EGO_BROWSER_PROFILE, { name: 'Aran', profileId: 'Profile 1' })
  const prompt = buildEgoPublishPrompt(sample)
  assert.match(prompt, /ego-browser skill/)
  assert.match(prompt, /profileId: "Profile 1"/)
})

test('携带文章元数据，站内相对图片改成绝对地址', () => {
  const prompt = buildEgoPublishPrompt(sample)
  assert.match(prompt, /- 标题：示例文章/)
  assert.match(prompt, /- 站内原文：https:\/\/2aran\.com\/articles\/research\/topics\/demo/)
  assert.match(prompt, /- 站内标签：Cloudflare、智能体/)
  assert.match(prompt, /!\[题图\]\(https:\/\/2aran\.com\/research\/demo\/01\.webp\)/)
  assert.match(prompt, /\(https:\/\/2aran\.com\)/)
})

test('外层围栏比正文里的反引号更长，代码块不会提前闭合', () => {
  const prompt = buildEgoPublishPrompt(sample)
  assert.match(prompt, /````markdown\n/)
  assert.ok(prompt.trimEnd().endsWith('````'))
  assert.match(prompt, /```js\nconsole\.log\(1\)\n```/)
})

test('权利声明要求先问站长', () => {
  const prompt = buildEgoPublishPrompt(sample)
  assert.match(prompt, /权利声明/)
  assert.match(prompt, /不能自行勾选/)
})

test('可按平台筛选，未知平台忽略', () => {
  const prompt = buildEgoPublishPrompt({ ...sample, platformIds: ['csdn', 'unknown'] })
  assert.match(prompt, /发布到CSDN。/)
  assert.doesNotMatch(prompt, /## 掘金/)
})
