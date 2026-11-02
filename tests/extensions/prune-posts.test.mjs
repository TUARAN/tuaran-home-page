import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

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

test('low-quality replies require 30 days and zero visible engagement regardless of views', () => {
  const base = {
    own: true, repost: false, pinned: false, at: now - 30 * DAY,
    views: 99, likes: 0, replies: 0, reposts: 0, quotes: 0, bookmarks: 0,
  }
  assert.equal(prune.classifyReply(base, now), true)
  assert.equal(prune.classifyReply({ ...base, at: now - 29 * DAY }, now), false)
  assert.equal(prune.classifyReply({ ...base, views: 10000 }, now), true)
  assert.equal(prune.classifyReply({ ...base, likes: 1 }, now), false)
  assert.equal(prune.classifyReply({ ...base, replies: 1 }, now), false)
  assert.equal(prune.classifyReply({ ...base, reposts: 1 }, now), false)
  assert.equal(prune.classifyReply({ ...base, bookmarks: 1 }, now), false)
  assert.equal(prune.classifyReply({ ...base, quotes: 1 }, now), false)
  assert.equal(prune.classifyReply({ ...base, bookmarks: null }, now), false)
  assert.equal(prune.classifyReply({ ...base, views: null }, now), true)
  assert.equal(prune.classifyReply({ ...base, own: false }, now), false)
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

test('repost search undoes reposts without deleting the original or counting a deleted post', async () => {
  let reposted = true
  let deletedCallbacks = 0
  let undoCallbacks = 0
  let stalledCounts = null
  let clock = now
  const article = {
    isConnected: true,
    parentElement: null,
    querySelector(selector) {
      if (selector === "time") return { getAttribute: () => new Date(now - 60 * DAY).toISOString() }
      if (String(selector).includes('/status/')) return { getAttribute: () => '/other/status/123' }
      if (selector === '[data-testid="unretweet"]') return reposted ? { click() {} } : null
      return null
    },
  }
  const doc = {
    body: { innerText: '' },
    documentElement: { scrollHeight: 700, scrollTop: 0 },
    querySelector(selector) {
      if (String(selector).includes('main')) return doc
      if (selector === '[data-testid="unretweetConfirm"]') return { click() { reposted = false } }
      return null
    },
    querySelectorAll(selector) {
      return String(selector).includes('article') ? [article] : []
    },
  }
  const controller = prune.createController({
    document: doc,
    window: { innerHeight: 700, scrollBy() {} },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
    onDeleted() { deletedCallbacks += 1 },
    onUnreposted() { undoCallbacks += 1 },
    onTimelineStalled: async ({ deleted, unreposted }) => {
      stalledCounts = { deleted, unreposted }
      return true
    },
  })
  const result = await controller.start({ unlimited: true, repostSearch: true, searchLabel: '2026年9月转发' })
  assert.equal(result.deleted, 0)
  assert.equal(result.unreposted, 1)
  assert.equal(deletedCallbacks, 0)
  assert.equal(undoCallbacks, 1)
  assert.equal(reposted, false)
  assert.deepEqual(stalledCounts, { deleted: 0, unreposted: 1 })
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
    assert.ok(prune.UNLIMITED_DELETE_GAP_MS >= 300)
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

test('older posts continue one calendar month at a time', () => {
  const latest = prune.nextPruneSearchWindow({ onProfile: true, oldestAt: 0, now })
  assert.equal(latest.since, '2026-09-01')
  assert.equal(latest.until, '2026-10-01')
  assert.match(latest.label, /2026年9月/)

  const fromProfile = prune.nextPruneSearchWindow({
    onProfile: true,
    oldestAt: Date.parse('2026-08-01T12:00:00Z'),
    now,
  })
  assert.equal(fromProfile.since, '2026-08-01')
  assert.equal(fromProfile.until, '2026-09-01')

  const finishedSeptember = prune.nextPruneSearchWindow({
    currentSince: '2026-09-01',
    currentUntil: '2026-10-01',
    oldestAt: Date.parse('2026-09-12T08:00:00+08:00'),
  })
  assert.equal(finishedSeptember.since, '2026-08-01')
  assert.equal(finishedSeptember.until, '2026-09-01')

  const sevenDayStuck = prune.nextPruneSearchWindow({
    currentSince: '2026-10-24',
    currentUntil: '2026-10-31',
  })
  assert.equal(sevenDayStuck.since, '2026-09-01')
  assert.equal(sevenDayStuck.until, '2026-10-01')

  assert.equal(prune.nextPruneSearchWindow({
    currentSince: '2006-01-01',
    currentUntil: '2006-02-01',
  }), null)
  assert.equal(prune.isPruneMonthWindow('2026-09-01', '2026-10-01'), true)
  assert.equal(prune.isPruneMonthWindow('2026-10-24', '2026-10-31'), false)
})

test('a newly started search begins at last month with no previous run progress', () => {
  assert.deepEqual(prune.freshPruneSearchProgress(now), {
    doneMonths: [], nextSince: '2026-09-01', nextUntil: '2026-10-01', nextKind: 'posts', deleted: 0,
  })
  assert.deepEqual(prune.freshPruneSearchProgress(Date.parse('2027-01-05T09:00:00+08:00')), {
    doneMonths: [], nextSince: '2026-12-01', nextUntil: '2027-01-01', nextKind: 'posts', deleted: 0,
  })
})

test('the extension scans originals then reposts before advancing to the previous month', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  const definition = source.match(/  function getPruneController\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const calls = []
  let query = 'from:me since:2026-09-01 until:2026-10-01 -filter:replies -filter:nativereposts'
  const context = vm.createContext({
    pruneController: null,
    pruneControllerMode: '',
    pruneTaskMode: () => 'prune-posts',
    pruneApi: { ...prune, createController(options) { return options } },
    document: {}, window: { location: { pathname: '/search' } },
    state: { assistantMode: 'prune-posts' }, lastKnownAccountHandle: 'me',
    currentAccountHandle: () => 'me',
    pruneSearchQuery: () => query,
    readPruneCursor: () => ({ since: '2026-09-01', until: '2026-10-01' }),
    monthLabel: (since) => `${since.slice(0, 7)} ·`,
    pruneMonthIsDone: () => false,
    writePruneCursor() {},
    pruneProgress: {},
    persistPruneProgress: async () => {},
    rangeAfterCompletedMonth: (since, deleted, unreposted) => ({ ...prune.nextPruneSearchWindow({ currentSince: since, currentUntil: '2026-10-01' }), kind: 'posts', deleted, unreposted }),
    markPruneMonthCompleted: async (since, range, deleted, unreposted) => { calls.push(['done', since, range.since, deleted, unreposted]) },
    assignPruneSearch: async (_handle, range, deleted, unreposted) => { calls.push(['navigate', range.since, range.kind, deleted, unreposted]) },
    reportCommunityAction() {}, renderPanel() {}, setRuntimeTaskActive() {},
  })
  vm.runInContext(`${definition}\nglobalThis.controller = getPruneController`, context)
  const controller = context.controller()
  const first = await controller.onTimelineStalled({ deleted: 12, unreposted: 0, oldestAt: Date.parse('2026-09-11T00:00:00Z') })
  query = 'from:me since:2026-09-01 until:2026-10-01 filter:nativereposts'
  const second = await controller.onTimelineStalled({ deleted: 12, unreposted: 4, oldestAt: Date.parse('2026-09-11T00:00:00Z') })
  assert.deepEqual(calls, [
    ['navigate', '2026-09-01', 'reposts', 12, 0],
    ['done', '2026-09-01', '2026-08-01', 12, 4],
    ['navigate', '2026-08-01', 'posts', 12, 4],
  ])
  assert.match(first, /转发/)
  assert.match(second, /2026年8月/)
  assert.match(source, /xrcAssistant=\$\{mode\}&xrcStart=1/)
})

test('repost month search stays recognized so it can advance instead of reopening itself', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  const definition = source.match(/  function pruneSearchQuery\(handle, mode = pruneTaskMode\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const url = 'https://x.com/search?q=from%3Atarsixseveneig1%20since%3A2026-09-01%20until%3A2026-10-01%20filter%3Anativereposts&src=typed_query&f=live&xrcAssistant=prune-posts&xrcStart=1'
  const context = vm.createContext({ window: { location: { href: url } }, URL, pruneTaskMode: () => 'prune-posts' })
  vm.runInContext(`${definition}\nglobalThis.searchQuery = pruneSearchQuery`, context)
  assert.match(context.searchQuery('tarsixseveneig1'), /filter:nativereposts/)
  assert.equal(context.searchQuery('another'), '')
})

test('reply cleanup uses its own controller and advances directly to the prior month', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  const definition = source.match(/  function getPruneController\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const calls = []
  const context = vm.createContext({
    pruneController: null, pruneControllerMode: '',
    pruneTaskMode: () => 'prune-replies',
    pruneApi: { ...prune, createController(options) { return options } },
    document: {}, window: { location: { pathname: '/search' } },
    state: { assistantMode: 'prune-replies' }, lastKnownAccountHandle: 'me',
    currentAccountHandle: () => 'me',
    pruneSearchQuery: () => 'from:me since:2026-09-01 until:2026-10-01 filter:replies',
    readPruneCursor: () => ({ since: '2026-09-01', until: '2026-10-01', kind: 'replies' }),
    monthLabel: (since) => `${since.slice(0, 7)} ·`,
    pruneMonthIsDone: () => false,
    writePruneCursor() {}, pruneProgress: {}, persistPruneProgress: async () => {},
    rangeAfterCompletedMonth: (since, deleted, unreposted) => ({ ...prune.nextPruneSearchWindow({ currentSince: since, currentUntil: '2026-10-01' }), kind: 'replies', deleted, unreposted }),
    markPruneMonthCompleted: async (since, range) => { calls.push(['done', since, range.since]) },
    assignPruneSearch: async (_handle, range) => { calls.push(['navigate', range.since, range.kind]) },
    reportCommunityAction() {}, renderPanel() {}, setRuntimeTaskActive() {},
  })
  vm.runInContext(`${definition}\nglobalThis.controller = getPruneController`, context)
  const controller = context.controller()
  assert.equal(controller.target, 'replies')
  await controller.onTimelineStalled({ deleted: 3, oldestAt: Date.parse('2026-09-11T00:00:00Z') })
  assert.deepEqual(calls, [
    ['done', '2026-09-01', '2026-08-01'],
    ['navigate', '2026-08-01', 'replies'],
  ])
})

test('a failed month search keeps its five-minute retry instead of the weekly prune gap', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  const definition = source.match(/function taskGapReadyAt\(item, rule, now = Date\.now\(\)\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(definition)
  const gapReadyAt = vm.runInNewContext(`${definition}\ntaskGapReadyAt`)
  const rule = { minGapMs: 7 * DAY }
  const item = { lastRunAt: now, resumeAt: now + 5 * 60 * 1000 }
  assert.equal(gapReadyAt(item, rule, now), now + 7 * DAY)
  assert.equal(gapReadyAt({ ...item, retryKind: 'prune-search-load' }, rule, now), 0)
  assert.match(source, /item\.resumeAt = shortPruneRetry \? waitUntil/)
})

test('search-month prune advances after a short empty pass even if the page keeps growing', async () => {
  const doc = {
    body: { innerText: '', textContent: '' },
    documentElement: { scrollHeight: 700, scrollTop: 0 },
    querySelector() { return null },
    querySelectorAll() { return [] },
  }
  doc.scrollingElement = doc.documentElement
  let clock = now
  let scrollY = 0
  const stalls = []
  const controller = prune.createController({
    document: doc,
    window: {
      get scrollY() { return scrollY },
      innerHeight: 700,
      scrollTo() { scrollY = 0 },
      scrollBy(x, y) {
        const delta = typeof x === 'number' ? x : Number(y) || 0
        scrollY += delta
        doc.documentElement.scrollHeight += 40
      },
    },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
  })
  const result = await controller.start({
    unlimited: true,
    random: () => 0,
    searchLabel: '2026年9月 · since:2026-09-01 until:2026-10-01',
    onTimelineStalled(detail) {
      stalls.push(detail)
      return '不限速 · 已删 0 条 · 已标记 2026-09-01 扫过，改查 2026年8月 · since:2026-08-01 until:2026-09-01'
    },
  })
  assert.equal(stalls.length, 1)
  assert.match(result.status, /2026年8月/)
})

test('an explicit no-results month advances immediately without scrolling or cooling down', async () => {
  let scrolls = 0
  let waits = 0
  let advances = 0
  const doc = {
    innerText: 'No results for "from:me since:2026-09-01 until:2026-10-01 filter:nativereposts"',
    body: { innerText: '' },
    querySelector(selector) { return selector === 'main[role="main"]' ? this : null },
    querySelectorAll() { return [] },
  }
  const controller = prune.createController({
    document: doc,
    window: { innerHeight: 700, scrollBy() { scrolls += 1 } },
    accountHandle: () => 'me',
    now: () => now,
    sleep: async () => { waits += 1 },
    onTimelineStalled() { advances += 1; return '已切换到 2026 年 8 月' },
  })
  const result = await controller.start({
    unlimited: true,
    searchLabel: '2026年9月 · since:2026-09-01 until:2026-10-01',
    repostSearch: true,
  })
  assert.equal(advances, 1)
  assert.equal(scrolls, 0)
  assert.equal(waits, 0)
  assert.match(result.status, /2026 年 8 月/)
})

test('month search visits newly loaded kept posts before advancing and never rescans the top', async () => {
  const ids = ['101', '102', '103', '104']
  let page = 0
  let scrollToTop = 0
  const postedAt = new Date(now - 60 * DAY).toISOString()
  const makeArticle = (id) => ({
    isConnected: true,
    parentElement: null,
    querySelector(selector) {
      const name = String(selector)
      if (name.includes('/status/')) return { getAttribute: () => `/me/status/${id}` }
      if (name === 'time') return { getAttribute: () => postedAt }
      if (name.includes('socialContext')) return { innerText: '' }
      if (name.includes('analytics')) return { getAttribute: () => '2,000 views', innerText: '2000' }
      if (name.includes('reply')) return { getAttribute: () => '1 Replies', innerText: '1' }
      if (name.includes('like')) return { getAttribute: () => '5 Likes', innerText: '5' }
      if (name.includes('retweet')) return { getAttribute: () => '0 reposts', innerText: '0' }
      if (name.includes('bookmark')) return { getAttribute: () => 'Bookmark', innerText: '' }
      return null
    },
  })
  const articles = ids.map(makeArticle)
  const doc = {
    body: { innerText: '' },
    documentElement: { scrollHeight: 1400, scrollTop: 0 },
    querySelector(selector) { return selector === 'main[role="main"]' ? this : null },
    querySelectorAll(selector) {
      if (selector === 'article[data-testid="tweet"]') return articles.slice(page, page + 1)
      return []
    },
  }
  let clock = now
  let advanced = 0
  const controller = prune.createController({
    document: doc,
    window: {
      innerHeight: 700,
      get scrollY() { return page * 700 },
      scrollBy() { if (page < ids.length - 1) page += 1; doc.documentElement.scrollHeight += 50 },
      scrollTo() { scrollToTop += 1 },
    },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
    onTimelineStalled() { advanced += 1; return '改查 2026年8月' },
  })
  const result = await controller.start({
    unlimited: true,
    searchLabel: '2026年9月 · since:2026-09-01 until:2026-10-01',
  })
  assert.equal(page, ids.length - 1)
  assert.equal(advanced, 1)
  assert.equal(scrollToTop, 0)
  assert.match(result.status, /2026年8月/)
})

test('a failed X search retries without marking the month complete', async () => {
  let retries = 0
  const retry = { innerText: 'Retry', click() { retries += 1 } }
  const doc = {
    innerText: 'Something went wrong. Try reloading.',
    body: { innerText: 'Something went wrong. Try reloading.' },
    documentElement: { scrollHeight: 700 },
    querySelector(selector) { return selector === 'main[role="main"]' ? this : null },
    querySelectorAll(selector) {
      if (selector === 'button, [role="button"]') return [retry]
      return []
    },
  }
  let clock = now
  let advanced = 0
  let controller = null
  let stoppedOnCooldown = false
  controller = prune.createController({
    document: doc, window: { innerHeight: 700 }, accountHandle: () => 'me',
    now: () => clock, sleep: async (ms) => { clock += ms },
    onUpdate(snapshot) {
      if (!stoppedOnCooldown && snapshot.cooldownUntil > clock) {
        stoppedOnCooldown = true
        controller.stop()
      }
    },
  })
  const result = await controller.start({
    unlimited: true,
    searchLabel: '2026年8月 · since:2026-08-01 until:2026-09-01',
    onTimelineStalled() { advanced += 1; return '不应跳月' },
  })
  assert.equal(retries, 3)
  assert.equal(advanced, 0)
  assert.equal(stoppedOnCooldown, true)
  assert.equal(result.running, false)
})

test('search-month prune advances after the visible posts are already skipped', async () => {
  const article = {
    isConnected: true,
    querySelector() { return null },
  }
  const doc = {
    body: { innerText: '', textContent: '' },
    documentElement: { scrollHeight: 1400, scrollTop: 0 },
    querySelector(selector) {
      if (selector === 'main[role="main"]') return this
      return null
    },
    querySelectorAll(selector) {
      if (selector === 'article[data-testid="tweet"]') return [article]
      return []
    },
  }
  doc.scrollingElement = doc.documentElement
  let clock = now
  const stalls = []
  const original = prune.readPostMetrics
  prune.readPostMetrics = () => ({
    id: 'kept-september',
    own: true,
    repost: false,
    pinned: false,
    at: Date.parse('2026-09-12T12:00:00+08:00'),
    views: 2000,
    likes: 5,
    replies: 1,
    reposts: 0,
    quotes: 0,
    bookmarks: 0,
    textOnly: true,
  })
  try {
    const controller = prune.createController({
      document: doc,
      window: {
        scrollY: 0,
        innerHeight: 700,
        scrollBy() {},
        scrollTo() {},
      },
      accountHandle: () => 'me',
      now: () => clock,
      sleep: async (ms) => { clock += ms },
    })
    const result = await controller.start({
      unlimited: true,
      random: () => 0,
      searchLabel: '2026年9月 · since:2026-09-01 until:2026-10-01',
      onTimelineStalled(detail) {
        stalls.push(detail)
        return '不限速 · 已删 0 条 · 这个月刷完了，改查 2026年8月 · since:2026-08-01 until:2026-09-01'
      },
    })
    assert.equal(stalls.length, 1)
    assert.match(result.status, /2026年8月/)
  } finally {
    prune.readPostMetrics = original
  }
})

test('unlimited prune names the search window while deleting', async () => {
  const doc = {
    body: { innerText: '', textContent: '' },
    documentElement: { scrollHeight: 700, scrollTop: 0 },
    querySelector() { return null },
    querySelectorAll() { return [] },
  }
  doc.scrollingElement = doc.documentElement
  let clock = now
  let scrollY = 0
  const seen = []
  const controller = prune.createController({
    document: doc,
    window: {
      get scrollY() { return scrollY },
      innerHeight: 700,
      scrollTo() { scrollY = 0 },
      scrollBy(x, y) {
        const delta = typeof x === 'number' ? x : Number(y) || 0
        const maxTop = Math.max(0, doc.documentElement.scrollHeight - 700)
        scrollY = Math.min(maxTop, Math.max(0, scrollY + delta))
      },
    },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
    onUpdate(snapshot) { seen.push(snapshot.status) },
  })
  const result = await controller.start({
    unlimited: true,
    random: () => 0,
    searchLabel: '2026-07-26 至 2026-08-02',
    onTimelineStalled() { return '不限速 · 已删 0 条 · 这一段没有帖，改查 2026-07-19 至 2026-07-26' },
  })
  assert.ok(seen.some((status) => status.includes('正在删 2026-07-26 至 2026-08-02')))
  assert.match(result.status, /改查 2026-07-19 至 2026-07-26/)
})

test('unlimited prune leaves the profile for an older search when scrolling stops', async () => {
  const doc = {
    body: { innerText: '', textContent: '' },
    documentElement: { scrollHeight: 700, scrollTop: 0 },
    querySelector() { return null },
    querySelectorAll() { return [] },
  }
  doc.scrollingElement = doc.documentElement
  let clock = now
  let scrollY = 0
  const stalls = []
  const controller = prune.createController({
    document: doc,
    window: {
      get scrollY() { return scrollY },
      innerHeight: 700,
      scrollTo() { scrollY = 0 },
      scrollBy(x, y) {
        const delta = typeof x === 'number' ? x : Number(y) || 0
        const maxTop = Math.max(0, doc.documentElement.scrollHeight - 700)
        scrollY = Math.min(maxTop, Math.max(0, scrollY + delta))
      },
    },
    accountHandle: () => 'me',
    now: () => clock,
    sleep: async (ms) => { clock += ms },
  })
  const result = await controller.start({
    unlimited: true,
    random: () => 0,
    onTimelineStalled(detail) {
      stalls.push(detail)
      return true
    },
  })
  assert.equal(stalls.length, 1)
  assert.equal(stalls[0].deleted, 0)
  assert.equal(result.running, false)
  assert.match(result.status, /搜索/)
})

test('cleanup stops at five calendar years and keeps older posts and replies', () => {
  const now = Date.parse('2026-11-15T04:00:00Z')
  const cutoff = Date.parse('2021-11-15T04:00:00Z')
  assert.equal(prune.pruneHistoryCutoff(now), cutoff)
  assert.equal(prune.isPruneRangeWithinHistory('2021-10-01', '2021-11-01', now), false)
  assert.equal(prune.isPruneRangeWithinHistory('2021-11-01', '2021-12-01', now), true)
  assert.equal(prune.nextPruneSearchWindow({ currentSince: '2021-11-01', currentUntil: '2021-12-01', now }), null)
  assert.equal(prune.nextPruneSearchWindow({ currentSince: '2019-01-01', currentUntil: '2019-02-01', now }), null)
  const post = { own: true, at: cutoff, views: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0, quotes: 0 }
  for (const classify of [prune.classifyPost, prune.classifyReply]) {
    assert.equal(classify(post, now), false)
    assert.equal(classify({ ...post, at: cutoff - 1 }, now), false)
    assert.equal(classify({ ...post, at: cutoff + 1 }, now), true)
  }
  assert.equal(prune.pruneHistoryCutoff(Date.parse('2024-02-29T12:00:00Z')), Date.parse('2019-02-28T12:00:00Z'))
})

test('bounded cleanup ignores legacy unlimited and stops after the selected slow segment', async () => {
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
    const result = await controller.start({ pace: 'slow', boundedCleanup: true, unlimited: true, random: () => 0 })
    assert.equal(result.deleted, 15)
    assert.equal(waits.filter((ms) => ms === 15000).length, 0)
    assert.equal(result.running, false)
  } finally {
    if (previousLoop) globalThis.XReplyClipboardLoop = previousLoop
    else delete globalThis.XReplyClipboardLoop
  }
})
