import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPublicOpinionBrief,
  clusterPublicOpinionEvents,
  getPublicOpinionHeatLabel,
  publicOpinionSimilarity,
} from '../lib/publicOpinion/intelligence.js'
import { materializePublicOpinionPostTimes } from '../lib/publicOpinionData.js'

const NOW = new Date('2026-09-29T12:00:00.000Z')

function post(overrides) {
  return {
    id: 'base',
    topicId: 'ai-agents',
    sourceId: 'news',
    platform: 'Example',
    publishedAt: '2026-09-29T10:00:00.000Z',
    sentiment: 0,
    stance: 'neutral',
    engagement: 100,
    text: 'OpenAI 发布新的 Agent 开发平台',
    viewpoint: '开发者开始测试新的智能体工作流。',
    url: 'https://example.com',
    ...overrides,
  }
}

test('相似度识别同一事件，同时避免只因同属一个话题就合并', () => {
  assert.ok(publicOpinionSimilarity('OpenAI 发布 Agent 开发平台', 'OpenAI Agent 平台正式发布') >= 0.5)
  assert.equal(publicOpinionSimilarity('OpenAI 发布 Agent 开发平台', 'Claude 调整 API 价格'), 0)
})

test('同一事件按独立平台聚合，重复来源不重复增加来源数', () => {
  const events = clusterPublicOpinionEvents([
    post({ id: 'a', platform: 'OpenAI Blog' }),
    post({ id: 'b', platform: 'TechCrunch', text: 'OpenAI Agent 开发平台正式发布' }),
    post({ id: 'c', platform: 'TechCrunch', text: 'OpenAI 发布新的 Agent 开发平台' }),
    post({ id: 'd', text: 'Claude 调整 API 价格与计费方式' }),
  ], { now: NOW })

  assert.equal(events.length, 2)
  const grouped = events.find((event) => event.reportCount === 3)
  assert.equal(grouped.sourceCount, 2)
  assert.ok(grouped.heat > 0)
  assert.equal(grouped.heatScaleMax, 100)
  assert.equal(grouped.heatLabel, getPublicOpinionHeatLabel(grouped.heat))
  assert.equal(grouped.heat, Math.min(100, grouped.heatFactors.recencyAndEngagement + grouped.heatFactors.independentSources))
  assert.ok(grouped.confidence > 50)
})

test('热度指数使用固定 0–100 分档，不当作百分比', () => {
  assert.equal(getPublicOpinionHeatLabel(0), '低')
  assert.equal(getPublicOpinionHeatLabel(49), '低')
  assert.equal(getPublicOpinionHeatLabel(50), '中')
  assert.equal(getPublicOpinionHeatLabel(79), '中')
  assert.equal(getPublicOpinionHeatLabel(80), '高')
  assert.equal(getPublicOpinionHeatLabel(150), '高')
})

test('负向且快速增长的事件进入高风险研判', () => {
  const events = clusterPublicOpinionEvents([
    post({ id: 'a', sentiment: -0.8, stance: 'oppose', engagement: 5000 }),
    post({ id: 'b', platform: '媒体二', sentiment: -0.7, stance: 'question', engagement: 3000 }),
    post({ id: 'c', platform: '社区三', sentiment: -0.9, stance: 'oppose', engagement: 2000 }),
  ], { now: NOW })

  assert.equal(events[0].riskLevel, '高')
  assert.ok(events[0].riskReasons.length > 0)
  assert.equal(buildPublicOpinionBrief(events).highRiskCount, 1)
})

test('单一低热度来源不直接升级为高风险事件', () => {
  const [event] = clusterPublicOpinionEvents([
    post({ id: 'only', sentiment: -0.9, stance: 'oppose', engagement: 20 }),
  ], { now: NOW })

  assert.notEqual(event.riskLevel, '高')
  assert.equal(event.sourceCount, 1)
})

test('演示数据补齐覆盖 48 小时的时间戳', () => {
  const generatedAt = '2026-09-30T12:00:00.000Z'
  const posts = Array.from({ length: 16 }, (_, index) => ({ id: `p${index + 1}` }))
  const timedPosts = materializePublicOpinionPostTimes(posts, generatedAt)

  assert.equal(timedPosts[0].publishedAt, '2026-09-30T11:00:00.000Z')
  assert.equal(timedPosts[1].publishedAt, '2026-09-30T08:00:00.000Z')
  assert.equal(timedPosts[15].publishedAt, '2026-09-28T14:00:00.000Z')
  assert.equal(timedPosts.filter((item) => Date.parse(generatedAt) - Date.parse(item.publishedAt) <= 6 * 60 * 60 * 1000).length, 2)
  assert.equal(timedPosts.filter((item) => Date.parse(generatedAt) - Date.parse(item.publishedAt) <= 24 * 60 * 60 * 1000).length, 8)
})
