import assert from 'node:assert/strict'
import test from 'node:test'
import { interleaveRssPicks, normalizeAiHotItems, normalizeRuanYifengEntries } from '../../lib/home/homeRssPicks.mjs'

test('RSS picks keep each feed newest first and alternate sources', () => {
  const aiHot = normalizeAiHotItems([
    { id: 'older', title: 'AI 旧文', publishedAt: '2026-10-25T00:00:00Z', links: { original: 'https://aihot.news/older' } },
    { id: 'newer', title: 'AI 新文', publishedAt: '2026-10-27T00:00:00Z', links: { original: 'https://aihot.news/newer' } },
    { id: 'bad', links: { original: 'javascript:alert(1)' } },
  ])
  const ruan = normalizeRuanYifengEntries([
    { guid: 'older', title: '阮旧文', publishedAt: Date.parse('2026-10-24T00:00:00Z'), link: 'https://www.ruanyifeng.com/older' },
    { guid: 'newer', title: '阮新文', publishedAt: Date.parse('2026-10-26T00:00:00Z'), link: 'https://www.ruanyifeng.com/newer' },
  ])

  assert.deepEqual(interleaveRssPicks(aiHot, ruan).map((entry) => entry.title), [
    'AI 新文', '阮新文', 'AI 旧文', '阮旧文',
  ])
  assert.deepEqual(interleaveRssPicks([], ruan, 1).map((entry) => entry.title), ['阮新文'])
})
