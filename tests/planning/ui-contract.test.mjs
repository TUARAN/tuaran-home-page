import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function loadPlanningUi() {
  const source = await readFile(new URL('../../app/(admin)/admin/planning/planningUi.js', import.meta.url), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const planningCenterSource = await readFile(new URL('../../app/(admin)/admin/planning/PlanningCenter.jsx', import.meta.url), 'utf8')

test('planning UI publishes the integrated todo and planning views and labels every planning status', async () => {
  const { PLANNING_STATUS_META, PLANNING_TABS } = await loadPlanningUi()

  assert.deepEqual(PLANNING_TABS.map((tab) => tab.id), ['todo', 'overview', 'roadmap', 'tree', 'history', 'dispatch'])
  for (const status of ['planned', 'active', 'paused', 'completed', 'archived', 'blocked', 'cancelled', 'doing', 'done', 'open', 'decided', 'superseded']) {
    assert.equal(typeof PLANNING_STATUS_META[status]?.label, 'string')
    assert.equal(typeof PLANNING_STATUS_META[status]?.tone, 'string')
  }
})

test('planning UI formats missing dates and sends safe request errors', async () => {
  const { formatPlanningDate, planningRequest } = await loadPlanningUi()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'INVALID_WINDOW' }), { status: 400 })

  try {
    assert.equal(formatPlanningDate(null), '—')
    await assert.rejects(
      () => planningRequest('/api/admin/planning?window=invalid'),
      (error) => error.code === 'INVALID_WINDOW',
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('planning shell mounts every tab panel and hides inactive panels', () => {
  assert.match(
    planningCenterSource,
    /\{PLANNING_TABS\.map\(\(tab\) => \(\s*<div\s+id=\{`planning-panel-\$\{tab\.id\}`\}\s+role="tabpanel"/s,
  )
  assert.match(planningCenterSource, /aria-labelledby=\{`planning-tab-\$\{tab\.id\}`\}/)
  assert.match(planningCenterSource, /hidden=\{activeTab !== tab\.id\}/)
})

test('planning import requires preview and explicit confirmation before apply', async () => {
  const [panelSource, verifierSource] = await Promise.all([
    readFile(new URL('../../app/(admin)/admin/planning/PlanningImportPanel.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/verify-admin-pages-build.cjs', import.meta.url), 'utf8'),
  ])

  assert.match(panelSource, /planningRequest\('\/api\/admin\/planning\/import'/)
  assert.match(panelSource, /method: 'POST'/)
  assert.match(panelSource, /JSON\.stringify\(\{ confirm: true \}\)/)
  assert.match(panelSource, /我知道重复来源会跳过，已有规划不会被覆盖/)
  assert.match(panelSource, /确认导入为规划初始数据/)
  assert.match(panelSource, /preview\.milestones[\s\S]*slice\(0, 5\)/)
  assert.match(panelSource, /preview\.events[\s\S]*slice\(0, 5\)/)
  assert.match(panelSource, /existingSourceKeyCounts/)
  assert.match(planningCenterSource, /<PlanningImportPanel/)
  assert.match(planningCenterSource, /onApplied=\{reload\}/)
  for (const route of ['/admin/planning', '/api/admin/planning', '/api/admin/planning/import']) {
    assert.match(verifierSource, new RegExp(`['"]${route}['"]`))
  }
})
