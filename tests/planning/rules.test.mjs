import test from 'node:test'
import assert from 'node:assert/strict'

import {
  classifyPlanningItem,
  eventForTransition,
  validatePlanningPayload,
  wouldCreateDependencyCycle,
} from '../../lib/planning/rules.mjs'

const NOW = Date.UTC(2026, 6, 20)

test('classifies completed work as past', () => {
  assert.equal(classifyPlanningItem({ status: 'done', completedAt: NOW - 1 }, NOW, 'month'), 'past')
})

test('keeps blocked, overdue, and current-window work in present', () => {
  assert.equal(classifyPlanningItem({ status: 'blocked', targetAt: NOW + 1000 }, NOW, 'week'), 'present')
  assert.equal(classifyPlanningItem({ status: 'planned', targetAt: NOW - 1000 }, NOW, 'week'), 'present')
  assert.equal(classifyPlanningItem({ status: 'planned', targetAt: NOW + 86400000 }, NOW, 'week'), 'present')
})

test('classifies planned work beyond the active window and unscheduled work as future', () => {
  assert.equal(classifyPlanningItem({ status: 'planned', targetAt: NOW + 40 * 86400000 }, NOW, 'week'), 'future')
  assert.equal(classifyPlanningItem({ status: 'planned', targetAt: null }, NOW, 'week'), 'future')
})

test('rejects a task without a milestone and reversed dates', () => {
  assert.equal(validatePlanningPayload('task', { title: 'Ship', milestoneId: '' }).error, 'MILESTONE_REQUIRED')
  assert.equal(
    validatePlanningPayload('milestone', { title: 'V1', projectId: 'p', directionId: 'd', startAt: 20, targetAt: 10 }).error,
    'TARGET_BEFORE_START',
  )
})

test('maps status transitions to append-only events', () => {
  assert.deepEqual(
    eventForTransition('task', { id: 't1', title: 'Ship', status: 'doing' }, { id: 't1', title: 'Ship', status: 'done' }, NOW),
    { entityType: 'task', entityId: 't1', eventType: 'completed', title: '完成任务：Ship', occurredAt: NOW },
  )
})

test('detects dependency cycles', () => {
  const edges = [{ fromType: 'task', fromId: 'a', toType: 'task', toId: 'b' }]
  assert.equal(wouldCreateDependencyCycle(edges, { fromType: 'task', fromId: 'b', toType: 'task', toId: 'a' }), true)
})
