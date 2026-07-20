import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  rowToEvent,
  rowToMilestone,
  rowToPortfolioProject,
  rowToTask,
  updateProjectProfile,
  upsertProjectProfile,
} from '../../lib/planning/repository.mjs'

test('keeps portfolio catalog rows compatible with the existing admin read model', () => {
  const base = {
    id: 'site', name: 'Site', pillar: 'blog', action: 'keep', role: 'Home', path: '/site',
    next_step: 'Ship', links: '{}', pos_x: null, pos_y: null, revenue_monthly: 1,
    hours_monthly: 2, biz_status: 'earning', sort_order: 3, updated_at: 4,
  }

  assert.deepEqual(rowToPortfolioProject(base), {
    id: 'site', name: 'Site', pillar: 'blog', action: 'keep', role: 'Home', path: '/site',
    next: 'Ship', links: [], position: null, revenueMonthly: 1, hoursMonthly: 2,
    bizStatus: 'earning', updatedAt: 4,
  })
  assert.deepEqual(rowToPortfolioProject({ ...base, links: '["agent"]', pos_x: 5, pos_y: 6 }).position, [5, 6])
})

test('maps a milestone row to the stable camelCase shape', () => {
  const result = rowToMilestone({
    id: 'milestone:launch',
    direction_id: 'direction:blog',
    project_id: 'tuaran-home-page',
    title: 'Launch',
    description: 'Ship it',
    success_criteria: 'It is live',
    status: 'active',
    priority: 2,
    start_at: null,
    target_at: 1770000000000,
    completed_at: null,
    source_key: null,
    sort_order: 4,
    archived_at: 1780000000000,
    created_at: 1760000000000,
    updated_at: 1765000000000,
  })

  assert.deepEqual(result, {
    id: 'milestone:launch',
    directionId: 'direction:blog',
    projectId: 'tuaran-home-page',
    title: 'Launch',
    description: 'Ship it',
    successCriteria: 'It is live',
    status: 'active',
    priority: 2,
    startAt: null,
    targetAt: 1770000000000,
    completedAt: null,
    sourceKey: null,
    sortOrder: 4,
    archivedAt: 1780000000000,
    createdAt: 1760000000000,
    updatedAt: 1765000000000,
  })
})

test('maps a task row to the exact stable camelCase shape', () => {
  const result = rowToTask({
    id: 'task:release',
    milestone_id: 'milestone:launch',
    title: 'Release',
    description: 'Deploy production',
    status: 'doing',
    priority: 3,
    assignee: 'owner',
    planned_at: null,
    start_at: 1760000000000,
    target_at: null,
    completed_at: null,
    note: 'Watch metrics',
    blocked_reason: '',
    sort_order: 8,
    archived_at: 1780000000000,
    created_at: 1750000000000,
    updated_at: 1770000000000,
  })

  assert.deepEqual(Object.keys(result), [
    'id', 'milestoneId', 'title', 'description', 'status', 'priority', 'assignee',
    'plannedAt', 'startAt', 'targetAt', 'completedAt', 'note', 'blockedReason',
    'sortOrder', 'archivedAt', 'createdAt', 'updatedAt',
  ])
  assert.deepEqual(result, {
    id: 'task:release',
    milestoneId: 'milestone:launch',
    title: 'Release',
    description: 'Deploy production',
    status: 'doing',
    priority: 3,
    assignee: 'owner',
    plannedAt: null,
    startAt: 1760000000000,
    targetAt: null,
    completedAt: null,
    note: 'Watch metrics',
    blockedReason: '',
    sortOrder: 8,
    archivedAt: 1780000000000,
    createdAt: 1750000000000,
    updatedAt: 1770000000000,
  })
})

test('maps event details JSON and falls back for malformed JSON', () => {
  const row = {
    id: 'event:launch',
    entity_type: 'milestone',
    entity_id: 'milestone:launch',
    event_type: 'note',
    title: 'Launch note',
    description: '',
    details_json: '{"risk":"low"}',
    source: 'manual',
    source_key: null,
    occurred_at: 1770000000000,
    created_at: 1770000000001,
  }

  assert.deepEqual(rowToEvent(row), {
    id: 'event:launch',
    entityType: 'milestone',
    entityId: 'milestone:launch',
    eventType: 'note',
    title: 'Launch note',
    description: '',
    details: { risk: 'low' },
    source: 'manual',
    sourceKey: null,
    occurredAt: 1770000000000,
    createdAt: 1770000000001,
  })
  assert.deepEqual(rowToEvent({ ...row, details_json: '{bad json' }).details, {})
})

test('migration includes the repository-required V1 fields', async () => {
  const migration = await readFile(new URL('../../migrations/0053_planning_center.sql', import.meta.url), 'utf8')

  assert.match(migration, /planning_directions[\s\S]*north_star TEXT NOT NULL DEFAULT ''[\s\S]*sort_order INTEGER NOT NULL DEFAULT 0/)
  assert.match(migration, /planning_project_profiles[\s\S]*planning_status TEXT NOT NULL DEFAULT 'active'[\s\S]*is_focus INTEGER NOT NULL DEFAULT 0[\s\S]*sort_order INTEGER NOT NULL DEFAULT 0/)
  assert.match(migration, /planning_milestones[\s\S]*success_criteria TEXT NOT NULL DEFAULT ''[\s\S]*source_key TEXT UNIQUE[\s\S]*sort_order INTEGER NOT NULL DEFAULT 0/)
  assert.match(migration, /planning_tasks[\s\S]*assignee TEXT NOT NULL DEFAULT ''[\s\S]*planned_at INTEGER[\s\S]*note TEXT NOT NULL DEFAULT ''[\s\S]*blocked_reason TEXT NOT NULL DEFAULT ''[\s\S]*sort_order INTEGER NOT NULL DEFAULT 0/)
  assert.match(migration, /planning_events[\s\S]*description TEXT NOT NULL DEFAULT ''[\s\S]*details_json TEXT NOT NULL DEFAULT '\{\}'[\s\S]*source TEXT NOT NULL DEFAULT 'manual'[\s\S]*source_key TEXT UNIQUE/)
  assert.match(migration, /planning_decisions[\s\S]*rationale TEXT NOT NULL DEFAULT ''[\s\S]*impact TEXT NOT NULL DEFAULT ''/)
  assert.match(migration, /planning_dependencies[\s\S]*dependency_type TEXT NOT NULL DEFAULT 'depends_on'[\s\S]*description TEXT NOT NULL DEFAULT ''[\s\S]*status TEXT NOT NULL DEFAULT 'active'[\s\S]*archived_at INTEGER[\s\S]*updated_at INTEGER NOT NULL/)
})

test('rejects invalid project-profile status and date ranges before writing', async () => {
  const db = { prepare: () => { throw new Error('database write should not run') } }
  const base = { projectId: 'tuaran-home-page', directionId: 'direction:blog' }

  assert.deepEqual(await upsertProjectProfile(db, { ...base, planningStatus: 'invalid' }), {
    ok: false,
    error: 'INVALID_STATUS',
  })
  assert.deepEqual(await upsertProjectProfile(db, { ...base, startAt: 20, targetAt: 10 }), {
    ok: false,
    error: 'TARGET_BEFORE_START',
  })

  const existingDb = {
    prepare(sql) {
      return {
        bind() { return this },
        first() {
          assert.match(sql, /^SELECT/)
          return {
            id: 'profile:test', project_id: base.projectId, direction_id: base.directionId,
            summary: '', planning_status: 'active', is_focus: 0, start_at: 1, target_at: 30,
            sort_order: 0, archived_at: null, created_at: 1, updated_at: 1,
          }
        },
        run() { throw new Error('database write should not run') },
      }
    },
  }
  assert.deepEqual(await updateProjectProfile(existingDb, 'profile:test', { startAt: 40 }), {
    ok: false,
    error: 'TARGET_BEFORE_START',
  })
})
