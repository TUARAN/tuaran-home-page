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

  const [
    directionRows, catalog, projectRows, milestoneRows, taskRows, eventRows, decisionRows, dependencyRows,
    hierarchyDirectionRows, hierarchyProjectRows, hierarchyMilestoneRows, hierarchyTaskRows,
  ] = await Promise.all([
    all(db, "SELECT * FROM planning_directions WHERE archived_at IS NULL AND status != 'archived' ORDER BY sort_order ASC, created_at ASC"),
    readPortfolioCatalog(db),
    all(db, `SELECT p.*, portfolio.name, portfolio.pillar, portfolio.action,
                    portfolio.biz_status, portfolio.next_step
             FROM planning_project_profiles p
             JOIN portfolio_projects portfolio ON portfolio.id = p.project_id
             JOIN planning_directions direction ON direction.id = p.direction_id
             WHERE p.archived_at IS NULL AND p.planning_status != 'archived'
               AND direction.archived_at IS NULL AND direction.status != 'archived'
             ORDER BY p.sort_order ASC, p.created_at ASC`),
    all(db, `SELECT milestone.* FROM planning_milestones milestone
             JOIN planning_project_profiles profile
               ON profile.direction_id = milestone.direction_id AND profile.project_id = milestone.project_id
             JOIN planning_directions direction ON direction.id = profile.direction_id
             WHERE milestone.archived_at IS NULL AND milestone.status != 'archived'
               AND profile.archived_at IS NULL AND profile.planning_status != 'archived'
               AND direction.archived_at IS NULL AND direction.status != 'archived'
             ORDER BY milestone.sort_order ASC, milestone.created_at ASC`),
    all(db, `SELECT task.* FROM planning_tasks task
             JOIN planning_milestones milestone ON milestone.id = task.milestone_id
             JOIN planning_project_profiles profile
               ON profile.direction_id = milestone.direction_id AND profile.project_id = milestone.project_id
             JOIN planning_directions direction ON direction.id = profile.direction_id
             WHERE task.archived_at IS NULL AND task.status != 'archived'
               AND milestone.archived_at IS NULL AND milestone.status != 'archived'
               AND profile.archived_at IS NULL AND profile.planning_status != 'archived'
               AND direction.archived_at IS NULL AND direction.status != 'archived'
             ORDER BY task.sort_order ASC, task.created_at ASC`),
    all(db, `SELECT * FROM planning_events
             WHERE occurred_at >= ?1 AND occurred_at <= ?2
             ORDER BY occurred_at DESC, created_at DESC`, [historyStart, generatedAt]),
    all(db, `SELECT * FROM planning_decisions
             WHERE archived_at IS NULL
               AND (status = 'open' OR (
                 COALESCE(decided_at, updated_at, created_at) >= ?1
                 AND COALESCE(decided_at, updated_at, created_at) <= ?2
               ))
             ORDER BY COALESCE(decided_at, updated_at, created_at) DESC`, [historyStart, generatedAt]),
    all(db, "SELECT * FROM planning_dependencies WHERE archived_at IS NULL AND status = 'active' ORDER BY created_at ASC"),
    all(db, 'SELECT * FROM planning_directions ORDER BY sort_order ASC, created_at ASC'),
    all(db, `SELECT p.*, portfolio.name, portfolio.pillar, portfolio.action,
                    portfolio.biz_status, portfolio.next_step
             FROM planning_project_profiles p
             JOIN portfolio_projects portfolio ON portfolio.id = p.project_id
             ORDER BY p.sort_order ASC, p.created_at ASC`),
    all(db, 'SELECT * FROM planning_milestones ORDER BY sort_order ASC, created_at ASC'),
    all(db, 'SELECT * FROM planning_tasks ORDER BY sort_order ASC, created_at ASC'),
  ])

  const directions = directionRows.map(rowToDirection)
  const projects = projectRows.map(rowToProjectProfile)
  const milestones = milestoneRows.map(rowToMilestone)
  const tasks = taskRows.map(rowToTask)
  const events = eventRows.map(rowToEvent)
  const decisions = decisionRows.map(rowToDecision)
  const activeMilestoneIds = new Set(milestones.map((item) => item.id))
  const activeTaskIds = new Set(tasks.map((item) => item.id))
  const dependencies = dependencyRows.map(rowToDependency).filter((item) => {
    const endpointIds = item.fromType === 'milestone' ? activeMilestoneIds : activeTaskIds
    return endpointIds.has(item.fromId) && endpointIds.has(item.toId)
  })
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
    hierarchy: {
      directions: hierarchyDirectionRows.map(rowToDirection),
      projects: hierarchyProjectRows.map(rowToProjectProfile),
      milestones: hierarchyMilestoneRows.map(rowToMilestone),
      tasks: hierarchyTaskRows.map(rowToTask),
    },
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

async function validatePortfolioProjectReference(db, projectId) {
  const row = await first(db, 'SELECT id FROM portfolio_projects WHERE id = ?1', [projectId])
  return row ? null : resultError('PROJECT_NOT_FOUND')
}

async function validateDirectionReference(db, directionId, { allowArchived = false } = {}) {
  const row = await first(db, 'SELECT id, status, archived_at FROM planning_directions WHERE id = ?1', [directionId])
  if (!row) return resultError('DIRECTION_NOT_FOUND')
  if (!allowArchived && (row.archived_at != null || row.status === 'archived')) return resultError('DIRECTION_ARCHIVED')
  return null
}

async function validateProfileReference(db, directionId, projectId, { allowArchived = false } = {}) {
  const row = await first(db, `SELECT p.id, p.planning_status, p.archived_at,
                                      d.status AS direction_status, d.archived_at AS direction_archived_at
                               FROM planning_project_profiles p
                               JOIN planning_directions d ON d.id = p.direction_id
                               WHERE p.direction_id = ?1 AND p.project_id = ?2`, [directionId, projectId])
  if (!row) return resultError('PROJECT_PROFILE_NOT_FOUND')
  if (allowArchived) return null
  if (row.archived_at != null || row.planning_status === 'archived') return resultError('PROJECT_PROFILE_ARCHIVED')
  if (row.direction_archived_at != null || row.direction_status === 'archived') return resultError('DIRECTION_ARCHIVED')
  return null
}

async function validateMilestoneReference(db, milestoneId, { allowArchived = false } = {}) {
  const row = await first(db, 'SELECT id, status, archived_at FROM planning_milestones WHERE id = ?1', [milestoneId])
  if (!row) return resultError('MILESTONE_NOT_FOUND')
  if (!allowArchived && (row.archived_at != null || row.status === 'archived')) return resultError('MILESTONE_ARCHIVED')
  return null
}

async function validateDecisionReferences(db, payload) {
  if (payload.directionId) {
    const invalid = await validateDirectionReference(db, payload.directionId, { allowArchived: true })
    if (invalid) return invalid
  }
  if (payload.projectId && !await first(db, 'SELECT id FROM planning_project_profiles WHERE project_id = ?1', [payload.projectId])) {
    return resultError('PROJECT_PROFILE_NOT_FOUND')
  }
  if (payload.milestoneId) {
    const invalid = await validateMilestoneReference(db, payload.milestoneId, { allowArchived: true })
    if (invalid) return invalid
  }
  return null
}

async function eventTargetExists(db, entityType, entityId) {
  if (entityType === 'direction') return Boolean(await first(db, 'SELECT id FROM planning_directions WHERE id = ?1', [entityId]))
  if (entityType === 'project') return Boolean(await first(db, 'SELECT id FROM portfolio_projects WHERE id = ?1', [entityId]))
  if (entityType === 'project-profile') return Boolean(await first(db, 'SELECT id FROM planning_project_profiles WHERE id = ?1', [entityId]))
  if (entityType === 'milestone') return Boolean(await first(db, 'SELECT id FROM planning_milestones WHERE id = ?1', [entityId]))
  if (entityType === 'task') return Boolean(await first(db, 'SELECT id FROM planning_tasks WHERE id = ?1', [entityId]))
  if (entityType === 'decision') return Boolean(await first(db, 'SELECT id FROM planning_decisions WHERE id = ?1', [entityId]))
  if (entityType === 'dependency') return Boolean(await first(db, 'SELECT id FROM planning_dependencies WHERE id = ?1', [entityId]))
  return false
}

const EVENT_TARGET_CONDITIONS = {
  direction: 'EXISTS (SELECT 1 FROM planning_directions WHERE id = ?3)',
  project: 'EXISTS (SELECT 1 FROM portfolio_projects WHERE id = ?3)',
  'project-profile': 'EXISTS (SELECT 1 FROM planning_project_profiles WHERE id = ?3)',
  milestone: 'EXISTS (SELECT 1 FROM planning_milestones WHERE id = ?3)',
  task: 'EXISTS (SELECT 1 FROM planning_tasks WHERE id = ?3)',
  decision: 'EXISTS (SELECT 1 FROM planning_decisions WHERE id = ?3)',
  dependency: 'EXISTS (SELECT 1 FROM planning_dependencies WHERE id = ?3)',
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
  const invalidProject = await validatePortfolioProjectReference(db, payload.projectId)
  if (invalidProject) return invalidProject
  const invalidDirection = await validateDirectionReference(db, payload.directionId)
  if (invalidDirection) return invalidDirection
  const id = payload.id || newId('profile', context)
  const now = nowFrom(context)
  const result = await db.prepare(`INSERT INTO planning_project_profiles
    (id, project_id, direction_id, summary, planning_status, is_focus, start_at, target_at, sort_order, archived_at, created_at, updated_at)
    SELECT ?1, portfolio.id, direction.id, ?4, ?5, ?6, ?7, ?8, ?9, NULL, ?10, ?10
    FROM portfolio_projects portfolio
    JOIN planning_directions direction ON direction.id = ?3
    WHERE portfolio.id = ?2
      AND direction.archived_at IS NULL
      AND direction.status != 'archived'
    ON CONFLICT(project_id) DO UPDATE SET
      direction_id = excluded.direction_id, summary = excluded.summary,
      planning_status = excluded.planning_status, is_focus = excluded.is_focus,
      start_at = excluded.start_at, target_at = excluded.target_at,
      sort_order = excluded.sort_order, archived_at = NULL, updated_at = excluded.updated_at`)
    .bind(id, payload.projectId, payload.directionId, payload.summary || '', payload.planningStatus || 'active', payload.isFocus ? 1 : 0, payload.startAt ?? null, payload.targetAt ?? null, Number(payload.sortOrder || 0), now)
    .run()
  if (!changes(result)) {
    const missingProject = await validatePortfolioProjectReference(db, payload.projectId)
    if (missingProject) return missingProject
    const unavailableDirection = await validateDirectionReference(db, payload.directionId)
    if (unavailableDirection) return unavailableDirection
    return resultError('WRITE_CONFLICT')
  }
  const persisted = await first(db, 'SELECT * FROM planning_project_profiles WHERE project_id = ?1', [payload.projectId])
  if (!persisted) return resultError('WRITE_FAILED')
  return resultOk(persisted.id, { profile: rowToProjectProfile(persisted) })
}

export async function createMilestone(db, payload, context = {}) {
  const valid = validatePlanningPayload('milestone', payload)
  if (!valid.ok) return valid
  const invalidProfile = await validateProfileReference(db, payload.directionId, payload.projectId)
  if (invalidProfile) return invalidProfile
  const id = payload.id || newId('milestone', context)
  const now = nowFrom(context)
  const result = await db.prepare(`INSERT OR IGNORE INTO planning_milestones
    (id, direction_id, project_id, title, description, success_criteria, status, priority, start_at, target_at, completed_at, source_key, sort_order, archived_at, created_at, updated_at)
    SELECT ?1, profile.direction_id, profile.project_id, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, NULL, ?14, ?14
    FROM planning_project_profiles profile
    JOIN planning_directions direction ON direction.id = profile.direction_id
    WHERE profile.direction_id = ?2 AND profile.project_id = ?3
      AND profile.archived_at IS NULL AND profile.planning_status != 'archived'
      AND direction.archived_at IS NULL AND direction.status != 'archived'`)
    .bind(id, payload.directionId, payload.projectId, valid.value.title, payload.description || '', payload.successCriteria || '', payload.status || 'planned', payload.priority || 'normal', payload.startAt ?? null, payload.targetAt ?? null, payload.completedAt ?? null, payload.sourceKey ?? null, Number(payload.sortOrder || 0), now)
    .run()
  if (!changes(result)) {
    const unavailableProfile = await validateProfileReference(db, payload.directionId, payload.projectId)
    return unavailableProfile || resultError('WRITE_CONFLICT')
  }
  return resultOk(id)
}

export async function createTask(db, payload, context = {}) {
  const valid = validatePlanningPayload('task', payload)
  if (!valid.ok) return valid
  const invalidMilestone = await validateMilestoneReference(db, payload.milestoneId)
  if (invalidMilestone) return invalidMilestone
  const id = payload.id || newId('task', context)
  const now = nowFrom(context)
  const result = await db.prepare(`INSERT OR IGNORE INTO planning_tasks
    (id, milestone_id, title, description, status, priority, assignee, planned_at, start_at, target_at, completed_at, note, blocked_reason, sort_order, archived_at, created_at, updated_at)
    SELECT ?1, milestone.id, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, NULL, ?15, ?15
    FROM planning_milestones milestone
    WHERE milestone.id = ?2 AND milestone.archived_at IS NULL AND milestone.status != 'archived'`)
    .bind(id, payload.milestoneId, valid.value.title, payload.description || '', payload.status || 'planned', payload.priority || 'normal', payload.assignee || '', payload.plannedAt ?? null, payload.startAt ?? null, payload.targetAt ?? null, payload.completedAt ?? null, payload.note || '', payload.blockedReason || '', Number(payload.sortOrder || 0), now)
    .run()
  if (!changes(result)) {
    const unavailableMilestone = await validateMilestoneReference(db, payload.milestoneId)
    return unavailableMilestone || resultError('WRITE_CONFLICT')
  }
  return resultOk(id)
}

export async function createDecision(db, payload, context = {}) {
  const title = String(payload?.title || '').trim()
  if (!title) return resultError('TITLE_REQUIRED')
  const status = payload.status || 'open'
  if (!['open', 'decided', 'superseded'].includes(status)) return resultError('INVALID_STATUS')
  if (status === 'decided' && !String(payload.conclusion || '').trim()) return resultError('CONCLUSION_REQUIRED')
  const invalidReference = await validateDecisionReferences(db, payload)
  if (invalidReference) return invalidReference
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
  const targetCondition = EVENT_TARGET_CONDITIONS[payload.entityType]
  if (!targetCondition || !await eventTargetExists(db, payload.entityType, payload.entityId)) return resultError('NOT_FOUND')
  const id = payload.id || newId('event', context)
  const now = nowFrom(context)
  const result = await db.prepare(`INSERT INTO planning_events
    (id, entity_type, entity_id, event_type, title, description, details_json, source, source_key, occurred_at, created_at)
    SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11
    WHERE ${targetCondition}`)
    .bind(id, payload.entityType, payload.entityId, payload.eventType || 'note', title, payload.description || '', JSON.stringify(payload.details || {}), payload.source || context.source || 'manual', payload.sourceKey ?? null, payload.occurredAt ?? now, now)
    .run()
  return changes(result) ? resultOk(id) : resultError('NOT_FOUND')
}

async function dependencyEndpointExists(db, type, id) {
  if (type === 'milestone') return Boolean(await first(db, "SELECT id FROM planning_milestones WHERE id = ?1 AND archived_at IS NULL AND status != 'archived'", [id]))
  if (type === 'task') return Boolean(await first(db, "SELECT id FROM planning_tasks WHERE id = ?1 AND archived_at IS NULL AND status != 'archived'", [id]))
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
  const endpointTable = payload.fromType === 'milestone' ? 'planning_milestones' : 'planning_tasks'
  const result = await db.prepare(`WITH RECURSIVE reachable(node) AS (
      SELECT dependency.to_id
      FROM planning_dependencies dependency
      WHERE dependency.from_type = ?2 AND dependency.to_type = ?2
        AND dependency.from_id = ?5
        AND dependency.archived_at IS NULL AND dependency.status = 'active'
      UNION
      SELECT dependency.to_id
      FROM planning_dependencies dependency
      JOIN reachable ON dependency.from_id = reachable.node
      WHERE dependency.from_type = ?2 AND dependency.to_type = ?2
        AND dependency.archived_at IS NULL AND dependency.status = 'active'
    )
    INSERT OR IGNORE INTO planning_dependencies
    (id, from_type, from_id, to_type, to_id, dependency_type, description, status, archived_at, created_at, updated_at)
    SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, 'active', NULL, ?8, ?8
    WHERE EXISTS (
      SELECT 1 FROM ${endpointTable}
      WHERE id = ?3 AND archived_at IS NULL AND status != 'archived'
    )
      AND EXISTS (
        SELECT 1 FROM ${endpointTable}
        WHERE id = ?5 AND archived_at IS NULL AND status != 'archived'
      )
      AND NOT EXISTS (SELECT 1 FROM reachable WHERE node = ?3)`)
    .bind(id, payload.fromType, payload.fromId, payload.toType, payload.toId, payload.dependencyType || 'depends_on', payload.description || '', now)
    .run()
  if (changes(result)) return resultOk(id)
  const [currentFromExists, currentToExists] = await Promise.all([
    dependencyEndpointExists(db, payload.fromType, payload.fromId),
    dependencyEndpointExists(db, payload.toType, payload.toId),
  ])
  if (!currentFromExists || !currentToExists) return resultError('DEPENDENCY_ENDPOINT_NOT_FOUND')
  const currentEdges = (await all(db, "SELECT * FROM planning_dependencies WHERE archived_at IS NULL AND status = 'active'"))
    .map(rowToDependency)
  return wouldCreateDependencyCycle(currentEdges, payload)
    ? resultError('DEPENDENCY_CYCLE')
    : resultError('WRITE_CONFLICT')
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
  if (changesToRead.status === 'archived' && !Object.hasOwn(changesToRead, 'archivedAt')) {
    changesToRead = { ...changesToRead, archivedAt: nowFrom(context) }
  }
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
  if (changesToRead.planningStatus === 'archived' && !Object.hasOwn(changesToRead, 'archivedAt')) {
    changesToRead = { ...changesToRead, archivedAt: nowFrom(context) }
  }
  if (changesToRead.planningStatus && !['active', 'paused', 'archived'].includes(changesToRead.planningStatus)) return resultError('INVALID_STATUS')
  const candidate = { ...rowToProjectProfile(before), ...changesToRead }
  if (candidate.startAt != null && candidate.targetAt != null && Number(candidate.targetAt) < Number(candidate.startAt)) {
    return resultError('TARGET_BEFORE_START')
  }
  const archiving = changesToRead.planningStatus === 'archived'
  const invalidProject = await validatePortfolioProjectReference(db, candidate.projectId)
  if (invalidProject) return invalidProject
  const invalidDirection = await validateDirectionReference(db, candidate.directionId, { allowArchived: archiving })
  if (invalidDirection) return invalidDirection
  const values = Object.hasOwn(changesToRead, 'isFocus')
    ? { ...changesToRead, isFocus: changesToRead.isFocus ? 1 : 0 }
    : changesToRead
  const selected = selectChanges(values, {
    projectId: 'project_id', directionId: 'direction_id', summary: 'summary', planningStatus: 'planning_status',
    isFocus: 'is_focus', startAt: 'start_at', targetAt: 'target_at', sortOrder: 'sort_order', archivedAt: 'archived_at',
  })
  if (!Object.keys(selected).length) return resultError('NO_CHANGES')
  const updatedAt = Math.max(nowFrom(context), Number(before.updated_at || 0) + 1)
  const statement = versionedUpdateStatement(
    db,
    'planning_project_profiles',
    id,
    selected,
    updatedAt,
    before.updated_at,
    { parentGuard: profileParentGuard(candidate, archiving) },
  )
  const result = await statement.run()
  if (changes(result)) return resultOk(id)
  if (!await first(db, 'SELECT id FROM planning_project_profiles WHERE id = ?1', [id])) return resultError('NOT_FOUND')
  const currentProject = await validatePortfolioProjectReference(db, candidate.projectId)
  if (currentProject) return currentProject
  const currentDirection = await validateDirectionReference(db, candidate.directionId, { allowArchived: archiving })
  return currentDirection || resultError('WRITE_CONFLICT')
}

function profileParentGuard(candidate, allowArchived) {
  return {
    binds: [candidate.projectId, candidate.directionId],
    sql(index) {
      const live = allowArchived ? '' : " AND archived_at IS NULL AND status != 'archived'"
      return ` AND EXISTS (SELECT 1 FROM portfolio_projects WHERE id = ?${index})
        AND EXISTS (SELECT 1 FROM planning_directions WHERE id = ?${index + 1}${live})`
    },
  }
}

function milestoneParentGuard(candidate, allowArchived) {
  return {
    binds: [candidate.directionId, candidate.projectId],
    sql(index) {
      const profileLive = allowArchived ? '' : " AND profile.archived_at IS NULL AND profile.planning_status != 'archived'"
      const directionLive = allowArchived ? '' : " AND direction.archived_at IS NULL AND direction.status != 'archived'"
      return ` AND EXISTS (
        SELECT 1 FROM planning_project_profiles profile
        JOIN planning_directions direction ON direction.id = profile.direction_id
        WHERE profile.direction_id = ?${index} AND profile.project_id = ?${index + 1}
          ${profileLive}${directionLive}
      )`
    },
  }
}

function taskParentGuard(candidate, allowArchived) {
  return {
    binds: [candidate.milestoneId],
    sql(index) {
      const live = allowArchived ? '' : " AND archived_at IS NULL AND status != 'archived'"
      return ` AND EXISTS (SELECT 1 FROM planning_milestones WHERE id = ?${index}${live})`
    },
  }
}

function versionedUpdateStatement(db, table, id, changesToWrite, updatedAt, expectedUpdatedAt, options = {}) {
  const entries = Object.entries(changesToWrite)
  const assignments = entries.map(([column], index) => `${column} = ?${index + 1}`)
  assignments.push(`updated_at = ?${entries.length + 1}`)
  const idIndex = entries.length + 2
  const versionIndex = entries.length + 3
  const milestoneGuard = options.guardOpenTasks
    ? ` AND NOT EXISTS (
          SELECT 1 FROM planning_tasks
          WHERE milestone_id = ?${idIndex}
            AND status NOT IN ('done', 'cancelled', 'archived')
            AND archived_at IS NULL
        )`
    : ''
  const parentIndex = entries.length + 4
  const parentGuard = options.parentGuard ? options.parentGuard.sql(parentIndex) : ''
  const parentBinds = options.parentGuard?.binds || []
  return db.prepare(`UPDATE ${table}
    SET ${assignments.join(', ')}
    WHERE id = ?${idIndex} AND updated_at = ?${versionIndex}${milestoneGuard}${parentGuard}`)
    .bind(...entries.map(([, value]) => value), updatedAt, id, expectedUpdatedAt, ...parentBinds)
}

function transitionEventStatement(db, event, context, updatedAt, status) {
  const id = newId('event', context)
  const sourceKey = `transition:${event.entityType}:${event.entityId}:${event.eventType}:${updatedAt}`
  const table = event.entityType === 'milestone' ? 'planning_milestones' : 'planning_tasks'
  return db.prepare(`INSERT INTO planning_events
    (id, entity_type, entity_id, event_type, title, description, details_json, source, source_key, occurred_at, created_at)
    SELECT ?1, ?2, ?3, ?4, ?5, '', '{}', 'system', ?6, ?7, ?7
    WHERE changes() > 0
      AND EXISTS (SELECT 1 FROM ${table} WHERE id = ?8 AND updated_at = ?9 AND status = ?10)`)
    .bind(id, event.entityType, event.entityId, event.eventType, event.title, sourceKey, event.occurredAt, event.entityId, updatedAt, status)
}

async function updateWorkItem(db, entity, table, mapper, id, changesToRead, columns, context) {
  const beforeRow = await first(db, `SELECT * FROM ${table} WHERE id = ?1`, [id])
  if (!beforeRow) return resultError('NOT_FOUND')
  if (changesToRead.status === 'archived' && !Object.hasOwn(changesToRead, 'archivedAt')) {
    changesToRead = { ...changesToRead, archivedAt: nowFrom(context) }
  }
  const before = mapper(beforeRow)
  const candidate = { ...before, ...changesToRead, id: before.id }
  const valid = validatePlanningPayload(entity, candidate)
  if (!valid.ok) return valid
  const archiving = changesToRead.status === 'archived'
  const invalidParent = entity === 'milestone'
    ? await validateProfileReference(db, candidate.directionId, candidate.projectId, { allowArchived: archiving })
    : await validateMilestoneReference(db, candidate.milestoneId, { allowArchived: archiving })
  if (invalidParent) return invalidParent

  const selected = selectChanges(changesToRead, columns)
  if (!Object.keys(selected).length) return resultError('NO_CHANGES')
  const updatedAt = Math.max(nowFrom(context), Number(before.updatedAt || 0) + 1)
  const completingMilestone = entity === 'milestone' && candidate.status === 'completed' && before.status !== 'completed'
  const parentGuard = entity === 'milestone'
    ? milestoneParentGuard(candidate, archiving)
    : taskParentGuard(candidate, archiving)
  const statement = versionedUpdateStatement(db, table, id, selected, updatedAt, before.updatedAt, {
    guardOpenTasks: completingMilestone,
    parentGuard,
  })
  const event = eventForTransition(entity, before, candidate, updatedAt)
  if (event) {
    const results = await db.batch([statement, transitionEventStatement(db, event, context, updatedAt, candidate.status)])
    if (!changes(results?.[0])) {
      const current = await first(db, `SELECT id FROM ${table} WHERE id = ?1`, [id])
      if (!current) return resultError('NOT_FOUND')
      const currentParent = entity === 'milestone'
        ? await validateProfileReference(db, candidate.directionId, candidate.projectId, { allowArchived: archiving })
        : await validateMilestoneReference(db, candidate.milestoneId, { allowArchived: archiving })
      if (currentParent) return currentParent
      if (completingMilestone) {
        const openTasks = await all(db, `SELECT id FROM planning_tasks
          WHERE milestone_id = ?1 AND status NOT IN ('done', 'cancelled', 'archived') AND archived_at IS NULL
          ORDER BY created_at ASC, id ASC`, [id])
        if (openTasks.length) return resultError('MILESTONE_HAS_OPEN_TASKS', { openTaskIds: openTasks.map((row) => row.id) })
      }
      return resultError('WRITE_CONFLICT')
    }
    if (!changes(results?.[1])) return resultError('EVENT_WRITE_FAILED')
    return resultOk(id, { event })
  }
  const result = await statement.run()
  if (changes(result)) return resultOk(id)
  if (!await first(db, `SELECT id FROM ${table} WHERE id = ?1`, [id])) return resultError('NOT_FOUND')
  const currentParent = entity === 'milestone'
    ? await validateProfileReference(db, candidate.directionId, candidate.projectId, { allowArchived: archiving })
    : await validateMilestoneReference(db, candidate.milestoneId, { allowArchived: archiving })
  return currentParent || resultError('WRITE_CONFLICT')
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

const PRISTINE_DELETE_SQL = {
  direction: `DELETE FROM planning_directions
    WHERE id = ?1
      AND NOT EXISTS (SELECT 1 FROM planning_project_profiles WHERE direction_id = planning_directions.id)
      AND NOT EXISTS (SELECT 1 FROM planning_milestones WHERE direction_id = planning_directions.id)
      AND NOT EXISTS (SELECT 1 FROM planning_decisions WHERE direction_id = planning_directions.id)
      AND NOT EXISTS (SELECT 1 FROM planning_events WHERE entity_type = 'direction' AND entity_id = planning_directions.id)`,
  'project-profile': `DELETE FROM planning_project_profiles
    WHERE id = ?1
      AND NOT EXISTS (SELECT 1 FROM planning_milestones WHERE project_id = planning_project_profiles.project_id)
      AND NOT EXISTS (SELECT 1 FROM planning_decisions WHERE project_id = planning_project_profiles.project_id)
      AND NOT EXISTS (
        SELECT 1 FROM planning_events
        WHERE (entity_type = 'project-profile' AND entity_id = planning_project_profiles.id)
           OR (entity_type = 'project' AND entity_id = planning_project_profiles.project_id)
      )`,
  milestone: `DELETE FROM planning_milestones
    WHERE id = ?1
      AND NOT EXISTS (SELECT 1 FROM planning_tasks WHERE milestone_id = planning_milestones.id)
      AND NOT EXISTS (SELECT 1 FROM planning_decisions WHERE milestone_id = planning_milestones.id)
      AND NOT EXISTS (
        SELECT 1 FROM planning_dependencies
        WHERE (from_type = 'milestone' AND from_id = planning_milestones.id)
           OR (to_type = 'milestone' AND to_id = planning_milestones.id)
      )
      AND NOT EXISTS (SELECT 1 FROM planning_events WHERE entity_type = 'milestone' AND entity_id = planning_milestones.id)`,
  task: `DELETE FROM planning_tasks
    WHERE id = ?1
      AND NOT EXISTS (
        SELECT 1 FROM planning_dependencies
        WHERE (from_type = 'task' AND from_id = planning_tasks.id)
           OR (to_type = 'task' AND to_id = planning_tasks.id)
      )
      AND NOT EXISTS (SELECT 1 FROM planning_events WHERE entity_type = 'task' AND entity_id = planning_tasks.id)`,
  decision: `DELETE FROM planning_decisions
    WHERE id = ?1
      AND NOT EXISTS (SELECT 1 FROM planning_events WHERE entity_type = 'decision' AND entity_id = planning_decisions.id)`,
  dependency: `DELETE FROM planning_dependencies
    WHERE id = ?1
      AND NOT EXISTS (SELECT 1 FROM planning_events WHERE entity_type = 'dependency' AND entity_id = planning_dependencies.id)`,
}

export async function deletePristinePlanningEntity(db, entity, id) {
  const tableByEntity = {
    direction: 'planning_directions', 'project-profile': 'planning_project_profiles', milestone: 'planning_milestones',
    task: 'planning_tasks', decision: 'planning_decisions', dependency: 'planning_dependencies',
  }
  const table = tableByEntity[entity]
  const sql = PRISTINE_DELETE_SQL[entity]
  if (!table || !sql) return resultError('INVALID_ENTITY')
  const result = await db.prepare(sql).bind(id).run()
  if (changes(result)) return resultOk(id)
  return await first(db, `SELECT id FROM ${table} WHERE id = ?1`, [id])
    ? resultError('ENTITY_REFERENCED', { archiveAllowed: true })
    : resultError('NOT_FOUND')
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
