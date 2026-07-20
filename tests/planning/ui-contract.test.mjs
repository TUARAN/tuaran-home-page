import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function loadPlanningUi() {
  const source = await readFile(new URL('../../app/(admin)/admin/planning/planningUi.js', import.meta.url), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

test('planning UI publishes the four views and labels every planning status', async () => {
  const { PLANNING_STATUS_META, PLANNING_TABS } = await loadPlanningUi()

  assert.deepEqual(PLANNING_TABS.map((tab) => tab.id), ['overview', 'roadmap', 'tree', 'history'])
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
