import assert from 'node:assert/strict'
import test from 'node:test'

import { loadXHotBoard } from '../../lib/x/workbench/xHotBoard.js'

test('未配置接口时回退内置示例数据', async () => {
  const board = await loadXHotBoard({ apiBase: '', limit: 10, fetchImpl: async () => { throw new Error('unused') } })
  assert.equal(board.tweets.length >= 1, true)
  assert.equal(board.accounts.length >= 1, true)
  assert.equal(board.meta.source, 'bundled')
  assert.match(board.gaps.join(' '), /X_HOT_BOARD_API_BASE/)
})

test('解析 x-bangdan 兼容接口', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('/api/tweets')) {
      return {
        ok: true,
        async json() {
          return {
            items: [{
              id: '9',
              author: '测试作者',
              handle: '@demo_user',
              category: 'AI实战',
              content: 'hello hot board',
              url: 'https://x.com/demo_user/status/9',
              views: 1000,
              likes: 10,
              retweets: 2,
              score: 77,
              rank: 1,
            }],
            meta: { source: 'supabase', updatedAt: '2026-11-23T10:00:00.000Z' },
          }
        },
      }
    }
    if (String(url).includes('/api/creators')) {
      return {
        ok: true,
        async json() {
          return {
            items: [{
              handle: '@demo_user',
              author: '测试作者',
              totalViews: 1000,
              index: 80.1,
              tweetCount: 2,
              rank: 1,
            }],
            meta: { source: 'supabase', updatedAt: '2026-11-23T10:00:00.000Z' },
          }
        },
      }
    }
    throw new Error(`unexpected url ${url}`)
  }
  const board = await loadXHotBoard({ apiBase: 'https://hot.example', limit: 10, fetchImpl })
  assert.equal(board.tweets[0].handle, 'demo_user')
  assert.equal(board.tweets[0].score, 77)
  assert.equal(board.accounts[0].index, 80.1)
  assert.equal(board.meta.source, 'supabase')
  assert.equal(board.unavailable, false)
})