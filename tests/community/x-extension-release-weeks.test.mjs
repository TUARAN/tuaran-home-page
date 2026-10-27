import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  buildXExtensionReleaseWeeks,
  loadXExtensionReleaseWeeks,
  mondayOfShanghaiDate,
  parseXExtensionReleaseEntries,
} from '../../lib/community/xExtensionReleaseWeeks.js'

test('mondayOfShanghaiDate anchors weeks on Monday in Shanghai', () => {
  assert.equal(mondayOfShanghaiDate('2026-10-12'), '2026-10-12')
  assert.equal(mondayOfShanghaiDate('2026-10-14'), '2026-10-12')
  assert.equal(mondayOfShanghaiDate('2026-10-27'), '2026-10-26')
})

test('parseXExtensionReleaseEntries reads dated and undated README lines', () => {
  const markdown = [
    'v3.32.50（2026-10-27，本地开发）精品发帖拆分。未打包。',
    'v3.9.0（2026-10-12，已打包待部署）短行发帖。',
    'v1.0.0 重做页面面板。',
    '普通说明不会被当成版本。',
  ].join('\n')
  const entries = parseXExtensionReleaseEntries(markdown)
  assert.equal(entries.length, 3)
  assert.deepEqual(entries[0], {
    version: 'v3.32.50',
    date: '2026-10-27',
    status: '本地开发',
    body: '精品发帖拆分。未打包。',
  })
  assert.equal(entries[2].date, null)
  assert.equal(entries[2].version, 'v1.0.0')
})

test('buildXExtensionReleaseWeeks numbers weeks from the first dated version', () => {
  const weeks = buildXExtensionReleaseWeeks([
    { version: 'v3.32.50', date: '2026-10-27', status: '本地开发', body: '定时发帖拆普通与精品。' },
    { version: 'v3.32.21', date: '2026-10-26', status: '已打包待部署', body: '评论常驻，其余队列轮换。打包文件 `x.zip`。' },
    { version: 'v3.28.0', date: '2026-10-23', status: '本地测试', body: '全流程详情列出七项任务。' },
    { version: 'v3.9.0', date: '2026-10-12', status: '已打包待部署', body: '短行发帖与设置自动保存。打包文件 `x.zip`。' },
    { version: 'v1.0.0', date: null, status: null, body: '重做页面面板。' },
  ])
  assert.equal(weeks[0].week, 3)
  assert.equal(weeks[0].title, '第 3 周 · 10/26–11/1')
  assert.match(weeks[0].versionRange, /v3\.32\.21/)
  assert.ok(weeks[0].highlights.some((item) => item.version === 'v3.32.21'))
  assert.equal(weeks[1].week, 2)
  assert.equal(weeks[2].week, 1)
  assert.equal(weeks[2].title, '第 1 周 · 10/12–10/18')
  assert.equal(weeks.at(-1).week, 0)
  assert.equal(weeks.at(-1).label, '起步阶段')
})

test('loadXExtensionReleaseWeeks reads the live README changelog', () => {
  const weeks = loadXExtensionReleaseWeeks()
  assert.ok(weeks.length >= 3)
  assert.equal(weeks.at(-1)?.week, 0)
  assert.equal(weeks.find((item) => item.week === 1)?.weekStart, '2026-10-12')
  const docsPage = readFileSync(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8')
  assert.match(docsPage, /loadXExtensionReleaseWeeks/)
  assert.match(docsPage, /周总结/)
  assert.doesNotMatch(docsPage, /const RELEASES = \[/)
})
