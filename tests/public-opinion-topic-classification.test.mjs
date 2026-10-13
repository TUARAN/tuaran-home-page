import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyOpinionPosts, classifyOpinionTopic } from '../lib/publicOpinion/topicClassification.js'

test('topic labels require evidence in the displayed title', () => {
  assert.equal(classifyOpinionTopic('OpenAI raises API prices'), null)
  assert.equal(classifyOpinionTopic('AI hardware market grows'), null)
  assert.equal(classifyOpinionTopic('Creator of a JavaScript library discusses AI'), null)
  assert.equal(classifyOpinionTopic('DeepSeek releases a new model'), 'llm')
  assert.equal(classifyOpinionTopic('OpenAI releases a new model'), 'llm')
  assert.equal(classifyOpinionTopic('OpenAI 发布新模型'), 'llm')
  assert.equal(classifyOpinionTopic('Claude Sonnet and Gemini compete on coding benchmarks'), 'llm')
  assert.equal(classifyOpinionTopic('Llama open weights draw developer interest'), 'llm')
  assert.equal(classifyOpinionTopic('OpenAI adjusts API pricing'), null)
  assert.equal(classifyOpinionTopic('Claude Code updates its editor integration'), null)
  assert.equal(classifyOpinionTopic('Claude Code adds agent teams'), 'ai-agents')
  assert.equal(classifyOpinionTopic('Qwen launches an Agent framework'), 'ai-agents')
  assert.equal(classifyOpinionTopic('Cloudflare updates Workers deployment'), 'cloud-dev')
  assert.equal(classifyOpinionTopic('Substack changes creator payouts'), 'creator-policy')
})

test('stored posts are relabeled or omitted according to their current titles', () => {
  assert.deepEqual(classifyOpinionPosts([
    { id: 'a', topicId: 'ai-agents', text: 'Qwen launches a model' },
    { id: 'b', topicId: 'china-llm', text: 'OpenAI releases a new model' },
  ]), [
    { id: 'a', topicId: 'llm', text: 'Qwen launches a model' },
    { id: 'b', topicId: 'llm', text: 'OpenAI releases a new model' },
  ])
})

test('unrelated screenshot examples do not appear under large models', () => {
  const titles = [
    'Ask HN：如何减缓 AI 发展速度（也请评估我的想法）',
    'Show HN：Opus 5.5在3小时/8个提示内制作出功能齐全的Figma克隆',
    'Launch HN：Agent37（YC F26）——用于运行智能体的低成本沙箱',
    '他们兵棋推演了遮蔽太阳，结果比你想的更糟',
    'Show HN：Vibecheck——检查你是否理解 AI 所写代码的合并门禁',
  ]
  const classified = classifyOpinionPosts(titles.map((text, index) => ({
    id: String(index), topicId: 'china-llm', text,
  })))
  assert.ok(classified.every((post) => post.topicId !== 'llm'))
  assert.deepEqual(classified.map((post) => post.id), ['2'])
  assert.equal(classified[0].topicId, 'ai-agents')
})
