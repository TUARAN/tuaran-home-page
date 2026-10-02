import assert from 'node:assert/strict'
import test from 'node:test'

import {
  X_CONTROVERSY_SLOTS,
  X_CONTROVERSY_STRUCTURES,
  buildXControversyMessages,
  normalizeXControversySlot,
  normalizeXControversyText,
  parseBaiduHotBoard,
  parseXControversyFeed,
  xControversyLastRunKey,
  xControversyWithinTarget,
} from '../lib/xControversyPosts.js'

test('controversy slots cover every Shanghai hour with unique run keys', () => {
  const slots = Object.values(X_CONTROVERSY_SLOTS)
  assert.equal(slots.length, 24)
  assert.deepEqual(slots.map((slot) => slot.time), Array.from(
    { length: 24 },
    (_, hour) => `${String(hour).padStart(2, '0')}:00`,
  ))
  assert.equal(normalizeXControversySlot('controversy_09'), 'controversy_09')
  assert.equal(normalizeXControversySlot('controversy_24'), '')
  assert.equal(new Set(slots.map((slot) => xControversyLastRunKey(slot.id))).size, 24)
})

test('topic prompts rotate through a broad set of writing structures', () => {
  assert.equal(X_CONTROVERSY_STRUCTURES.length, 14)
  assert.equal(new Set(X_CONTROVERSY_STRUCTURES.map((item) => item.id)).size, 14)
  assert.ok(X_CONTROVERSY_STRUCTURES.some((item) => item.id === 'curious-hook' && item.guide.includes('不懂就问：')))
  assert.ok(X_CONTROVERSY_STRUCTURES.some((item) => item.id === 'hot-take-hook' && item.guide.includes('说个暴论：')))

  const labels = new Set(Array.from({ length: 24 }, (_, hour) => {
    const messages = buildXControversyMessages({
      slot: `controversy_${String(hour).padStart(2, '0')}`,
      now: new Date('2026-09-30T00:00:00.000Z'),
    })
    return messages[1].content.match(/本次必须采用的结构：([^。]+)/)?.[1]
  }))
  assert.equal(labels.size, 14)
})

test('Baidu board parser keeps ranked public hot-search words and heat', () => {
  const now = new Date('2026-09-27T12:00:00.000Z')
  const html = '<script>window.data={"cards":[{"hotScore":"7904640","word":"贷款中介集体删除朋友圈"},{"hotScore":"7800000","word":"年轻人重新讨论租房"}]}</script>'
  assert.deepEqual(parseBaiduHotBoard(html, { now }), [
    { title: '贷款中介集体删除朋友圈', source: '百度热搜', publishedAt: now.getTime(), heat: 7904640 },
    { title: '年轻人重新讨论租房', source: '百度热搜', publishedAt: now.getTime(), heat: 7800000 },
  ])
})

test('news feed parser keeps recent headlines and drops stale entries', () => {
  const now = new Date('2026-09-27T12:00:00.000Z')
  const xml = `<?xml version="1.0"?><rss><channel>
    <item><title><![CDATA[房贷利率调整引发讨论 - 示例媒体]]></title><source>示例媒体</source><pubDate>Sun, 27 Sep 2026 10:30:00 GMT</pubDate></item>
    <item><title>过期新闻</title><source>旧媒体</source><pubDate>Sat, 26 Sep 2026 10:30:00 GMT</pubDate></item>
  </channel></rss>`
  assert.deepEqual(parseXControversyFeed(xml, { now }), [{
    title: '房贷利率调整引发讨论',
    source: '示例媒体',
    publishedAt: Date.parse('2026-09-27T10:30:00.000Z'),
  }])
})

test('prompt demands direct conflict without meta labels, fabricated details, or harassment', () => {
  const messages = buildXControversyMessages({
    slot: 'controversy_12',
    now: new Date('2026-09-27T04:00:00.000Z'),
    signals: [{ title: '多地讨论住房消费新变化', source: '公开媒体', publishedAt: Date.now() }],
  })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /俏皮、克制/)
  assert.match(messages[0].content, /第一句必须是钩子/)
  assert.match(messages[0].content, /具体冲突、反常识判断、信息缺口/)
  assert.match(messages[0].content, /不懂就问.*说个暴论/)
  assert.match(messages[0].content, /禁止出现这些套话/)
  assert.match(messages[0].content, /近期文案既是事实去重清单，也是结构去重清单/)
  assert.match(messages[0].content, /不得造谣/)
  assert.match(messages[0].content, /不使用地域、性别、年龄、职业等群体羞辱/)
  assert.match(messages[0].content, /约 55—100 个汉字/)
  assert.match(messages[1].content, /本次必须采用的结构/)
  assert.match(messages[1].content, /多地讨论住房消费新变化/)
})

test('normalizer enforces plain short text with line breaks', () => {
  const text = normalizeXControversyText(`最终文案：\n老板说公司是家。\n\n员工问能不能分房。\n\nhttps://example.com #职场`)
  assert.equal(text, '老板说公司是家。\n\n员工问能不能分房。')
  assert.equal(xControversyWithinTarget(text), true)
  const shortened = normalizeXControversyText('房价终于讲理了。\n'.repeat(80))
  assert.equal(xControversyWithinTarget(shortened), true)
  assert.match(shortened, /。$/)
  assert.doesNotMatch(shortened, /…。$/)
})

test('normalizer removes meta-writing openers before publishing', () => {
  const text = normalizeXControversyText(`【小剧场】：\n先说结论：有事就直说。\n\n讲个故事：老板说公司是家。\n员工问：那能分房吗？`)
  assert.equal(text, '老板说公司是家。\n员工问：那能分房吗？')
  assert.doesNotMatch(text, /小剧场|先说结论|有事就直说|讲个故事/)
})
