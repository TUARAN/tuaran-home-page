import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function loadPlanningUi() {
  const source = await readFile(new URL('../../app/(admin)/admin/planning/planningUi.js', import.meta.url), 'utf8')
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

test('overview groups filtered items once using the snapshot generation time', async () => {
  const { buildOverviewModel } = await loadPlanningUi()
  const day = 86400000
  const now = new Date(2026, 6, 20).getTime()
  const snapshot = {
    generatedAt: now,
    directions: [
      { id: 'direction:a', title: 'A', northStar: 'Ship A' },
      { id: 'direction:b', title: 'B', northStar: 'Ship B' },
    ],
    projects: [
      { id: 'profile:a', projectId: 'project:a', directionId: 'direction:a', name: 'Project A', isFocus: true },
      { id: 'profile:b', projectId: 'project:b', directionId: 'direction:b', name: 'Project B', isFocus: true },
    ],
    milestones: [
      { id: 'milestone:a', projectId: 'project:a', directionId: 'direction:a', title: 'A milestone' },
      { id: 'milestone:b', projectId: 'project:b', directionId: 'direction:b', title: 'B milestone' },
    ],
    tasks: [],
    events: [
      { id: 'event:direction-a', entityType: 'direction', entityId: 'direction:a', title: 'Direction A review', occurredAt: now - day },
      { id: 'event:a', entityType: 'milestone', entityId: 'milestone:a', title: 'Completed A', occurredAt: now - day },
      { id: 'event:decision-a', entityType: 'decision', entityId: 'decision:a', title: 'Recorded A decision', occurredAt: now - day },
      { id: 'event:b', entityType: 'milestone', entityId: 'milestone:b', title: 'Completed B', occurredAt: now - day },
    ],
    decisions: [
      { id: 'decision:a', directionId: 'direction:a', status: 'open' },
      { id: 'decision:b', directionId: 'direction:b', status: 'open' },
    ],
    triState: {
      past: [{ id: 'past:a', entityType: 'milestone', directionId: 'direction:a', projectId: 'project:a', status: 'completed' }],
      present: [
        { id: 'task:now', entityType: 'task', milestoneId: 'milestone:a', title: 'Now', status: 'doing', targetAt: now + day },
      ],
      future: [
        { id: 'task:now', entityType: 'task', milestoneId: 'milestone:a', title: 'Duplicate', status: 'planned', targetAt: now + day },
        { id: 'milestone:near', entityType: 'milestone', directionId: 'direction:a', projectId: 'project:a', status: 'planned', targetAt: now + 30 * day },
        { id: 'milestone:mid', entityType: 'milestone', directionId: 'direction:a', projectId: 'project:a', status: 'planned', targetAt: now + 31 * day },
        { id: 'milestone:long', entityType: 'milestone', directionId: 'direction:a', projectId: 'project:a', status: 'planned', targetAt: now + 91 * day },
        { id: 'milestone:none', entityType: 'milestone', directionId: 'direction:a', projectId: 'project:a', status: 'planned', targetAt: null },
        { id: 'milestone:b-future', entityType: 'milestone', directionId: 'direction:b', projectId: 'project:b', status: 'planned', targetAt: now + 10 * day },
      ],
      unscheduled: [
        { id: 'milestone:none', entityType: 'milestone', directionId: 'direction:a', projectId: 'project:a', status: 'planned', targetAt: null },
      ],
    },
  }

  const model = buildOverviewModel(snapshot, 'direction:a')

  assert.equal(model.northStar, 'Ship A')
  assert.deepEqual(model.past.map((item) => item.id), ['event:direction-a', 'event:a', 'event:decision-a'])
  assert.deepEqual(model.present.map((item) => item.id), ['task:now'])
  assert.deepEqual(model.future.near.map((item) => item.id), ['milestone:near'])
  assert.deepEqual(model.future.mid.map((item) => item.id), ['milestone:mid'])
  assert.deepEqual(model.future.long.map((item) => item.id), ['milestone:long'])
  assert.deepEqual(model.future.unscheduled.map((item) => item.id), ['milestone:none'])
  assert.deepEqual(model.stats, { completed: 1, focus: 1, blocked: 0, overdue: 0, decisions: 1 })
})

test('editor helpers preselect hierarchy and emit only supported API fields', async () => {
  const {
    buildInitialPlanningForm,
    buildPlanningPayload,
    dateInputToTimestamp,
    validatePlanningEditor,
  } = await loadPlanningUi()
  const snapshot = {
    projects: [{ id: 'profile:a', projectId: 'project:a', directionId: 'direction:a' }],
    milestones: [{ id: 'milestone:a', directionId: 'direction:a', projectId: 'project:a' }],
  }
  const initial = buildInitialPlanningForm('task', {}, { milestoneId: 'milestone:a' }, snapshot)
  assert.equal(initial.milestoneId, 'milestone:a')
  assert.equal(initial.directionId, 'direction:a')
  assert.equal(initial.projectId, 'project:a')
  assert.equal(initial.status, 'planned')
  assert.equal(initial.priority, 'normal')
  const projectInitial = buildInitialPlanningForm('milestone', {}, { projectId: 'project:a' }, snapshot)
  assert.equal(projectInitial.directionId, 'direction:a')
  assert.equal(projectInitial.projectId, 'project:a')
  const eventInitial = buildInitialPlanningForm('event', {}, { milestoneId: 'milestone:a' }, snapshot)
  assert.equal(eventInitial.entityType, 'milestone')
  assert.equal(eventInitial.entityId, 'milestone:a')

  const expectedDate = new Date(2026, 6, 20).getTime()
  assert.equal(dateInputToTimestamp('2026-07-20'), expectedDate)
  assert.equal(dateInputToTimestamp('2026-02-31'), null)
  assert.deepEqual(buildPlanningPayload('milestone', {
    directionId: 'direction:a', projectId: 'project:a', milestoneId: 'ignored',
    title: ' Launch ', description: 'Details', successCriteria: 'Live',
    status: 'active', priority: 'high', startAt: '2026-07-20', targetAt: '',
    assignee: 'ignored', unsupported: 'ignored',
  }), {
    directionId: 'direction:a', projectId: 'project:a', title: 'Launch',
    description: 'Details', successCriteria: 'Live', status: 'active', priority: 'high',
    startAt: expectedDate, targetAt: null, completedAt: null,
  })
  assert.deepEqual(buildPlanningPayload('decision', {
    directionId: '', projectId: '', milestoneId: '', title: 'Choose', status: 'open', decidedAt: '',
  }), {
    directionId: null, projectId: null, milestoneId: null, title: 'Choose',
    context: '', conclusion: '', rationale: '', impact: '', status: 'open', decidedAt: null,
  })
  assert.equal(validatePlanningEditor('decision', { title: 'Choose', status: 'decided', conclusion: '' }), '已决策记录必须填写最终结论。')
  assert.equal(validatePlanningEditor('task', { title: 'Ship', milestoneId: '' }), '请选择所属里程碑。')
})

test('planning request preserves structured conflict details for the editor', async () => {
  const { planningRequest } = await loadPlanningUi()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: 'MILESTONE_HAS_OPEN_TASKS', openTaskIds: ['task:a', 'task:b'],
  }), { status: 409 })

  try {
    await assert.rejects(
      () => planningRequest('/api/admin/planning', { method: 'PATCH' }),
      (error) => error.code === 'MILESTONE_HAS_OPEN_TASKS'
        && assert.deepEqual(error.openTaskIds, ['task:a', 'task:b']) === undefined,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('overview and editor sources retain accessibility and workflow contracts', async () => {
  const [overview, editor, center, modalFocus] = await Promise.all([
    readFile(new URL('../../app/(admin)/admin/planning/TriStateOverview.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/PlanningEditor.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/PlanningCenter.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/planning/planningModalFocus.js', import.meta.url), 'utf8'),
  ])

  assert.match(overview, /<StatusPill/)
  assert.match(overview, /完成任务或补录历史后，这里会形成时间线。/)
  assert.match(overview, /还没有当前焦点；开始一个计划，或添加进行中的任务。/)
  assert.match(overview, /还没有未来计划；创建里程碑来明确下一步。/)
  assert.match(editor, /aria-label="关闭编辑器"/)
  assert.match(editor, /openTaskIds/)
  assert.match(editor, /onOpenTree/)
  assert.match(editor, /usePlanningModal/)
  assert.match(editor, /ref=\{initialFocusRef\}/)
  assert.match(editor, /\['critical', '关键'\]/)
  assert.match(overview, /critical:\s*\{ label: '关键', tone: 'danger' \}/)
  assert.match(center, /entityTypes/)
  assert.match(center, /usePlanningModal/)
  assert.match(center, /data-planning-modal-background/)
  assert.match(center, /ref=\{initialFocusRef\}/)
  assert.doesNotMatch(center, /project-profile[^\n]*快速添加/)
  assert.doesNotMatch(center, /dependency[^\n]*快速添加/)
  assert.match(center, /\{PLANNING_TABS\.map\(\(tab\) => \(/)
  assert.match(center, /hidden=\{activeTab !== tab\.id\}/)

  const treeHandler = center.match(/onOpenTree=\{\(\) => \{([\s\S]*?)\}\}/)?.[1] || ''
  assert.match(treeHandler, /setActiveTab\('tree'\)/)
  assert.doesNotMatch(treeHandler, /setEditor\(null\)/)

  assert.match(modalFocus, /document\.activeElement/)
  assert.match(modalFocus, /initialFocusRef\.current\?\.focus\(\)/)
  assert.match(modalFocus, /event\.key === 'Escape'/)
  assert.match(modalFocus, /event\.key !== 'Tab'/)
  assert.match(modalFocus, /event\.shiftKey/)
  assert.match(modalFocus, /background\.inert = true/)
  assert.match(modalFocus, /setAttribute\('aria-hidden', 'true'\)/)
  assert.match(modalFocus, /removeEventListener\('keydown'/)
  assert.match(modalFocus, /previouslyFocused\.isConnected/)
  assert.match(modalFocus, /closest\('\[hidden\], \[inert\], \[aria-hidden="true"\]'\)/)
  assert.match(modalFocus, /document\.querySelector\('\[role="tab"\]\[aria-selected="true"\]'\)/)
  assert.match(modalFocus, /document\.querySelector\('\[data-planning-focus-fallback\]'\)/)
  assert.match(modalFocus, /restoreFocus\(previouslyFocused\)/)
  assert.match(center, /data-planning-focus-fallback/)
})
