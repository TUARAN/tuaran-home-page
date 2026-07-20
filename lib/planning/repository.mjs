import { buildPlanningImportPreview } from './seed.mjs'
import {
  classifyPlanningItem,
  eventForTransition,
  validatePlanningPayload,
  wouldCreateDependencyCycle,
} from './rules.mjs'

const WINDOW_MS = { week: 7 * 86400000, month: 30 * 86400000, quarter: 90 * 86400000 }
const TERMINAL = new Set(['completed', 'done', 'cancelled', 'archived'])

function rows(result) {
  return Array.isArray(result?.results) ? result.results : []
}

async function all(db, sql, binds = []) {
  const statement = binds.length ? db.prepare(sql).bind(...binds) : db.prepare(sql)
  return rows(await statement.all())
}

async function first(db, sql, binds = []) {
  const statement = binds.length ? db.prepare(sql).bind(...binds) : db.prepare(sql)
  return (await statement.first()) || null
}

function nowFrom(context) {
  return Number(context?.now ?? Date.now())
}

function newId(entity, context) {
  const value = context?.idFactory ? context.idFactory(entity) : globalThis.crypto.randomUUID()
  return `${entity}:${value}`
}

function changes(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0)
}

function parseObject(value) {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function rowToDirection(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    northStar: row.north_star,
    status: row.status,
    priority: row.priority,
    startAt: row.start_at,
    targetAt: row.target_at,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToProjectProfile(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    directionId: row.direction_id,
    summary: row.summary,
    planningStatus: row.planning_status,
    isFocus: Boolean(row.is_focus),
    startAt: row.start_at,
    targetAt: row.target_at,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(Object.hasOwn(row, 'name') ? {
      name: row.name,
      pillar: row.pillar,
      action: row.action,
      bizStatus: row.biz_status,
      next: row.next_step,
    } : {}),
  }
}

export function rowToMilestone(row) {
  return {
    id: row.id,
    directionId: row.direction_id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    successCriteria: row.success_criteria,
    status: row.status,
    priority: row.priority,
    startAt: row.start_at,
    targetAt: row.target_at,
    completedAt: row.completed_at,
    sourceKey: row.source_key,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToTask(row) {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    plannedAt: row.planned_at,
    startAt: row.start_at,
    targetAt: row.target_at,
    completedAt: row.completed_at,
    note: row.note,
    blockedReason: row.blocked_reason,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToEvent(row) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    eventType: row.event_type,
    title: row.title,
    description: row.description,
    details: parseObject(row.details_json),
    source: row.source,
    sourceKey: row.source_key,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  }
}

export function rowToDecision(row) {
  return {
    id: row.id,
    directionId: row.direction_id,
    projectId: row.project_id,
    milestoneId: row.milestone_id,
    title: row.title,
    context: row.context,
    conclusion: row.conclusion,
    rationale: row.rationale,
    impact: row.impact,
    status: row.status,
    decidedAt: row.decided_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToDependency(row) {
  return {
    id: row.id,
    fromType: row.from_type,
    fromId: row.from_id,
    toType: row.to_type,
    toId: row.to_id,
    dependencyType: row.dependency_type,
    description: row.description,
    status: row.status,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToPortfolioProject(row) {
  let links = []
  try {
    const parsed = JSON.parse(row.links || '[]')
    if (Array.isArray(parsed)) links = parsed
  } catch {
    links = []
  }
  return {
    id: row.id,
    name: row.name,
    pillar: row.pillar,
    action: row.action,
    role: row.role,
    path: row.path,
    next: row.next_step,
    links,
    position: row.pos_x == null || row.pos_y == null ? null : [row.pos_x, row.pos_y],
    revenueMonthly: Number(row.revenue_monthly) || 0,
    hoursMonthly: Number(row.hours_monthly) || 0,
    bizStatus: ['unset', 'earning', 'burning', 'hobby'].includes(row.biz_status) ? row.biz_status : 'unset',
    updatedAt: row.updated_at,
  }
}

export async function readPortfolioCatalog(db) {
  return (await all(db, 'SELECT * FROM portfolio_projects ORDER BY sort_order ASC, name ASC')).map(rowToPortfolioProject)
}

export async function readPlanningSnapshot(db, options = {}) {
  const window = Object.hasOwn(WINDOW_MS, options.window) ? options.window : 'month'
  const generatedAt = Number(options.now ?? Date.now())
  const historyStart = generatedAt - WINDOW_MS[window]

  const [directionRows, catalog, projectRows, milestoneRows, taskRows, eventRows, decisionRows, dependencyRows] = await Promise.all([
    all(db, "SELECT * FROM planning_directions WHERE archived_at IS NULL AND status != 'archived' ORDER BY sort_order ASC, created_at ASC"),
    readPortfolioCatalog(db),
    all(db, `SELECT p.*, portfolio.name, portfolio.pillar, portfolio.action,
                    portfolio.biz_status, portfolio.next_step
             FROM planning_project_profiles p
             JOIN portfolio_projects portfolio ON portfolio.id = p.project_id
             WHERE p.archived_at IS NULL AND p.planning_status != 'archived'
             ORDER BY p.sort_order ASC, p.created_at ASC`),
    all(db, 'SELECT * FROM planning_milestones WHERE archived_at IS NULL ORDER BY sort_order ASC, created_at ASC'),
    all(db, `SELECT t.* FROM planning_tasks t
             JOIN planning_milestones m ON m.id = t.milestone_id
             WHERE t.archived_at IS NULL AND m.archived_at IS NULL
             ORDER BY t.sort_order ASC, t.created_at ASC`),
    all(db, 'SELECT * FROM planning_events WHERE occurred_at >= ?1 ORDER BY occurred_at DESC, created_at DESC', [historyStart]),
    all(db, `SELECT * FROM planning_decisions
             WHERE archived_at IS NULL
               AND (status = 'open' OR COALESCE(decided_at, updated_at, created_at) >= ?1)
             ORDER BY COALESCE(decided_at, updated_at, created_at) DESC`, [historyStart]),
    all(db, "SELECT * FROM planning_dependencies WHERE archived_at IS NULL AND status = 'active' ORDER BY created_at ASC"),
  ])

  const directions = directionRows.map(rowToDirection)
  const projects = projectRows.map(rowToProjectProfile)
  const milestones = milestoneRows.map(rowToMilestone)
  const tasks = taskRows.map(rowToTask)
  const events = eventRows.map(rowToEvent)
  const decisions = decisionRows.map(rowToDecision)
  const dependencies = dependencyRows.map(rowToDependency)
  const triState = { past: [], present: [], future: [], unscheduled: [] }
  const planningItems = [
    ...milestones.map((item) => ({ ...item, entityType: 'milestone' })),
    ...tasks.map((item) => ({ ...item, entityType: 'task' })),
  ]

  for (const item of planningItems) {
    const bucket = classifyPlanningItem(item, generatedAt, window)
    if (bucket === 'future' && item.targetAt == null) triState.unscheduled.push(item)
    else triState[bucket].push(item)
  }

  return {
    generatedAt,
    window,
    directions,
    projectCatalog: catalog,
    projects,
    milestones,
    tasks,
    events,
    decisions,
    dependencies,
    triState,
    stats: {
      completed: planningItems.filter((item) => item.status === 'completed' || item.status === 'done').length,
      focus: projects.filter((project) => project.isFocus).length,
      blocked: planningItems.filter((item) => item.status === 'blocked').length,
      overdue: planningItems.filter((item) => !TERMINAL.has(item.status) && item.targetAt != null && Number(item.targetAt) < generatedAt).length,
      decisions: decisions.filter((decision) => decision.status === 'open').length,
    },
  }
}

function resultOk(id, extra = {}) {
  return { ok: true, id, ...extra }
}

function resultError(error, extra = {}) {
  return { ok: false, error, ...extra }
}

export async function createDirection(db, payload, context = {}) {
  const valid = validatePlanningPayload('direction', payload)
  if (!valid.ok) return valid
  const id = payload.id || newId('direction', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_directions
    (id, title, description, north_star, status, priority, start_at, target_at, completed_at, sort_order, archived_at, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, NULL, ?11, ?11)`)
    .bind(id, valid.value.title, payload.description || '', payload.northStar || '', payload.status || 'planned', payload.priority || 'normal', payload.startAt ?? null, payload.targetAt ?? null, payload.completedAt ?? null, Number(payload.sortOrder || 0), now)
    .run()
  return resultOk(id)
}

export async function upsertProjectProfile(db, payload, context = {}) {
  if (!String(payload?.projectId || '').trim()) return resultError('PROJECT_REQUIRED')
  if (!String(payload?.directionId || '').trim()) return resultError('DIRECTION_REQUIRED')
  if (payload.planningStatus && !['active', 'paused', 'archived'].includes(payload.planningStatus)) return resultError('INVALID_STATUS')
  if (payload.startAt != null && payload.targetAt != null && Number(payload.targetAt) < Number(payload.startAt)) {
    return resultError('TARGET_BEFORE_START')
  }
  const id = payload.id || newId('profile', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_project_profiles
    (id, project_id, direction_id, summary, planning_status, is_focus, start_at, target_at, sort_order, archived_at, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL, ?10, ?10)
    ON CONFLICT(project_id) DO UPDATE SET
      direction_id = excluded.direction_id, summary = excluded.summary,
      planning_status = excluded.planning_status, is_focus = excluded.is_focus,
      start_at = excluded.start_at, target_at = excluded.target_at,
      sort_order = excluded.sort_order, archived_at = NULL, updated_at = excluded.updated_at`)
    .bind(id, payload.projectId, payload.directionId, payload.summary || '', payload.planningStatus || 'active', payload.isFocus ? 1 : 0, payload.startAt ?? null, payload.targetAt ?? null, Number(payload.sortOrder || 0), now)
    .run()
  return resultOk(id)
}

export async function createMilestone(db, payload, context = {}) {
  const valid = validatePlanningPayload('milestone', payload)
  if (!valid.ok) return valid
  const id = payload.id || newId('milestone', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_milestones
    (id, direction_id, project_id, title, description, success_criteria, status, priority, start_at, target_at, completed_at, source_key, sort_order, archived_at, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, NULL, ?14, ?14)`)
    .bind(id, payload.directionId, payload.projectId, valid.value.title, payload.description || '', payload.successCriteria || '', payload.status || 'planned', payload.priority || 'normal', payload.startAt ?? null, payload.targetAt ?? null, payload.completedAt ?? null, payload.sourceKey ?? null, Number(payload.sortOrder || 0), now)
    .run()
  return resultOk(id)
}

export async function createTask(db, payload, context = {}) {
  const valid = validatePlanningPayload('task', payload)
  if (!valid.ok) return valid
  const id = payload.id || newId('task', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_tasks
    (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, NULL, ?15, ?15)`)
    .bind(id, payload.milestoneId, valid.value.title, payload.description || '', payload.status || 'planned', payload.priority || 'normal', payload.assignee || '', payload.plannedAt ?? null, payload.startAt ?? null, payload.targetAt ?? null, payload.completedAt ?? null, payload.note || '', payload.blockedReason || '', Number(payload.sortOrder || 0), now)
    .run()
  return resultOk(id)
}

export async function createDecision(db, payload, context = {}) {
  const title = String(payload?.title || '').trim()
  if (!title) return resultError('TITLE_REQUIRED')
  const status = payload.status || 'open'
  if (!['open', 'decided', 'superseded'].includes(status)) return resultError('INVALID_STATUS')
  if (status === 'decided' && !String(payload.conclusion || '').trim()) return resultError('CONCLUSION_REQUIRED')
  const id = payload.id || newId('decision', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_decisions
    (id, direction_id, project_id, milestone_id, title, context, conclusion, rationale, impact, status, decided_at, archived_at, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, NULL, ?12, ?12)`)
    .bind(id, payload.directionId ?? null, payload.projectId ?? null, payload.milestoneId ?? null, title, payload.context || '', payload.conclusion ?? null, payload.rationale || '', payload.impact || '', status, payload.decidedAt ?? (status === 'decided' ? now : null), now)
    .run()
  return resultOk(id)
}

export async function createManualEvent(db, payload, context = {}) {
  const title = String(payload?.title || '').trim()
  if (!title) return resultError('TITLE_REQUIRED')
  if (!String(payload?.entityType || '').trim() || !String(payload?.entityId || '').trim()) return resultError('ENTITY_REQUIRED')
  const id = payload.id || newId('event', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_events
    (id, entity_type, entity_id, event_type, title, description, details_json, source, source_key, occurred_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`)
    .bind(id, payload.entityType, payload.entityId, payload.eventType || 'note', title, payload.description || '', JSON.stringify(payload.details || {}), payload.source || context.source || 'manual', payload.sourceKey ?? null, payload.occurredAt ?? now, now)
    .run()
  return resultOk(id)
}

async function dependencyEndpointExists(db, type, id) {
  if (type === 'milestone') return Boolean(await first(db, 'SELECT id FROM planning_milestones WHERE id = ?1 AND archived_at IS NULL', [id]))
  if (type === 'task') return Boolean(await first(db, 'SELECT id FROM planning_tasks WHERE id = ?1 AND archived_at IS NULL', [id]))
  return false
}

export async function createDependency(db, payload, context = {}) {
  if (payload?.fromType !== payload?.toType) return resultError('DEPENDENCY_TYPE_MISMATCH')
  if (!['milestone', 'task'].includes(payload?.fromType)) return resultError('INVALID_DEPENDENCY_ENTITY_TYPE')
  if (!payload.fromId || !payload.toId) return resultError('DEPENDENCY_ENDPOINT_REQUIRED')
  if (payload.fromId === payload.toId) return resultError('DEPENDENCY_SELF_LINK')
  const [fromExists, toExists] = await Promise.all([
    dependencyEndpointExists(db, payload.fromType, payload.fromId),
    dependencyEndpointExists(db, payload.toType, payload.toId),
  ])
  if (!fromExists || !toExists) return resultError('DEPENDENCY_ENDPOINT_NOT_FOUND')
  const edges = (await all(db, "SELECT * FROM planning_dependencies WHERE archived_at IS NULL AND status = 'active'"))
    .map(rowToDependency)
  if (wouldCreateDependencyCycle(edges, payload)) return resultError('DEPENDENCY_CYCLE')
  const id = payload.id || newId('dependency', context)
  const now = nowFrom(context)
  await db.prepare(`INSERT INTO planning_dependencies
    (id, from_type, from_id, to_type, to_id, dependency_type, description, status, archived_at, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'active', NULL, ?8, ?8)`)
    .bind(id, payload.fromType, payload.fromId, payload.toType, payload.toId, payload.dependencyType || 'depends_on', payload.description || '', now)
    .run()
  return resultOk(id)
}

function updateStatement(db, table, id, changesToWrite, updatedAt) {
  const entries = Object.entries(changesToWrite)
  const assignments = entries.map(([column], index) => `${column} = ?${index + 1}`)
  assignments.push(`updated_at = ?${entries.length + 1}`)
  return db.prepare(`UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ?${entries.length + 2}`)
    .bind(...entries.map(([, value]) => value), updatedAt, id)
}

function selectChanges(changesToRead, columns) {
  const selected = {}
  for (const [key, column] of Object.entries(columns)) {
    if (Object.hasOwn(changesToRead, key)) selected[column] = changesToRead[key]
  }
  return selected
}

async function runSimpleUpdate(db, table, id, changesToRead, columns, context) {
  const selected = selectChanges(changesToRead, columns)
  if (!Object.keys(selected).length) return resultError('NO_CHANGES')
  const result = await updateStatement(db, table, id, selected, nowFrom(context)).run()
  return changes(result) ? resultOk(id) : resultError('NOT_FOUND')
}

export async function updateDirection(db, id, changesToRead, context = {}) {
  const before = await first(db, 'SELECT * FROM planning_directions WHERE id = ?1', [id])
  if (!before) return resultError('NOT_FOUND')
  const candidate = { ...rowToDirection(before), ...changesToRead }
  const valid = validatePlanningPayload('direction', candidate)
  if (!valid.ok) return valid
  return runSimpleUpdate(db, 'planning_directions', id, changesToRead, {
    title: 'title', description: 'description', northStar: 'north_star', status: 'status', priority: 'priority',
    startAt: 'start_at', targetAt: 'target_at', completedAt: 'completed_at', sortOrder: 'sort_order', archivedAt: 'archived_at',
  }, context)
}

export async function updateProjectProfile(db, id, changesToRead, context = {}) {
  const before = await first(db, 'SELECT * FROM planning_project_profiles WHERE id = ?1', [id])
  if (!before) return resultError('NOT_FOUND')
  if (changesToRead.planningStatus && !['active', 'paused', 'archived'].includes(changesToRead.planningStatus)) return resultError('INVALID_STATUS')
  const candidate = { ...rowToProjectProfile(before), ...changesToRead }
  if (candidate.startAt != null && candidate.targetAt != null && Number(candidate.targetAt) < Number(candidate.startAt)) {
    return resultError('TARGET_BEFORE_START')
  }
  const values = Object.hasOwn(changesToRead, 'isFocus')
    ? { ...changesToRead, isFocus: changesToRead.isFocus ? 1 : 0 }
    : changesToRead
  return runSimpleUpdate(db, 'planning_project_profiles', id, values, {
    projectId: 'project_id', directionId: 'direction_id', summary: 'summary', planningStatus: 'planning_status',
    isFocus: 'is_focus', startAt: 'start_at', targetAt: 'target_at', sortOrder: 'sort_order', archivedAt: 'archived_at',
  }, context)
}

function transitionEventStatement(db, event, context, now) {
  const id = newId('event', context)
  const sourceKey = `transition:${event.entityType}:${event.entityId}:${event.eventType}:${now}`
  return db.prepare(`INSERT INTO planning_events
    (id, entity_type, entity_id, event_type, title, description, details_json, source, source_key, occurred_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, '', '{}', 'system', ?6, ?7, ?7)`)
    .bind(id, event.entityType, event.entityId, event.eventType, event.title, sourceKey, event.occurredAt)
}

async function updateWorkItem(db, entity, table, mapper, id, changesToRead, columns, context) {
  const beforeRow = await first(db, `SELECT * FROM ${table} WHERE id = ?1`, [id])
  if (!beforeRow) return resultError('NOT_FOUND')
  const before = mapper(beforeRow)
  const candidate = { ...before, ...changesToRead }
  const valid = validatePlanningPayload(entity, candidate)
  if (!valid.ok) return valid

  if (entity === 'milestone' && changesToRead.status === 'completed' && before.status !== 'completed') {
    const openTasks = await all(db, `SELECT id FROM planning_tasks
      WHERE milestone_id = ?1 AND status NOT IN ('done', 'cancelled', 'archived') AND archived_at IS NULL`, [id])
    if (openTasks.length) return resultError('MILESTONE_HAS_OPEN_TASKS', { openTaskIds: openTasks.map((row) => row.id) })
  }

  const selected = selectChanges(changesToRead, columns)
  if (!Object.keys(selected).length) return resultError('NO_CHANGES')
  const now = nowFrom(context)
  const statement = updateStatement(db, table, id, selected, now)
  const event = eventForTransition(entity, before, candidate, now)
  if (event) {
    await db.batch([statement, transitionEventStatement(db, event, context, now)])
    return resultOk(id, { event })
  }
  const result = await statement.run()
  return changes(result) ? resultOk(id) : resultError('NOT_FOUND')
}

export function updateMilestone(db, id, changesToRead, context = {}) {
  return updateWorkItem(db, 'milestone', 'planning_milestones', rowToMilestone, id, changesToRead, {
    directionId: 'direction_id', projectId: 'project_id', title: 'title', description: 'description', successCriteria: 'success_criteria',
    status: 'status', priority: 'priority', startAt: 'start_at', targetAt: 'target_at', completedAt: 'completed_at',
    sourceKey: 'source_key', sortOrder: 'sort_order', archivedAt: 'archived_at',
  }, context)
}

export function updateTask(db, id, changesToRead, context = {}) {
  return updateWorkItem(db, 'task', 'planning_tasks', rowToTask, id, changesToRead, {
    milestoneId: 'milestone_id', title: 'title', description: 'description', status: 'status', priority: 'priority',
    assignee: 'assignee', plannedAt: 'planned_at', startAt: 'start_at', targetAt: 'target_at', completedAt: 'completed_at',
    note: 'note', blockedReason: 'blocked_reason', sortOrder: 'sort_order', archivedAt: 'archived_at',
  }, context)
}

export async function archivePlanningEntity(db, entity, id, context = {}) {
  const now = nowFrom(context)
  const operations = {
    direction: () => updateDirection(db, id, { status: 'archived', archivedAt: now }, context),
    'project-profile': () => updateProjectProfile(db, id, { planningStatus: 'archived', archivedAt: now }, context),
    milestone: () => updateMilestone(db, id, { status: 'archived', archivedAt: now }, context),
    task: () => updateTask(db, id, { status: 'archived', archivedAt: now }, context),
    decision: () => runSimpleUpdate(db, 'planning_decisions', id, { archivedAt: now }, { archivedAt: 'archived_at' }, context),
    dependency: () => runSimpleUpdate(db, 'planning_dependencies', id, { status: 'archived', archivedAt: now }, { status: 'status', archivedAt: 'archived_at' }, context),
  }
  return operations[entity] ? operations[entity]() : resultError('INVALID_ENTITY')
}

const REFERENCE_CHECKS = {
  direction: [
    ['planning_project_profiles', 'direction_id'], ['planning_milestones', 'direction_id'], ['planning_decisions', 'direction_id'],
  ],
  'project-profile': [
    ['planning_milestones', 'project_id', 'project_id'], ['planning_decisions', 'project_id', 'project_id'],
  ],
  milestone: [
    ['planning_tasks', 'milestone_id'], ['planning_decisions', 'milestone_id'],
  ],
}

export async function deletePristinePlanningEntity(db, entity, id) {
  const tableByEntity = {
    direction: 'planning_directions', 'project-profile': 'planning_project_profiles', milestone: 'planning_milestones',
    task: 'planning_tasks', decision: 'planning_decisions', dependency: 'planning_dependencies',
  }
  const table = tableByEntity[entity]
  if (!table) return resultError('INVALID_ENTITY')
  const record = await first(db, `SELECT * FROM ${table} WHERE id = ?1`, [id])
  if (!record) return resultError('NOT_FOUND')

  const referenceId = entity === 'project-profile' ? record.project_id : id
  for (const [referenceTable, column] of REFERENCE_CHECKS[entity] || []) {
    if (await first(db, `SELECT 1 AS found FROM ${referenceTable} WHERE ${column} = ?1 LIMIT 1`, [referenceId])) {
      return resultError('ENTITY_REFERENCED', { archiveAllowed: true })
    }
  }
  if (entity === 'milestone' || entity === 'task') {
    if (await first(db, `SELECT 1 AS found FROM planning_dependencies
      WHERE (from_type = ?1 AND from_id = ?2) OR (to_type = ?1 AND to_id = ?2) LIMIT 1`, [entity, id])) {
      return resultError('ENTITY_REFERENCED', { archiveAllowed: true })
    }
  }
  if (await first(db, 'SELECT 1 AS found FROM planning_events WHERE entity_type = ?1 AND entity_id = ?2 LIMIT 1', [entity, id])) {
    return resultError('ENTITY_REFERENCED', { archiveAllowed: true })
  }
  const result = await db.prepare(`DELETE FROM ${table} WHERE id = ?1`).bind(id).run()
  return changes(result) ? resultOk(id) : resultError('NOT_FOUND')
}

export function previewInitialImport(projects, changelog) {
  return buildPlanningImportPreview(projects, changelog)
}

function importStatement(db, entity, item, now) {
  if (entity === 'directions') {
    return db.prepare(`INSERT OR IGNORE INTO planning_directions
      (id, title, description, north_star, status, priority, start_at, target_at, completed_at, sort_order, archived_at, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, 'planned', 'normal', NULL, NULL, NULL, 0, NULL, ?5, ?5)`)
      .bind(item.id, item.title, item.description || '', item.vision || '', now)
  }
  if (entity === 'profiles') {
    return db.prepare(`INSERT OR IGNORE INTO planning_project_profiles
      (id, project_id, direction_id, summary, planning_status, is_focus, start_at, target_at, sort_order, archived_at, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, 'active', 0, NULL, NULL, 0, NULL, ?5, ?5)`)
      .bind(item.id, item.projectId, item.directionId, item.summary || '', now)
  }
  if (entity === 'milestones') {
    return db.prepare(`INSERT OR IGNORE INTO planning_milestones
      (id, direction_id, project_id, title, description, success_criteria, status, priority, start_at, target_at, completed_at, source_key, sort_order, archived_at, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, '', ?6, 'normal', NULL, ?7, NULL, ?8, 0, NULL, ?9, ?9)`)
      .bind(item.id, item.directionId, item.projectId, item.title, item.description || '', item.status || 'planned', item.targetAt ?? null, item.sourceKey ?? null, now)
  }
  return db.prepare(`INSERT OR IGNORE INTO planning_events
    (id, entity_type, entity_id, event_type, title, description, details_json, source, source_key, occurred_at, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, '', ?6, 'import', ?7, ?8, ?9)`)
    .bind(item.id, item.entityType, item.entityId, item.eventType, item.title, JSON.stringify(item.details || {}), item.sourceKey, item.occurredAt, now)
}

export async function applyInitialImport(db, preview, now = Date.now()) {
  const entityTypes = ['directions', 'profiles', 'milestones', 'events']
  const entries = entityTypes.flatMap((entity) => (preview?.[entity] || []).map((item) => ({ entity, item })))
  const inserted = Object.fromEntries(entityTypes.map((entity) => [entity, 0]))
  const skipped = Object.fromEntries(entityTypes.map((entity) => [entity, 0]))
  if (!entries.length) return { inserted, skipped }

  const results = await db.batch(entries.map(({ entity, item }) => importStatement(db, entity, item, Number(now))))
  entries.forEach(({ entity }, index) => {
    if (changes(results[index])) inserted[entity] += 1
    else skipped[entity] += 1
  })
  return { inserted, skipped }
}
