import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyLocalizedItems,
  buildLocalizationMessages,
  localizePublicOpinionPosts,
  needsChineseLocalization,
} from '../lib/publicOpinion/localization.js'

const englishPost = {
  id: 'post-1',
  platform: 'Hacker News',
  text: 'OpenAI launches a new agent platform',
  viewpoint: '社区互动 20 票、5 条评论。',
}

test('只将英文为主的舆情标记为待汉化', () => {
  assert.equal(needsChineseLocalization(englishPost.text), true)
  assert.equal(needsChineseLocalization('智能体开始进入真实工作流'), false)
  assert.equal(needsChineseLocalization('OpenAI 发布新的 Agent 平台'), false)
})

test('汉化提示包含标题和原文摘要，并禁止补充事实', () => {
  const messages = buildLocalizationMessages([{ ...englishPost, sourceExcerpt: 'A platform for developers.' }])
  const prompt = messages.map((message) => message.content).join('\n')
  assert.match(prompt, /titleZh/)
  assert.match(prompt, /summaryZh/)
  assert.match(prompt, /不添加输入中没有的事实/)
  assert.match(prompt, /A platform for developers/)
})

test('只接受同 ID 且标题、概括均已汉化的结果', () => {
  const result = applyLocalizedItems([englishPost], [{
    id: 'post-1',
    titleZh: 'OpenAI 发布新的智能体平台',
    summaryZh: '新平台面向开发者，用于构建和运行智能体。',
  }])
  assert.equal(result.translatedCount, 1)
  assert.equal(result.posts[0].text, 'OpenAI 发布新的智能体平台')
  assert.match(result.posts[0].viewpoint, /面向开发者/)

  const rejected = applyLocalizedItems([englishPost], [{
    id: 'post-1',
    titleZh: 'OpenAI launches a platform',
    summaryZh: '新平台面向开发者。',
  }])
  assert.equal(rejected.translatedCount, 0)
  assert.equal(rejected.posts[0].text, englishPost.text)
})

test('单批 DeepSeek 失败时保留原文并继续处理其他批次', async () => {
  const posts = [
    englishPost,
    { ...englishPost, id: 'post-2', text: 'Cloudflare improves Workers observability' },
  ]
  let calls = 0
  const result = await localizePublicOpinionPosts(posts, async (batch) => {
    calls += 1
    if (batch[0].id === 'post-1') throw new Error('timeout')
    return {
      items: [{
        id: 'post-2',
        titleZh: 'Cloudflare 改善 Workers 可观测性',
        summaryZh: '新功能帮助开发者查看 Workers 的运行状态。',
      }],
    }
  }, 1)

  assert.equal(calls, 2)
  assert.equal(result.failedBatches, 1)
  assert.equal(result.translatedCount, 1)
  assert.equal(result.posts[0].text, englishPost.text)
  assert.match(result.posts[1].text, /可观测性/)
})
