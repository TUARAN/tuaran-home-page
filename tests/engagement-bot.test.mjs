import assert from 'node:assert/strict'
import test from 'node:test'

import { commentProviderLabel } from '../lib/userDisplayName.js'
import {
  DEFAULT_ENGAGEMENT_BOT_SETTINGS,
  DEFAULT_ENGAGEMENT_BOTS,
  READER_PROVIDER,
  buildEngagementCommentMessages,
  contentMatchesPrefixes,
  filterPublishedContent,
  normalizeBotInput,
  normalizeEngagementBotSettings,
  parseStoredEngagementBotSettings,
  planEngagementRun,
  readerUserId,
  readerVoterKey,
  sanitizeGeneratedComment,
  shouldSkipRun,
} from '../lib/engagementBot.js'

test('default settings stay off and keep a sparse cadence', () => {
  const settings = parseStoredEngagementBotSettings('')
  assert.equal(settings.enabled, false)
  assert.equal(settings.likesPerRun, 2)
  assert.equal(settings.commentsPerRun, 1)
  assert.ok(settings.skipProbability > 0)
  assert.deepEqual(settings.contentPrefixes, ['article:', 'research:'])
  assert.equal(DEFAULT_ENGAGEMENT_BOTS.length, 10)
})

test('reader identities are stable and distinct from guests', () => {
  assert.equal(READER_PROVIDER, 'reader')
  assert.equal(readerUserId('wanfeng'), 'reader:wanfeng')
  assert.equal(readerVoterKey('wanfeng'), 'user:reader:wanfeng')
  assert.equal(commentProviderLabel('reader'), '路过')
  assert.equal(commentProviderLabel('guest'), '游客')
  assert.equal(commentProviderLabel('github'), 'GitHub')
})

test('content prefix filter keeps articles and research only by default', () => {
  assert.equal(contentMatchesPrefixes('article:hello', ['article:', 'research:']), true)
  assert.equal(contentMatchesPrefixes('research:topics:foo', ['article:', 'research:']), true)
  assert.equal(contentMatchesPrefixes('resource:kit', ['article:', 'research:']), false)
  const filtered = filterPublishedContent([
    { contentKey: 'article:a', title: 'A', status: 'published' },
    { contentKey: 'resource:b', title: 'B', status: 'published' },
    { contentKey: 'article:draft', title: 'D', status: 'draft' },
  ])
  assert.deepEqual(filtered.map((item) => item.contentKey), ['article:a'])
})

test('plan picks distinct comment articles and skips already liked pairs', () => {
  const bots = [
    { id: 1, slug: 'wanfeng', displayName: '晚风', enabled: true },
    { id: 2, slug: 'aning', displayName: '阿宁', enabled: true },
  ]
  const articles = [
    { contentKey: 'article:one', title: '一' },
    { contentKey: 'article:two', title: '二' },
  ]
  const plan = planEngagementRun({
    bots,
    articles,
    likedPairs: new Set(['1:article:one']),
    recentCommentPairs: new Set(),
    likesPerRun: 2,
    commentsPerRun: 2,
    rng: () => 0,
  })
  assert.equal(plan.likes.length, 2)
  assert.ok(!plan.likes.some((item) => item.bot.id === 1 && item.article.contentKey === 'article:one'))
  assert.equal(plan.comments.length, 2)
  assert.equal(new Set(plan.comments.map((item) => item.article.contentKey)).size, 2)
  assert.equal(new Set(plan.comments.map((item) => item.bot.id)).size, 2)
})

test('random skip can be forced off', () => {
  const settings = normalizeEngagementBotSettings({ skipProbability: 1 })
  assert.equal(shouldSkipRun(settings, { rng: () => 0 }), true)
  assert.equal(shouldSkipRun(settings, { force: true, rng: () => 0 }), false)
})

test('generated comments are sanitized to a short human line', () => {
  assert.equal(sanitizeGeneratedComment('评论：这题目把节奏写清楚了不少。'), '这题目把节奏写清楚了不少。')
  assert.equal(sanitizeGeneratedComment('“看完只记住这个判断就够了。”'), '看完只记住这个判断就够了。')
  assert.equal(sanitizeGeneratedComment('作为AI我觉得写得很好。'), '')
  assert.equal(sanitizeGeneratedComment('短'), '')
  const long = sanitizeGeneratedComment(`${'这句观察可以再往具体处收一收，'.repeat(8)}结尾。`, { maxChars: 40, minChars: 12 })
  assert.ok(long.length <= 40)
})

test('comment prompt names the persona and forbids bot self-reference', () => {
  const messages = buildEngagementCommentMessages({
    bot: { displayName: '晚风', voicePrompt: '短句' },
    article: { title: '标题', summary: '摘要' },
  })
  assert.match(messages[0].content, /晚风/)
  assert.match(messages[0].content, /不要提自己是模型或机器人/)
  assert.match(messages[1].content, /标题/)
})

test('bot input rejects empty names and normalizes slug', () => {
  assert.equal(normalizeBotInput({ slug: '晚风', displayName: '晚风', voicePrompt: '短句' }).error, 'INVALID_SLUG')
  const ok = normalizeBotInput({ slug: 'Wan-Feng', displayName: '晚风', voicePrompt: '短句，不恭维。' })
  assert.equal(ok.bot.slug, 'wan-feng')
  assert.equal(ok.bot.displayName, '晚风')
})
