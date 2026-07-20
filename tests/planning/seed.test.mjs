import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlanningImportPreview } from '../../lib/planning/seed.mjs'

const projects = [
  { id: 'site', name: 'Site', pillar: 'blog', next: 'Ship planning' },
  { id: 'agent', name: 'Agent', pillar: 'agent', next: '' },
]
const changelog = [{ version: 'v1', title: 'First release', summary: 'Done', done: ['A'], planned: ['B'], range: '2026-07-01' }]

test('builds directions, references, pending milestones, and one event per changelog entry', () => {
  const preview = buildPlanningImportPreview(projects, changelog)
  assert.deepEqual(preview.counts, { directions: 2, profiles: 2, milestones: 1, events: 1 })
  assert.equal(preview.milestones[0].sourceKey, 'portfolio-next:site')
  assert.equal(preview.events[0].sourceKey, 'changelog:v1')
  assert.deepEqual(preview.events[0].details.done, ['A'])
})

test('returns stable ids and keys for repeated previews', () => {
  assert.deepEqual(buildPlanningImportPreview(projects, changelog), buildPlanningImportPreview(projects, changelog))
})

test('does not create a milestone for a whitespace-only next step', () => {
  const preview = buildPlanningImportPreview([{ id: 'site', name: 'Site', pillar: 'blog', next: '   ' }], [])

  assert.deepEqual(preview.milestones, [])
})

test('uses legacy changelog items as completed event details', () => {
  const preview = buildPlanningImportPreview([], [{ version: 'v0', title: 'Legacy release', items: ['A'], range: '2026-01-01' }])

  assert.deepEqual(preview.events[0].details.done, ['A'])
})
