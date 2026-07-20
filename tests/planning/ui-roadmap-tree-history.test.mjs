import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function loadPlanningUi() {
  const source = await readFile(new URL('../../app/(admin)/admin/planning/planningUi.js', import.meta.url), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const DAY = 86400000
const NOW = new Date(2026, 6, 20, 12).getTime()

test('roadmap groups cross-project milestones and reports risky upstream dependencies', async () => {
  const { buildRoadmapModel } = await loadPlanningUi()
  const snapshot = {
    generatedAt: NOW,
    projects: [
      { id: 'profile:a', projectId: 'project:a', directionId: 'direction:a', name: 'Project A' },
      { id: 'profile:b', projectId: 'project:b', directionId: 'direction:a', name: 'Project B' },
    ],
    milestones: [
      { id: 'milestone:done', projectId: 'project:a', status: 'completed', targetAt: NOW - DAY },
      { id: 'milestone:dependent', projectId: 'project:a', status: 'planned', targetAt: NOW + DAY },
      { id: 'milestone:upstream', projectId: 'project:b', status: 'blocked', targetAt: NOW + DAY },
      { id: 'milestone:later', projectId: 'project:b', status: 'planned', targetAt: new Date(2027, 0, 1).getTime() },
      { id: 'milestone:unscheduled', projectId: 'project:b', status: 'planned', targetAt: null },
    ],
    tasks: [],
    dependencies: [{
      id: 'dependency:1', fromType: 'milestone', fromId: 'milestone:dependent',
      toType: 'milestone', toId: 'milestone:upstream', status: 'active',
    }],
  }

  const model = buildRoadmapModel(snapshot)
  const projectA = model.rows.find((row) => row.projectId === 'project:a')
  const projectB = model.rows.find((row) => row.projectId === 'project:b')

  assert.deepEqual(projectA.columns.past.map((item) => item.id), ['milestone:done'])
  assert.deepEqual(projectA.columns.current.map((item) => item.id), ['milestone:dependent'])
  assert.equal(projectA.activeDependencyCount, 1)
  assert.equal(projectA.hasUpstreamRisk, true)
  assert.deepEqual(projectB.columns.future.map((item) => item.id), ['milestone:later'])
  assert.deepEqual(projectB.columns.unscheduled.map((item) => item.id), ['milestone:unscheduled'])
})

test('planning tree preserves the direction-project-milestone-task hierarchy and hides archives by default', async () => {
  const { buildPlanningTree } = await loadPlanningUi()
  const snapshot = {
    directions: [{ id: 'direction:a', title: 'Direction A', status: 'active' }],
    projects: [{ id: 'profile:a', projectId: 'project:a', directionId: 'direction:a', name: 'Project A', planningStatus: 'active' }],
    milestones: [
      { id: 'milestone:a', directionId: 'direction:a', projectId: 'project:a', title: 'Milestone A', status: 'active' },
    ],
    tasks: [
      { id: 'task:a', milestoneId: 'milestone:a', title: 'Task A', status: 'doing' },
    ],
    hierarchy: {
      directions: [
        { id: 'direction:a', title: 'Direction A', status: 'active' },
        { id: 'direction:archived', title: 'Old direction', status: 'archived', archivedAt: NOW },
      ],
      projects: [
        { id: 'profile:a', projectId: 'project:a', directionId: 'direction:a', name: 'Project A', planningStatus: 'active' },
        { id: 'profile:old', projectId: 'project:old', directionId: 'direction:a', name: 'Old project', planningStatus: 'archived', archivedAt: NOW },
        { id: 'profile:under-archived', projectId: 'project:under-archived', directionId: 'direction:archived', name: 'Inherited archive', planningStatus: 'active' },
      ],
      milestones: [{ id: 'milestone:a', directionId: 'direction:a', projectId: 'project:a', title: 'Milestone A', status: 'active' }],
      tasks: [{ id: 'task:a', milestoneId: 'milestone:a', title: 'Task A', status: 'doing' }],
    },
  }

  const visible = buildPlanningTree(snapshot)
  assert.equal(visible.length, 1)
  assert.equal(visible[0].children.length, 1)
  assert.equal(visible[0].children[0].children[0].children[0].id, 'task:a')
  assert.equal(visible[0].children[0].entityType, 'project-profile')

  const withArchives = buildPlanningTree(snapshot, { showArchived: true })
  assert.equal(withArchives.length, 2)
  assert.equal(withArchives[0].children.length, 2)
  assert.equal(withArchives[1].children[0].effectivelyArchived, true)
})

test('history merges copies in descending order and filters task events through ancestry', async () => {
  const { buildPlanningHistory } = await loadPlanningUi()
  const events = [
    { id: 'event:a', entityType: 'task', entityId: 'task:a', eventType: 'blocked', title: 'Blocked', occurredAt: NOW - DAY },
    { id: 'event:b', entityType: 'milestone', entityId: 'milestone:b', eventType: 'completed', title: 'Done B', occurredAt: NOW - 3 * DAY },
  ]
  const decisions = [
    { id: 'decision:a', directionId: 'direction:a', projectId: 'project:a', title: 'Choose A', status: 'decided', decidedAt: NOW },
  ]
  const snapshot = {
    directions: [{ id: 'direction:a' }, { id: 'direction:b' }],
    projects: [
      { id: 'profile:a', projectId: 'project:a', directionId: 'direction:a', name: 'Project A' },
      { id: 'profile:b', projectId: 'project:b', directionId: 'direction:b', name: 'Project B' },
    ],
    milestones: [
      { id: 'milestone:a', directionId: 'direction:a', projectId: 'project:a' },
      { id: 'milestone:b', directionId: 'direction:b', projectId: 'project:b' },
    ],
    tasks: [{ id: 'task:a', milestoneId: 'milestone:a' }],
    events,
    decisions,
  }

  const beforeEvents = structuredClone(events)
  const beforeDecisions = structuredClone(decisions)
  const all = buildPlanningHistory(snapshot)
  assert.deepEqual(all.map((item) => item.id), ['decision:a', 'event:a', 'event:b'])
  assert.deepEqual(events, beforeEvents)
  assert.deepEqual(decisions, beforeDecisions)

  const filtered = buildPlanningHistory(snapshot, { directionId: 'direction:a', projectId: 'project:a', type: 'blocked' })
  assert.deepEqual(filtered.map((item) => item.id), ['event:a'])
  assert.equal(filtered[0].projectName, 'Project A')
})

test('history resolves archived task events through the full hierarchy lookup', async () => {
  const { buildPlanningHistory, buildPlanningHistoryFilterOptions } = await loadPlanningUi()
  const snapshot = {
    directions: [], projects: [], milestones: [], tasks: [], decisions: [],
    hierarchy: {
      directions: [{ id: 'direction:a', title: 'Direction A', status: 'archived' }],
      projects: [{ id: 'profile:a', projectId: 'project:a', directionId: 'direction:a', name: 'Project A', planningStatus: 'archived' }],
      milestones: [{ id: 'milestone:a', projectId: 'project:a', directionId: 'direction:a', status: 'archived' }],
      tasks: [{ id: 'task:a', milestoneId: 'milestone:a', status: 'archived' }],
    },
    events: [{ id: 'event:a', entityType: 'task', entityId: 'task:a', eventType: 'completed', occurredAt: NOW }],
  }

  const result = buildPlanningHistory(snapshot, { directionId: 'direction:a', projectId: 'project:a' })
  assert.deepEqual(result.map((item) => item.id), ['event:a'])
  assert.equal(result[0].projectName, 'Project A')
  const options = buildPlanningHistoryFilterOptions(snapshot)
  assert.deepEqual(options.directions.map((item) => item.id), ['direction:a'])
  assert.deepEqual(options.projects.map((item) => item.projectId), ['project:a'])
})

test('history correction links only target events retained by the active filters', async () => {
  const { buildPlanningHistory } = await loadPlanningUi()
  const snapshot = {
    directions: [], projects: [], milestones: [], tasks: [], decisions: [],
    events: [
      { id: 'event:original', entityType: 'project', entityId: 'project:a', eventType: 'completed', occurredAt: NOW - DAY },
      { id: 'event:correction', entityType: 'project', entityId: 'project:a', eventType: 'corrected', occurredAt: NOW, details: { correctsEventId: 'event:original' } },
    ],
  }

  const all = buildPlanningHistory(snapshot)
  assert.equal(all.find((item) => item.id === 'event:correction').correctionTargetId, 'event:original')
  assert.deepEqual(all.find((item) => item.id === 'event:original').correctionIds, ['event:correction'])

  const onlyCorrections = buildPlanningHistory(snapshot, { type: 'corrected' })
  assert.equal(onlyCorrections[0].correctionTargetId, null)
  const onlyOriginals = buildPlanningHistory(snapshot, { type: 'completed' })
  assert.deepEqual(onlyOriginals[0].correctionIds, [])
})

test('archived tree nodes cannot create children, project links, or dependencies', async () => {
  const { planningNodeCapabilities } = await loadPlanningUi()
  assert.equal(planningNodeCapabilities({ entityType: 'direction', status: 'archived' }).canLinkProject, false)
  assert.equal(planningNodeCapabilities({ entityType: 'project-profile', planningStatus: 'archived' }).canAddMilestone, false)
  assert.equal(planningNodeCapabilities({ entityType: 'milestone', archivedAt: NOW }).canAddTask, false)
  assert.equal(planningNodeCapabilities({ entityType: 'milestone', status: 'archived' }).canAddDependency, false)
  assert.equal(planningNodeCapabilities({ entityType: 'task', status: 'archived' }).canAddDependency, false)
  assert.equal(planningNodeCapabilities({ entityType: 'project-profile', effectivelyArchived: true }).canAddMilestone, false)
  assert.equal(planningNodeCapabilities({ entityType: 'direction', status: 'active' }).canLinkProject, true)
})

test('contextual profile and dependency forms emit only their repository contracts', async () => {
  const { buildInitialPlanningForm, buildPlanningPayload, validatePlanningEditor } = await loadPlanningUi()
  const profile = buildInitialPlanningForm('project-profile', {
    projectId: 'project:a', directionId: 'direction:a', planningStatus: 'active', isFocus: true,
  })
  assert.equal(profile.projectId, 'project:a')
  assert.equal(profile.isFocus, true)
  const dependency = buildInitialPlanningForm('dependency', {}, { fromType: 'task', fromId: 'task:a' })
  assert.equal(dependency.fromType, 'task')
  assert.equal(dependency.toType, 'task')
  assert.deepEqual(buildPlanningPayload('project-profile', {
    projectId: 'project:a', directionId: 'direction:b', summary: 'Move', planningStatus: 'active',
    isFocus: true, startAt: '', targetAt: '', unsupported: 'ignored',
  }), {
    projectId: 'project:a', directionId: 'direction:b', summary: 'Move', planningStatus: 'active',
    isFocus: true, startAt: null, targetAt: null,
  })
  assert.deepEqual(buildPlanningPayload('dependency', {
    fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'task:b',
    dependencyType: 'depends_on', description: 'Must follow', unsupported: 'ignored',
  }), {
    fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'task:b',
    dependencyType: 'depends_on', description: 'Must follow',
  })
  assert.equal(validatePlanningEditor('dependency', {
    fromType: 'task', fromId: 'task:a', toType: 'milestone', toId: 'milestone:a',
  }), '依赖关系只能连接两个里程碑或两个任务。')
  assert.equal(validatePlanningEditor('dependency', {
    fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'task:a',
  }), '不能让规划事项依赖自身。')
})

test('Task 7 views preserve contextual actions, append-only history, PATCH archives, and modal handling', async () => {
  const [center, editor, roadmap, tree, history] = await Promise.all([
    readFile(new URL('../../app/(admin)/admin/planning/PlanningCenter.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/PlanningEditor.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/PlanningRoadmap.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/PlanningTree.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/PlanningHistory.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(center, /<PlanningRoadmap/)
  assert.match(center, /<PlanningTree/)
  assert.match(center, /<PlanningHistory/)
  assert.match(center, /'project-profile': 'upsert-project-profile'/)
  assert.match(center, /dependency: 'create-dependency'/)
  assert.match(center, /method: 'PATCH'/)
  assert.match(center, /planningStatus: 'archived'/)
  assert.match(center, /status: 'archived'/)
  const quickAddTypes = center.match(/const entityTypes = \[([\s\S]*?)\n\]/)?.[1] || ''
  assert.doesNotMatch(quickAddTypes, /project-profile/)
  assert.doesNotMatch(quickAddTypes, /dependency/)
  assert.match(editor, /DEPENDENCY_CYCLE/)
  assert.match(editor, /DEPENDENCY_TYPE_MISMATCH/)
  assert.match(editor, /usePlanningModal/)
  assert.match(tree, /显示已归档/)
  assert.match(tree, /关联项目/)
  assert.match(tree, /添加依赖/)
  assert.match(tree, /planningNodeCapabilities/)
  assert.match(tree, /capabilities\.canLinkProject/)
  assert.match(tree, /capabilities\.canAddMilestone/)
  assert.match(tree, /capabilities\.canAddTask/)
  assert.match(tree, /capabilities\.canAddDependency/)
  assert.match(roadmap, /待排期/)
  assert.match(history, /来源/)
  assert.match(history, /buildPlanningHistoryFilterOptions/)
  assert.match(history, /item\.correctionTargetId/)
  assert.match(history, /item\.correctionIds/)
  assert.doesNotMatch(history, />删除</)
})
