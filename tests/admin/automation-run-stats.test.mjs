import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearAutomationRunStatsCache,
  fetchGitHubWorkflowRuns,
  resolveAutomationStats,
  runsFromDailyBriefs,
  runsFromGitHubPayload,
  summarizeAutomationRuns,
} from '../../lib/automationRunStats.js'

test('workflow runs become a timestamp and a counted success rate', () => {
  const summary = summarizeAutomationRuns(runsFromGitHubPayload({
    workflow_runs: [
      { status: 'completed', conclusion: 'skipped', created_at: '2026-09-23T01:08:34Z' },
      { status: 'completed', conclusion: 'success', created_at: '2026-09-23T01:01:11Z' },
      { status: 'completed', conclusion: 'failure', created_at: '2026-09-22T01:01:11Z' },
    ],
  }))

  assert.equal(summary.lastRun, '2026/09/23 09:01 成功')
  assert.equal(summary.successRate, '最近 2 次 1 成功')
})

test('daily briefs count missing days as failed runs', () => {
  const runs = runsFromDailyBriefs([
    { date: '2026-09-23' },
    { date: '2026-09-22' },
    { date: '2026-09-20' },
  ])
  const summary = summarizeAutomationRuns(runs)

  assert.equal(summary.lastRun, '2026/09/23 成功')
  assert.equal(summary.successRate, '最近 10 次 3 成功')
})

test('registry stats prefer live runs over vague placeholders', () => {
  const stats = resolveAutomationStats(
    { lastRun: '待接入状态回写', successRate: '待统计' },
    {
      githubRuns: [
        { at: Date.parse('2026-09-23T00:34:41Z'), conclusion: 'success' },
        { at: Date.parse('2026-09-22T09:13:06Z'), conclusion: 'success' },
      ],
    },
  )

  assert.equal(stats.lastRun, '2026/09/23 08:34 成功')
  assert.equal(stats.successRate, '最近 2 次 2 成功')
  assert.doesNotMatch(stats.lastRun, /待接入|运行记录/)
  assert.doesNotMatch(stats.successRate, /待统计|最近成功/)
})

test('missing history stays explicit instead of a vague phrase', () => {
  const stats = resolveAutomationStats({ lastRun: '每日自动运行（最近结果见运行记录）', successRate: '待统计' })

  assert.equal(stats.lastRun, '尚无运行记录')
  assert.equal(stats.successRate, '尚无记录')
})

test('github workflow fetch uses one request per workflow and caches it', async () => {
  clearAutomationRunStatsCache()
  let calls = 0
  const fetchImpl = async (url) => {
    calls += 1
    assert.match(url, /repos\/TUARAN\/tuaran-home-page\/actions\/workflows\/security-scan\.yml/)
    return {
      ok: true,
      json: async () => ({
        workflow_runs: [{ status: 'completed', conclusion: 'failure', created_at: '2026-09-21T01:42:17Z' }],
      }),
    }
  }
  const workflows = { 'autopilot-security-scan': { repo: 'TUARAN/tuaran-home-page', file: 'security-scan.yml' } }
  const first = await fetchGitHubWorkflowRuns(workflows, { fetchImpl, now: 1_000 })
  const second = await fetchGitHubWorkflowRuns(workflows, { fetchImpl, now: 2_000 })

  assert.equal(calls, 1)
  assert.equal(first['autopilot-security-scan'][0].conclusion, 'failure')
  assert.equal(second['autopilot-security-scan'][0].at, first['autopilot-security-scan'][0].at)
  clearAutomationRunStatsCache()
})
