import assert from 'node:assert/strict'
import test from 'node:test'

import { loadObservedActions, presentObservedActions } from '../../lib/interaction/dailyTop/ownActivity.js'
import {
  ACTION_CATEGORIES,
  ACTION_LABELS,
  OBSERVED_AGENTS,
  THEORY_POINTS,
  accountBoardConclusion,
  actionCount,
  agentFootnote,
  blankActions,
  hotBoardAccountConclusion,
  hotBoardTweetConclusion,
  presentRadarPerformance,
  tweetBoardConclusion,
} from '../../lib/x/workbench/observeCore.js'
import { observeHome } from '../../lib/x/workbench/observeStore.js'

const BANNED = /不是.+而是|本页|本篇|下面|接下来/

test('公开站观察账号池全部智能体，理论结论对得到卡片指标', () => {
  assert.deepEqual(OBSERVED_AGENTS.map((agent) => [agent.name, agent.handle]), [
    ['矿工阿三', 'tarsixseveneig1'],
    ['矿长阿富', 'TuaranX'],
    ['矿工小十三', 'tuaran003'],
    ['矿工阿柒', 'DrBenjamin81269'],
    ['灯下掘行者', 'DrBenjamin5102'],
  ])
  const metricKeys = new Set([...ACTION_LABELS.map(([key]) => key), 'views', 'interactions'])
  for (const point of THEORY_POINTS) {
    assert.equal(BANNED.test(point.text), false)
    for (const key of point.metrics) assert.equal(metricKeys.has(key), true)
  }
  assert.equal(BANNED.test(agentFootnote({ reportDate: '2026-11-23' })), false)
  assert.match(agentFootnote({ reportDate: '2026-11-23' }), /2026-11-23/)
  assert.match(agentFootnote({ reportDate: '2026-11-23' }), /@tarsixseveneig1、@TuaranX、@tuaran003、@DrBenjamin81269、@DrBenjamin5102/)
  assert.doesNotMatch(agentFootnote({ reportDate: '2026-11-23' }), /推文曝光/)
  assert.match(agentFootnote({ reportDate: '2026-11-23' }), /未采集/)
  assert.match(agentFootnote({ reportDate: '2026-11-23', lastUploadedAt: Date.UTC(2026, 10, 23, 6, 30) }), /上次更新：2026-11-23 14:30（北京时间）。/)
  assert.match(agentFootnote({ pendingUpdate: true }), /上次更新：读取中。/)
  assert.match(agentFootnote({ reportDate: '2026-11-23', lastUploadedAt: null }), /上次更新：当日尚无日报上传。/)
})

test('分类与插件日报面板同一套八类；关注含回关，缺列保持未采集', () => {
  const actions = presentObservedActions({
    comments: 4,
    likes: 2,
    follows: 1,
    followBacks: 3,
    unfollows: 0,
    posts: 5,
    communityShares: 2,
    prunes: 1,
    replyPrunes: 0,
    timelineComments: 1,
    notificationComments: 2,
    kolComments: 2,
  })
  assert.equal(actions.follows, 1)
  assert.equal(actions.followBacks, 3)
  assert.equal(actionCount(actions, 'follows'), 4)
  assert.equal(actions.comments, 5)
  assert.equal(actions.unfollows, 0)
  assert.equal(actions.communityShares, 2)
  assert.equal(actions.prunes, 1)
  assert.deepEqual(ACTION_LABELS, [
    ['comments', '评论'],
    ['likes', '点赞'],
    ['follows', '关注'],
    ['unfollows', '取关'],
    ['posts', '发帖'],
    ['communityShares', '社群'],
    ['prunes', '删帖'],
    ['replyPrunes', '删评论'],
  ])
  assert.deepEqual(ACTION_CATEGORIES.map(({ key }) => key), [
    'comments', 'likes', 'follows', 'unfollows', 'posts', 'communityShares', 'prunes', 'replyPrunes',
  ])
  assert.equal(actionCount({ follows: null, followBacks: null }, 'follows'), null)
  assert.equal(actionCount({ follows: null, followBacks: 2 }, 'follows'), 2)
  assert.equal(actionCount({ communityShares: 0 }, 'communityShares'), 0)
  assert.equal(actionCount({}, 'prunes'), null)
  assert.equal(presentObservedActions(null), null)
  assert.equal(presentObservedActions({ comments: 1, posts: null }).posts, null)
  assert.deepEqual(blankActions(), {
    posts: null, comments: null, likes: null, follows: null, followBacks: null, unfollows: null,
    communityShares: null, prunes: null, replyPrunes: null,
  })
  assert.match(agentFootnote({ reportDate: '2026-11-23' }), /八类/)
  assert.match(agentFootnote({ reportDate: '2026-11-23' }), /关注一栏含回关/)
})

test('没有日报行时动作是空，缺列不补零', async () => {
  const calls = []
  const db = {
    prepare(sql) {
      calls.push(sql)
      return {
        bind() { return this },
        async all() {
          if (String(sql).includes('SUM(posts)')) throw new Error('no such column: posts')
          return {
            results: [{
              handle: 'tuaranx',
              comments: 2,
              likes: 0,
              follows: 1,
              unfollows: 0,
              followBacks: 4,
              posts: null,
              timelineComments: null,
              notificationComments: null,
              kolComments: null,
            }],
          }
        },
      }
    },
  }
  const found = await loadObservedActions(db, {
    handles: ['TuaranX', 'tuaran003'],
    reportDate: '2026-11-23',
  })
  assert.equal(found.get('tuaranx').posts, null)
  assert.equal(found.get('tuaranx').likes, 0)
  assert.equal(found.get('tuaranx').followBacks, 4)
  assert.equal(found.get('tuaran003'), null)
  assert.match(calls[0], /SUM\(posts\)/)
  assert.match(calls[1], /NULL AS posts/)
})

test('推文结论按曝光榜计算；没有话题时不编造占比', () => {
  assert.equal(tweetBoardConclusion([]), '今日还没有收录推文。')
  assert.equal(tweetBoardConclusion([], { unavailable: true }), '推文收录暂时读不到。')
  const items = [
    { views: 80, media: 'image', topic: '' },
    { views: 20, media: 'none', topic: '' },
  ]
  assert.equal(tweetBoardConclusion(items), '话题分类未采集。今日曝光集中在图文，占曝光榜 80%。')
  const tagged = [
    { views: 70, media: 'video', topic: '电路' },
    { views: 30, media: 'image', topic: '日常' },
  ]
  assert.equal(tweetBoardConclusion(tagged), '今日曝光集中在电路，占曝光榜 70%。形式集中在视频，占曝光榜 70%。')
})

test('账号结论用当前榜的曝光，不把空榜写成 0%', () => {
  assert.equal(accountBoardConclusion([]), '今日还没有收录账号。')
  assert.equal(accountBoardConclusion([{ handle: 'a', views: 0 }, { handle: 'b', views: 0 }]), '今日账号榜收录 2 个账号，展示合计为 0。')
  assert.equal(
    accountBoardConclusion([{ handle: 'alice', views: 75 }, { handle: 'bob', views: 25 }], '昨日'),
    '昨日曝光集中在 @alice，占账号榜 75%。',
  )
})

test('没有收录推文时曝光与互动是未采集，有推文时 0 保留', () => {
  assert.deepEqual(presentRadarPerformance(null), { views: null, interactions: null, tweets: null })
  assert.deepEqual(presentRadarPerformance({ tweets: 2, views: 0, likes: 0, reposts: 1, replies: 2 }), {
    views: 0,
    interactions: 3,
    tweets: 2,
  })
})

test('热榜结论与涨粉榜结论', () => {
  assert.match(hotBoardTweetConclusion([
    { category: 'AI实战', score: 80 },
    { category: 'AI实战', score: 20 },
  ]), /AI实战/)
  assert.equal(hotBoardAccountConclusion([{ handle: 'demo', index: 88.2 }]), '今日涨粉潜力最高的是 @demo，指数 88.2。')
})

test('首页返回账号池全部智能体的日报动作', async () => {
  const now = Date.UTC(2026, 10, 23, 6)
  const db = {
    prepare(sql) {
      return {
        bind() { return this },
        async all() {
          const text = String(sql)
          if (text.includes('MAX(uploaded_at)')) throw new Error('use first() for latest upload query')
          if (text.includes('x_extension_daily_reports')) {
            return { results: [{ handle: 'TuaranX', comments: 3, likes: 1, follows: 2, unfollows: 0, followBacks: 1, posts: 4, timelineComments: null, notificationComments: null, kolComments: null }] }
          }
          throw new Error(`unexpected sql ${text}`)
        },
        async first() {
          const text = String(sql)
          if (text.includes('MAX(uploaded_at)')) {
            return { uploaded_at: Date.UTC(2026, 10, 23, 2, 15) }
          }
          throw new Error(`unexpected sql ${text}`)
        },
      }
    },
  }
  const home = await observeHome(db, {}, now)
  assert.equal(home.reportDate, '2026-11-23')
  assert.equal(home.tweets, undefined)
  assert.equal(home.accounts, undefined)
  assert.deepEqual(home.agents.map((agent) => agent.handle), [
    'tarsixseveneig1',
    'TuaranX',
    'tuaran003',
    'DrBenjamin81269',
    'DrBenjamin5102',
  ])
  const reported = home.agents.find((agent) => agent.handle === 'TuaranX')
  assert.equal(reported.actions.posts, 4)
  assert.equal(reported.actions.follows, 2)
  assert.equal(home.agents[0].actions.posts, null)
  assert.equal(home.agents[2].actions.comments, null)
  assert.match(home.footnote, /2026-11-23/)
  assert.doesNotMatch(home.footnote, /8:00/)
  assert.equal(home.lastUploadedAt, Date.UTC(2026, 10, 23, 2, 15))
  assert.match(home.footnote, /上次更新：2026-11-23 10:15（北京时间）。/)
})
