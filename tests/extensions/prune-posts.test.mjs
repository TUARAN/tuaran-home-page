import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const prune = require('../../tools/x-reply-clipboard-extension/prunePosts.js')

const DAY = 24 * 60 * 60 * 1000
const now = Date.parse('2026-10-30T09:00:00+08:00')

test('low-quality posts use view tiers and still require a full day', () => {
  const base = {
    own: true, repost: false, pinned: false, at: now - DAY - 1000,
    views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, bookmarks: 0,
  }
  assert.equal(prune.VIEW_LIMIT, 100)
  assert.equal(prune.VIEW_WEAK, 400)
  assert.equal(prune.classifyPost({ ...base, views: 99 }, now), true)
  assert.equal(prune.classifyPost({ ...base, views: 99, likes: 1 }, now), true)
  assert.equal(prune.classifyPost({ ...base, views: 99, likes: 2 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 80, replies: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 80, reposts: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 80, quotes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 80, bookmarks: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 100 }, now), true)
  assert.equal(prune.classifyPost({ ...base, views: 399 }, now), true)
  assert.equal(prune.classifyPost({ ...base, views: 250, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 400 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 2000 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: null }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 20, likes: null }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 0, at: now - 60 * 60 * 1000 }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 0, pinned: true }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 0, repost: true }, now), false)
  assert.equal(prune.classifyPost({ ...base, views: 0, own: false }, now), false)
  assert.equal(prune.VIEW_STEP, 50)
  assert.equal(prune.ageViewLimit(30 * DAY), 150)
  assert.equal(prune.ageViewLimit(60 * DAY), 200)
  assert.equal(prune.ageViewLimit(90 * DAY), 250)
  assert.equal(prune.ageViewLimit(120 * DAY), 300)
  assert.equal(prune.ageViewLimit(150 * DAY), 350)
  assert.equal(prune.ageViewLimit(360 * DAY), 700)
  assert.equal(prune.ageViewLimit(29 * DAY), null)
  assert.equal(prune.classifyPost({ ...base, at: now - 30 * DAY, views: 149, likes: 5, replies: 2 }, now), true)
  assert.equal(prune.classifyPost({ ...base, at: now - 30 * DAY, views: 150, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, at: now - 29 * DAY, views: 149, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, at: now - 60 * DAY, views: 199, likes: 4, replies: 3 }, now), true)
  assert.equal(prune.classifyPost({ ...base, at: now - 60 * DAY, views: 200, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, at: now - 59 * DAY, views: 180, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, at: now - 60 * DAY, views: 80, likes: null }, now), true)
  assert.equal(prune.classifyPost({ ...base, at: now - 90 * DAY, views: 249, likes: 9, replies: 3 }, now), true)
  assert.equal(prune.classifyPost({ ...base, at: now - 90 * DAY, views: 250, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, at: now - 120 * DAY, views: 299, likes: null }, now), true)
  assert.equal(prune.classifyPost({ ...base, at: now - 120 * DAY, views: 300, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...base, at: now - 210 * DAY, views: 449, likes: 8 }, now), true)
  assert.equal(prune.classifyPost({ ...base, at: now - 210 * DAY, views: 450, likes: 1 }, now), false)
  assert.equal(prune.TEXT_VIEW_EXTRA, 100)
  const media = { ...base, textOnly: false }
  assert.equal(prune.classifyPost({ ...media, views: 150, likes: 1 }, now), true)
  assert.equal(prune.classifyPost({ ...media, views: 200, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...media, views: 499 }, now), true)
  assert.equal(prune.classifyPost({ ...media, views: 500 }, now), false)
  assert.equal(prune.classifyPost({ ...media, at: now - 30 * DAY, views: 249, likes: 5, replies: 2 }, now), true)
  assert.equal(prune.classifyPost({ ...media, at: now - 30 * DAY, views: 250, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...media, at: now - 90 * DAY, views: 349, likes: 4 }, now), true)
  assert.equal(prune.classifyPost({ ...media, at: now - 90 * DAY, views: 350, likes: 1 }, now), false)
  const text = { ...base, textOnly: true }
  assert.equal(prune.classifyPost({ ...text, views: 150, likes: 1 }, now), false)
  assert.equal(prune.classifyPost({ ...text, at: now - 30 * DAY, views: 149, likes: 5 }, now), true)
  assert.equal(prune.classifyPost({ ...text, at: now - 30 * DAY, views: 150, likes: 1 }, now), false)
  assert.equal(prune.postIsTextOnly({ querySelector: () => null }), true)
  assert.equal(prune.postIsTextOnly({ querySelector: (selector) => String(selector).includes("tweetPhoto") ? {} : null }), false)
  assert.equal(prune.postIsTextOnly({ querySelector: (selector) => String(selector).includes("videoPlayer") ? {} : null }), false)
  assert.equal(prune.viewCountFromLabel('99 views. View post analytics'), 99)
  assert.equal(prune.viewCountFromLabel('1.2万 次查看'), 12000)
  assert.equal(prune.likeCountFromLabel('Like', ''), 0)
  assert.equal(prune.likeCountFromLabel('2 Likes. Like', '2'), 2)
  assert.equal(prune.bookmarkCountFromLabel('Bookmark', ''), 0)
  assert.equal(prune.repostCountFromLabel('1 次转帖。转帖', '1'), 1)
})

test('delete confirmation only matches the delete action', () => {
  const item = (text) => ({ innerText: text, textContent: text })
  const doc = {
    querySelectorAll(selector) {
      if (selector === '[role="menuitem"]') return [item('取消关注'), item('删除')]
      if (selector.includes('dialog')) return [{
        innerText: '删除帖子？',
        textContent: '删除帖子？',
        querySelector: () => ({ innerText: '删除' }),
        querySelectorAll: () => [item('取消'), item('删除')],
      }]
      return []
    },
  }
  assert.equal(prune.findDeleteMenuItem(doc).innerText, '删除')
  assert.equal(prune.findDeleteConfirm(doc).innerText, '删除')
})

test('prune plans use the same round counts as the speed profiles, with 15 posts per round', () => {
  const previous = globalThis.XReplyClipboardLoop
  globalThis.XReplyClipboardLoop = require('../../tools/x-reply-clipboard-extension/loop.js')
  try {
    assert.equal(prune.ROUND_SIZE, 15)
    const slow = prune.createPrunePlan('slow', () => 0)
    assert.equal(slow.rounds, 2)
    assert.equal(slow.roundSize, 15)
    assert.equal(slow.roundIntervalMs, 15000)
    assert.equal(prune.createPrunePlan('medium', () => 0.999).rounds, 5)
    assert.equal(prune.createPrunePlan('turbo', () => 0.999).rounds, 8)
    const boundary = prune.createPrunePlan('boundary', () => 0)
    assert.equal(boundary.pace, 'medium')
    assert.equal(boundary.rounds, 3)
  } finally {
    if (previous) globalThis.XReplyClipboardLoop = previous
    else delete globalThis.XReplyClipboardLoop
  }
})

test('a prune session keeps deleting after 15 posts until the planned rounds finish', async () => {
  const postedAt = new Date(now - DAY - 1000).toISOString()
  let serial = 0
  let current = null
  const makeArticle = (id) => {
    let connected = true
    const article = {
      get isConnected() { return connected },
      parentElement: null,
      querySelector(selector) {
        const name = String(selector)
        if (name.includes('/status/')) return { getAttribute: () => `/me/status/${id}` }
        if (name.includes('socialContext')) return { innerText: '', textContent: '' }
        if (name.includes('reply')) return { getAttribute: () => '0 Replies. Reply', innerText: '0', textContent: '0' }
        if (name.includes('like')) return { getAttribute: () => '0 Likes. Like', innerText: '0', textContent: '0' }
        if (name.includes('retweet')) return { getAttribute: () => '0 reposts. Repost', innerText: '0', textContent: '0' }
        if (name.includes('bookmark')) return { getAttribute: () => 'Bookmark', innerText: '', textContent: '' }
        if (name.includes('analytics')) return { getAttribute: () => '19 views. View post analytics', innerText: '19', textContent: '19' }
        if (name === 'time') return { getAttribute: () => postedAt }
        if (name.includes('caret')) return { click() { current = article } }
        return null
      },
      disconnect() { connected = false },
    }
    return article
  }
  const doc = {
    body: { innerText: '', textContent: '' },
    documentElement: { scrollHeight: 800 },
    querySelector(selector) {
      return String(selector).includes('main') ? doc : null
    },
    querySelectorAll(selector) {
      const name = String(selector)
      if (name.includes('tweet')) {
        if (!current || !current.isConnected) current = makeArticle(++serial)
        return [current]
      }
      if (name === '[role="menuitem"]') return [{ innerText: '删除', textContent: '删除', click() {} }]
      if (name.includes('dialog') || name.includes('confirmation')) {
        return [{
          innerText: '删除帖子？',
          textContent: '删除帖子？',
          querySelector: () => ({ click() { current?.disconnect() } }),
          querySelectorAll: () => [],
        }]
      }
      return []
    },
  }
  const waits = []
  let clock = now
  const previousLoop = globalThis.XReplyClipboardLoop
  globalThis.XReplyClipboardLoop = require('../../tools/x-reply-clipboard-extension/loop.js')
  const controller = prune.createController({
    document: doc,
    window: { scrollBy() {}, innerHeight: 700 },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => {
      waits.push(ms)
      clock += ms
    },
  })
  try {
    const result = await controller.start({ pace: 'slow', random: () => 0 })
    assert.equal(result.deleted, 30)
    assert.equal(waits.filter((ms) => ms === 15000).length, 1)
    assert.equal(result.running, false)
  } finally {
    if (previousLoop) globalThis.XReplyClipboardLoop = previousLoop
    else delete globalThis.XReplyClipboardLoop
  }
})

test('unlimited prune keeps the day-old rule, skips round waits, and rescans after the profile ends', async () => {
  const freshAt = new Date(now - DAY - 1000).toISOString()
  const pool = Array.from({ length: 24 }, (_, index) => {
    const id = index + 1
    let connected = true
    const article = {
      id,
      get isConnected() { return connected },
      parentElement: null,
      querySelector(selector) {
        const name = String(selector)
        if (name.includes('/status/')) return { getAttribute: () => `/me/status/${id}` }
        if (name.includes('socialContext')) return { innerText: '', textContent: '' }
        if (name.includes('reply')) return { getAttribute: () => '0 Replies. Reply', innerText: '0', textContent: '0' }
        if (name.includes('like')) return { getAttribute: () => '0 Likes. Like', innerText: '0', textContent: '0' }
        if (name.includes('retweet')) return { getAttribute: () => '0 reposts. Repost', innerText: '0', textContent: '0' }
        if (name.includes('bookmark')) return { getAttribute: () => 'Bookmark', innerText: '', textContent: '' }
        if (name.includes('analytics')) return { getAttribute: () => '10 views', innerText: '10', textContent: '10' }
        if (name === 'time') return { getAttribute: () => freshAt }
        if (name.includes('caret')) return { click() { active = article } }
        return null
      },
      disconnect() { connected = false },
    }
    return article
  })
  let cursor = 0
  let active = null
  let scrollY = 0
  const doc = {
    body: { innerText: '', textContent: '', scrollHeight: 1200 },
    documentElement: { scrollHeight: 1200, scrollTop: 0 },
    scrollingElement: null,
    querySelector(selector) {
      return String(selector).includes('main') ? doc : null
    },
    querySelectorAll(selector) {
      const name = String(selector)
      if (name.includes('tweet')) {
        return pool.slice(cursor, cursor + 3).filter((article) => article.isConnected)
      }
      if (name === '[role="menuitem"]') return [{ innerText: '删除', textContent: '删除', click() {} }]
      if (name.includes('dialog') || name.includes('confirmation')) {
        return [{
          innerText: '删除帖子？',
          textContent: '删除帖子？',
          querySelector: () => ({
            click() {
              active?.disconnect()
              if (active) {
                const index = pool.indexOf(active)
                if (index >= 0 && index === cursor) cursor = Math.min(pool.length, cursor + 1)
              }
            },
          }),
          querySelectorAll: () => [],
        }]
      }
      return []
    },
  }
  doc.scrollingElement = doc.documentElement
  const waits = []
  let clock = now
  const previousLoop = globalThis.XReplyClipboardLoop
  globalThis.XReplyClipboardLoop = require('../../tools/x-reply-clipboard-extension/loop.js')
  const messages = []
  let controller = null
  controller = prune.createController({
    document: doc,
    onUpdate(snapshot) { messages.push(snapshot.status) },
    window: {
      get scrollY() { return scrollY },
      innerHeight: 700,
      scrollTo() { scrollY = 0 },
      scrollBy(_opts, maybeY) {
        const delta = typeof _opts === 'number' ? _opts : (Number(maybeY) || Number(_opts?.top) || 700)
        if (cursor < pool.length) {
          cursor += 1
          doc.documentElement.scrollHeight = 1200 + cursor * 40
        }
        const maxTop = Math.max(0, doc.documentElement.scrollHeight - 700)
        scrollY = Math.min(maxTop, scrollY + delta)
        doc.documentElement.scrollTop = scrollY
      },
    },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => {
      waits.push(ms)
      clock += ms
      if (ms === prune.RESCAN_GAP_MS) controller.stop()
    },
  })
  try {
    const result = await controller.start({ pace: 'slow', unlimited: true, random: () => 0 })
    assert.equal(result.deleted, 24)
    assert.equal(result.unlimited, true)
    assert.equal(result.rounds, 0)
    assert.equal(waits.includes(15000), false)
    assert.ok(waits.filter((ms) => ms === prune.UNLIMITED_DELETE_GAP_MS).length >= 20)
    assert.ok(waits.includes(prune.RESCAN_GAP_MS))
    assert.ok(messages.some((message) => /从顶部继续/.test(message)))
    assert.equal(result.running, false)
  } finally {
    if (previousLoop) globalThis.XReplyClipboardLoop = previousLoop
    else delete globalThis.XReplyClipboardLoop
  }
})

test('unlimited prune stops immediately when X shows a rate-limit warning', async () => {
  const postedAt = new Date(now - DAY - 1000).toISOString()
  let limited = false
  let current = null
  let serial = 0
  const makeArticle = (id) => {
    let connected = true
    const article = {
      get isConnected() { return connected },
      parentElement: null,
      querySelector(selector) {
        const name = String(selector)
        if (name.includes('/status/')) return { getAttribute: () => `/me/status/${id}` }
        if (name.includes('socialContext')) return { innerText: '', textContent: '' }
        if (name.includes('reply')) return { getAttribute: () => '0 Replies. Reply', innerText: '0', textContent: '0' }
        if (name.includes('like')) return { getAttribute: () => '0 Likes. Like', innerText: '0', textContent: '0' }
        if (name.includes('retweet')) return { getAttribute: () => '0 reposts. Repost', innerText: '0', textContent: '0' }
        if (name.includes('bookmark')) return { getAttribute: () => 'Bookmark', innerText: '', textContent: '' }
        if (name.includes('analytics')) return { getAttribute: () => '10 views', innerText: '10', textContent: '10' }
        if (name === 'time') return { getAttribute: () => postedAt }
        if (name.includes('caret')) return { click() { current = article } }
        return null
      },
      disconnect() { connected = false },
    }
    return article
  }
  const doc = {
    body: {
      get innerText() { return limited ? '操作过于频繁' : '' },
      get textContent() { return limited ? '操作过于频繁' : '' },
    },
    documentElement: { scrollHeight: 800 },
    querySelector(selector) {
      return String(selector).includes('main') ? doc : null
    },
    querySelectorAll(selector) {
      const name = String(selector)
      if (name.includes('tweet')) {
        if (!current || !current.isConnected) current = makeArticle(++serial)
        return [current]
      }
      if (name === '[role="menuitem"]') return [{ innerText: '删除', textContent: '删除', click() {} }]
      if (name.includes('dialog') || name.includes('confirmation')) {
        return [{
          innerText: '删除帖子？',
          textContent: '删除帖子？',
          querySelector: () => ({
            click() {
              if (serial >= 2) limited = true
              else current?.disconnect()
            },
          }),
          querySelectorAll: () => [],
        }]
      }
      return []
    },
  }
  let clock = now
  const controller = prune.createController({
    document: doc,
    window: { scrollBy() {}, innerHeight: 700 },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
  })
  const result = await controller.start({ pace: 'turbo', unlimited: true, random: () => 0 })
  assert.equal(result.deleted, 1)
  assert.match(result.status, /操作受限/)
  assert.equal(result.running, false)
})

test('prune stops the session when the profile runs out before the planned rounds', async () => {
  const postedAt = new Date(now - DAY - 1000).toISOString()
  const articles = [1, 2, 3].map((id) => {
    let connected = true
    const article = {
      id,
      get isConnected() { return connected },
      parentElement: null,
      querySelector(selector) {
        const name = String(selector)
        if (name.includes('/status/')) return { getAttribute: () => `/me/status/${id}` }
        if (name.includes('socialContext')) return { innerText: '', textContent: '' }
        if (name.includes('reply')) return { getAttribute: () => '0 Replies. Reply', innerText: '0', textContent: '0' }
        if (name.includes('like')) return { getAttribute: () => '0 Likes. Like', innerText: '0', textContent: '0' }
        if (name.includes('retweet')) return { getAttribute: () => '0 reposts. Repost', innerText: '0', textContent: '0' }
        if (name.includes('bookmark')) return { getAttribute: () => 'Bookmark', innerText: '', textContent: '' }
        if (name.includes('analytics')) return { getAttribute: () => '10 views', innerText: '10', textContent: '10' }
        if (name === 'time') return { getAttribute: () => postedAt }
        if (name.includes('caret')) return { click() { active = article } }
        return null
      },
      disconnect() { connected = false },
    }
    return article
  })
  let active = null
  const doc = {
    body: { innerText: '', textContent: '' },
    documentElement: { scrollHeight: 500 },
    querySelector(selector) {
      return String(selector).includes('main') ? doc : null
    },
    querySelectorAll(selector) {
      const name = String(selector)
      if (name.includes('tweet')) return articles.filter((article) => article.isConnected)
      if (name === '[role="menuitem"]') return [{ innerText: '删除', textContent: '删除', click() {} }]
      if (name.includes('dialog') || name.includes('confirmation')) {
        return [{
          innerText: '删除帖子？',
          textContent: '删除帖子？',
          querySelector: () => ({ click() { active?.disconnect() } }),
          querySelectorAll: () => [],
        }]
      }
      return []
    },
  }
  let clock = now
  const controller = prune.createController({
    document: doc,
    window: { scrollBy() {}, innerHeight: 700 },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
  })
  const result = await controller.start({ pace: 'medium', random: () => 0.999 })
  assert.equal(result.deleted, 3)
  assert.equal(result.running, false)
})
