import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const c = require('../../tools/x-reply-clipboard-extension/workbenchCollector.js')

test('parseCount 支持 K/M/万/亿 与千分位', () => {
  assert.equal(c.parseCount('1,234'), 1234)
  assert.equal(c.parseCount('1.2K'), 1200)
  assert.equal(c.parseCount('3.5万'), 35000)
  assert.equal(c.parseCount('2亿'), 200000000)
  assert.equal(c.parseCount(''), 0)
  assert.equal(c.parseCount('abc'), 0)
})

test('statusFromHref 只认站内推文路径', () => {
  assert.deepEqual(c.statusFromHref('/foo_1/status/1234567890'), { handle: 'foo_1', id: '1234567890' })
  assert.equal(c.statusFromHref('/foo/status/12'), null)
  assert.equal(c.statusFromHref('https://evil.com/foo/status/1234567890'), null)
})

test('isHot：低热度推文不提交', () => {
  assert.equal(c.isHot({ likes: 10, views: 100 }), false)
  assert.equal(c.isHot({ likes: 50, views: 0 }), true)
  assert.equal(c.isHot({ likes: 0, views: 5000 }), true)
})

test('queue：去重、合并取大值、确认后不再入队', () => {
  const q = c.createQueue()
  q.add({ id: '1', likes: 5, reposts: 0, replies: 0, views: 10 })
  q.add({ id: '1', likes: 9, reposts: 0, replies: 0, views: 3 })
  assert.equal(q.size(), 1)
  const [item] = q.take()
  assert.equal(item.likes, 9)
  assert.equal(item.views, 10)
  q.confirm([item])
  assert.equal(q.add({ id: '1', likes: 99, reposts: 0, replies: 0, views: 0 }), false)
  assert.equal(q.size(), 0)
})

test('startAuto：默认关闭不提交；未配对失败后暂停而不重试', async () => {
  let t = 0
  let sends = 0
  const doc = { visibilityState: 'visible', querySelectorAll: () => [] }
  const auto = c.startAuto({ send: async () => { sends++; return { ok: false } }, storage: { get: async () => ({}) }, doc, now: () => t })
  auto.stop()
  auto.queue.add({ id: '9', likes: 99, reposts: 0, replies: 0, views: 0 })
  t += 120000
  await auto.flush()
  assert.equal(sends, 0, '未开启时不发送')
  auto.apply(true)
  await auto.flush()
  assert.equal(sends, 1)
  await auto.flush()
  assert.equal(sends, 1, '失败后进入暂停期')
  assert.equal(auto.queue.size(), 1, '失败的条目保留')
  t += 31 * 60000
  await auto.flush()
  assert.equal(sends, 2)
})

// 合成 DOM 夹具，覆盖 X 常见属性形态；不作为已实机验证的证据。
function tweetFixture({ protectedLabel = '', nestedLikes = false } = {}) {
  const article = { parentElement: { closest: () => null }, closest: () => null }
  const node = (textContent, attrs = {}, owner = article) => ({ textContent, getAttribute: key => attrs[key], closest: () => owner, querySelector: () => null })
  const time = node('', { datetime: '2026-11-22T00:00:00Z' })
  const link = node('', { href: '/alice/status/1234567890' }); link.querySelector = () => time
  const selectors = {
    'a[href*="/status/"]': [link],
    '[data-testid="tweetText"]': [node('公开正文')],
    '[data-testid="User-Name"] span': [node('Alice')],
    '[data-testid="User-Name"] svg[aria-label]': protectedLabel ? [node('', { 'aria-label': protectedLabel })] : [],
    '[data-testid="like"], [data-testid="unlike"]': [...(nestedLikes ? [node('999K', {}, {})] : []), node('1.2K')],
    '[data-testid="retweet"], [data-testid="unretweet"]': [node('25')],
    '[data-testid="reply"]': [node('8')],
    'a[href*="/analytics"]': [node('5万', { href: '/alice/status/1234567890/analytics?ref=home' })]
  }
  article.querySelectorAll = selector => selectors[selector] || []
  article.querySelector = () => null
  return article
}
test('合成 DOM：正文、作者、已点赞/转发指标和带参数 analytics', () => {
  const item = c.extract(tweetFixture({ nestedLikes: true }))
  assert.equal(item.handle, 'alice'); assert.equal(item.text, '公开正文')
  assert.equal(item.displayName, 'Alice'); assert.equal(item.likes, 1200)
  assert.equal(item.reposts, 25); assert.equal(item.replies, 8); assert.equal(item.views, 50000)
})
test('合成 DOM：跳过英文和中文受保护账号图标', () => {
  assert.equal(c.extract(tweetFixture({ protectedLabel: 'Protected account' })), null)
  assert.equal(c.extract(tweetFixture({ protectedLabel: '受保护的账号' })), null)
})
