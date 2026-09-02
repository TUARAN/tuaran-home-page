import assert from 'node:assert/strict'
import test from 'node:test'

import {
  groupCommitsByIsoWeek,
  prependChangelogEntry,
  replaceLatestChangelogEntry,
  upsertPeriodSummary,
  validateGeneratedSummary,
} from '../../lib/changelogAutomationCore.mjs'

const ENTRY = {
  version: '2026-W36',
  week: '2026-W36',
  range: '2026-09-02',
  commits: 2,
  lastCommit: 'a'.repeat(40),
  title: '自动更新日志测试标题',
  summary: '这是一段长度足够的自动更新日志测试摘要，用来验证源码写入后仍然保持有效的 JavaScript 数据结构。',
  planned: ['继续验证自动化任务的稳定运行情况。', '检查生成内容与提交历史是否一致。'],
  done: ['读取新增提交并完成分组。', '调用共享模型生成结构化摘要。', '写入周、月、季度和年度更新。'],
}

const PERIOD = {
  title: '自动化阶段摘要测试标题',
  summary: '这是一段长度足够的阶段摘要，用来验证月度、季度和年度对象能够被安全替换或插入。',
  highlights: ['完成第一项可验证变化。', '完成第二项可验证变化。', '完成第三项可验证变化。'],
  signal: '后续继续观察自动生成质量和任务运行稳定性。',
}

test('commits are grouped by ISO week in chronological order', () => {
  const groups = groupCommitsByIsoWeek([
    { date: '2026-09-02', sha: 'a', subject: 'one' },
    { date: '2026-09-05', sha: 'b', subject: 'two' },
    { date: '2026-09-07', sha: 'c', subject: 'three' },
  ])
  assert.deepEqual(groups.map((group) => [group.week, group.commits.length]), [
    ['2026-W36', 2],
    ['2026-W37', 1],
  ])
})

test('latest changelog entry can be replaced or prepended without touching exports', () => {
  const source = "export const CHANGELOG = [\n  { version: 'old', done: ['}'] },\n]\nexport const LATEST = CHANGELOG[0]\n"
  const replaced = replaceLatestChangelogEntry(source, ENTRY)
  assert.match(replaced, /version: '2026-W36'/)
  assert.doesNotMatch(replaced, /version: 'old'/)
  assert.match(replaced, /export const LATEST/)

  const prepended = prependChangelogEntry(source, ENTRY)
  assert.ok(prepended.indexOf("version: '2026-W36'") < prepended.indexOf("version: 'old'"))
})

test('period summaries are updated and newly inserted by key', () => {
  const source = "const MONTH_SUMMARIES = {\n  '2026-08': { title: 'old' },\n}\nconst QUARTER_SUMMARIES = {}\n"
  const replaced = upsertPeriodSummary(source, 'MONTH_SUMMARIES', '2026-08', PERIOD)
  assert.match(replaced, /自动化阶段摘要测试标题/)
  assert.doesNotMatch(replaced, /title: 'old'/)

  const inserted = upsertPeriodSummary(source, 'MONTH_SUMMARIES', '2026-09', PERIOD)
  assert.match(inserted, /'2026-09':/)
  assert.match(inserted, /'2026-08':/)
})

test('generated DeepSeek JSON must contain complete weekly and period summaries', () => {
  const generated = validateGeneratedSummary({
    entry: ENTRY,
    periods: { month: PERIOD, quarter: PERIOD, year: PERIOD },
  })
  assert.equal(generated.entry.done.length, 3)
  assert.throws(() => validateGeneratedSummary({ entry: {}, periods: {} }), /entry.title/)
})
