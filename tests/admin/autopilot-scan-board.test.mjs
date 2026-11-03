import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { AUTOMATION_REGISTRY } from '../../lib/admin/adminOpsRegistry.js'
import { ADMIN_NAV_GROUPS, resolveAdminTrail } from '../../lib/admin/adminRoutes.js'
import {
  AUTOPILOT_CLOSED_ISSUES,
  AUTOPILOT_OPEN_ISSUES,
  AUTOPILOT_PERFORMANCE_FINDINGS,
  AUTOPILOT_SCAN_PLAN,
  AUTOPILOT_SECURITY_FINDINGS,
  autopilotScanBoardProblems,
  sortAutopilotFindings,
  summarizeAutopilotScanBoard,
} from '../../lib/admin/autopilotScanBoard.js'

test('巡检看板快照与 #69/#68 的分桶一致', () => {
  assert.deepEqual(autopilotScanBoardProblems(), [])
  const summary = summarizeAutopilotScanBoard()
  assert.equal(summary.openTotal, 2)
  assert.equal(summary.closed, 21)
  assert.deepEqual(AUTOPILOT_OPEN_ISSUES.map((item) => item.number), [69, 68])
  assert.equal(AUTOPILOT_CLOSED_ISSUES.length, 21)
  assert.ok(AUTOPILOT_CLOSED_ISSUES.every((item) => item.state === 'closed'))
  assert.equal(summary.latestSecurity.date, '2026-11-02')
  assert.equal(summary.latestPerformance.date, '2026-10-28')
  assert.equal(AUTOPILOT_SECURITY_FINDINGS.length, 29)
  assert.equal(AUTOPILOT_PERFORMANCE_FINDINGS.length, 15)
  assert.ok(AUTOPILOT_SCAN_PLAN.some((item) => item.includes('npm audit fix')))
  assert.ok(AUTOPILOT_SCAN_PLAN.some((item) => item.includes('HSTS')))
  assert.ok(AUTOPILOT_SCAN_PLAN.some((item) => item.includes('nanoBananaCases.js')))
})

test('发现表把可做项排在搁置和卫生项前面', () => {
  const ordered = sortAutopilotFindings([
    ...AUTOPILOT_PERFORMANCE_FINDINGS,
    ...AUTOPILOT_SECURITY_FINDINGS,
  ]).map((item) => item.bucket)
  const ranks = { safe: 0, defer: 1, hygiene: 2 }
  for (let index = 1; index < ordered.length; index += 1) {
    assert.ok(ranks[ordered[index]] >= ranks[ordered[index - 1]])
  }
  assert.equal(ordered[0], 'safe')
  assert.equal(ordered.at(-1), 'hygiene')
})

test('巡检看板挂在工程运行导航，并回到自动化台账', async () => {
  assert.deepEqual(resolveAdminTrail('/admin/autopilot-scans').map((item) => item.label), ['工程与运维', '巡检看板'])
  const engineering = ADMIN_NAV_GROUPS.flatMap((group) => group.items).find((item) => item.href === '/admin/projects')
  assert.ok(engineering.activePaths.includes('/admin/autopilot-scans'))
  const reviews = engineering.sections.find((section) => section.id === 'reviews')
  assert.ok(reviews.items.some((item) => item.href === '/admin/autopilot-scans' && item.label === '巡检看板'))

  for (const id of ['autopilot-security-scan', 'autopilot-perf-scan', 'autopilot-design-scan']) {
    const entry = AUTOMATION_REGISTRY.find((item) => item.id === id)
    assert.equal(entry.adminHref, '/admin/autopilot-scans')
  }

  const [pageSource, runbook] = await Promise.all([
    readFile(new URL('../../app/(admin)/admin/autopilot-scans/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../docs/runbooks/site-autopilot.md', import.meta.url), 'utf8'),
  ])
  assert.match(pageSource, /<AdminPageGate/)
  assert.match(pageSource, /<AdminPage/)
  assert.match(pageSource, /<Section/)
  assert.match(pageSource, /<StatCard/)
  assert.match(pageSource, /latestSecurity\.number/)
  assert.match(pageSource, /latestPerformance\.url/)
  assert.match(pageSource, /已关闭/)
  assert.doesNotMatch(pageSource, /已由最新单覆盖/)
  assert.doesNotMatch(runbook, /已由最新单覆盖/)
  assert.doesNotMatch(pageSource, /runtime = 'edge'/)
  assert.match(runbook, /\/admin\/autopilot-scans/)
  assert.match(runbook, /lib\/admin\/autopilotScanBoard\.js/)
})
