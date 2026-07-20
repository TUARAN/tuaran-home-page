export const PLANNING_STATUS_META = {
  planned: { label: '待规划', tone: 'neutral' },
  active: { label: '进行中', tone: 'info' },
  paused: { label: '已暂停', tone: 'warning' },
  completed: { label: '已完成', tone: 'success' },
  archived: { label: '已归档', tone: 'neutral' },
  blocked: { label: '受阻', tone: 'danger' },
  cancelled: { label: '已取消', tone: 'neutral' },
  doing: { label: '处理中', tone: 'info' },
  done: { label: '已完成', tone: 'success' },
  open: { label: '待决策', tone: 'warning' },
  decided: { label: '已决策', tone: 'success' },
  superseded: { label: '已替代', tone: 'neutral' },
}

export const PLANNING_TABS = [
  { id: 'overview', label: '三时态总览' },
  { id: 'roadmap', label: '组合路线图' },
  { id: 'tree', label: '规划树' },
  { id: 'history', label: '历史与决策' },
]

export const PLANNING_WINDOWS = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'quarter', label: '本季度' },
]

export function formatPlanningDate(value) {
  if (value == null || value === '') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date)
}

const DAY_MS = 86400000
const TERMINAL_STATUSES = new Set(['completed', 'done', 'cancelled', 'archived'])
const DATE_FIELDS = {
  direction: ['startAt', 'targetAt', 'completedAt'],
  'project-profile': ['startAt', 'targetAt'],
  milestone: ['startAt', 'targetAt', 'completedAt'],
  task: ['plannedAt', 'startAt', 'targetAt', 'completedAt'],
  event: ['occurredAt'],
  decision: ['decidedAt'],
}
const TEXT_FIELDS = {
  direction: ['title', 'description', 'northStar', 'status', 'priority'],
  'project-profile': ['projectId', 'directionId', 'summary', 'planningStatus'],
  milestone: ['directionId', 'projectId', 'title', 'description', 'successCriteria', 'status', 'priority'],
  task: ['milestoneId', 'title', 'description', 'status', 'priority', 'assignee', 'note', 'blockedReason'],
  event: ['entityType', 'entityId', 'eventType', 'title', 'description'],
  decision: ['directionId', 'projectId', 'milestoneId', 'title', 'context', 'conclusion', 'rationale', 'impact', 'status'],
  dependency: ['fromType', 'fromId', 'toType', 'toId', 'dependencyType', 'description'],
}
const HIERARCHY_FIELDS = {
  task: ['directionId', 'projectId'],
  event: ['directionId', 'projectId', 'milestoneId'],
}
const FORM_DEFAULTS = {
  direction: { status: 'planned', priority: 'normal' },
  'project-profile': { planningStatus: 'active', isFocus: false },
  milestone: { status: 'planned', priority: 'normal' },
  task: { status: 'planned', priority: 'normal' },
  event: { entityType: 'milestone', eventType: 'note' },
  decision: { status: 'open' },
  dependency: { fromType: 'milestone', toType: 'milestone', dependencyType: 'depends_on' },
}

function itemKey(item) {
  return `${item?.entityType || 'item'}:${item?.id || ''}`
}

function createSnapshotIndex(snapshot = {}) {
  const hierarchy = snapshot.hierarchy || {}
  const directions = new Map([...(hierarchy.directions || []), ...(snapshot.directions || [])].map((item) => [item.id, item]))
  const projects = new Map()
  for (const item of [...(hierarchy.projects || []), ...(snapshot.projects || [])]) {
    projects.set(item.id, item)
    projects.set(item.projectId, item)
  }
  const milestones = new Map([...(hierarchy.milestones || []), ...(snapshot.milestones || [])].map((item) => [item.id, item]))
  const tasks = new Map([...(hierarchy.tasks || []), ...(snapshot.tasks || [])].map((item) => [item.id, item]))
  const decisions = new Map((snapshot.decisions || []).map((item) => [item.id, item]))
  return { directions, projects, milestones, tasks, decisions }
}

function ancestryFor(item, index) {
  if (!item) return {}
  if (item.entityType === 'direction') return { directionId: item.entityId || item.id }
  if (item.entityType === 'project' || item.entityType === 'project-profile') {
    const project = index.projects.get(item.entityId || item.id) || item
    return { directionId: project.directionId, projectId: project.projectId || item.entityId }
  }
  if (item.entityType === 'milestone') {
    const milestone = index.milestones.get(item.entityId || item.id) || item
    return { directionId: milestone.directionId, projectId: milestone.projectId, milestoneId: milestone.id }
  }
  if (item.entityType === 'task') {
    const task = index.tasks.get(item.entityId || item.id) || item
    const milestone = index.milestones.get(task.milestoneId)
    return {
      directionId: milestone?.directionId,
      projectId: milestone?.projectId,
      milestoneId: task.milestoneId,
    }
  }
  if (item.entityType === 'decision') {
    const decision = index.decisions.get(item.entityId || item.id) || item
    return {
      directionId: decision.directionId,
      projectId: decision.projectId,
      milestoneId: decision.milestoneId,
    }
  }
  return {
    directionId: item.directionId,
    projectId: item.projectId,
    milestoneId: item.milestoneId,
  }
}

export function planningAncestryFor(item, snapshot = {}) {
  return ancestryFor(item, createSnapshotIndex(snapshot))
}

function enrichOverviewItem(item, index) {
  const ancestry = ancestryFor(item, index)
  const project = index.projects.get(ancestry.projectId)
  return {
    ...item,
    ...ancestry,
    projectName: project?.name || project?.projectId || ancestry.projectId || '',
  }
}

function matchesDirection(item, directionId, index) {
  if (!directionId) return true
  return ancestryFor(item, index).directionId === directionId
}

function uniqueVisible(items, seen, index) {
  const result = []
  for (const item of items) {
    const key = itemKey(item)
    if (!item?.id || seen.has(key)) continue
    seen.add(key)
    result.push(enrichOverviewItem(item, index))
  }
  return result
}

export function buildOverviewModel(snapshot = {}, directionId = '') {
  const index = createSnapshotIndex(snapshot)
  const generatedAt = Number(snapshot.generatedAt)
  const now = Number.isFinite(generatedAt) ? generatedAt : Date.now()
  const selectedDirection = directionId ? index.directions.get(directionId) : null
  const visible = (items) => (items || []).filter((item) => matchesDirection(item, directionId, index))
  const seen = new Set()
  const past = uniqueVisible(visible(snapshot.events), seen, index)
  const present = uniqueVisible(visible(snapshot.triState?.present), seen, index)
  const futureCandidates = uniqueVisible(visible(snapshot.triState?.future), seen, index)
  const unscheduledCandidates = uniqueVisible(visible(snapshot.triState?.unscheduled), seen, index)
  const future = { near: [], mid: [], long: [], unscheduled: [] }

  for (const item of futureCandidates) {
    if (item.targetAt == null) {
      future.unscheduled.push(item)
      continue
    }
    const days = (Number(item.targetAt) - now) / DAY_MS
    if (days <= 30) future.near.push(item)
    else if (days <= 90) future.mid.push(item)
    else future.long.push(item)
  }
  future.unscheduled.push(...unscheduledCandidates)

  const planningItems = visible([
    ...(snapshot.triState?.past || []),
    ...(snapshot.triState?.present || []),
    ...(snapshot.triState?.future || []),
    ...(snapshot.triState?.unscheduled || []),
  ])
  const uniquePlanningItems = [...new Map(planningItems.map((item) => [itemKey(item), item])).values()]
  const projects = visible(snapshot.projects)
  const decisions = visible(snapshot.decisions)
  const stats = directionId ? {
    completed: uniquePlanningItems.filter((item) => item.status === 'completed' || item.status === 'done').length,
    focus: projects.filter((item) => item.isFocus).length,
    blocked: uniquePlanningItems.filter((item) => item.status === 'blocked').length,
    overdue: uniquePlanningItems.filter((item) => !TERMINAL_STATUSES.has(item.status) && item.targetAt != null && Number(item.targetAt) < now).length,
    decisions: decisions.filter((item) => item.status === 'open').length,
  } : {
    completed: Number(snapshot.stats?.completed || 0),
    focus: Number(snapshot.stats?.focus || 0),
    blocked: Number(snapshot.stats?.blocked || 0),
    overdue: Number(snapshot.stats?.overdue || 0),
    decisions: Number(snapshot.stats?.decisions || 0),
  }

  return {
    northStar: selectedDirection?.northStar || (directionId ? '' : '全部方向的规划节奏与风险'),
    past,
    present,
    future,
    stats,
  }
}

function isArchived(item) {
  return item?.archivedAt != null || item?.status === 'archived' || item?.planningStatus === 'archived'
}

function endpointProjectId(type, id, index) {
  if (type === 'milestone') return index.milestones.get(id)?.projectId
  if (type === 'task') {
    const task = index.tasks.get(id)
    return index.milestones.get(task?.milestoneId)?.projectId
  }
  return null
}

function isRiskyWorkItem(item, now) {
  return Boolean(item && (
    item.status === 'blocked'
    || (!TERMINAL_STATUSES.has(item.status) && item.targetAt != null && Number(item.targetAt) < now)
  ))
}

export function buildRoadmapModel(snapshot = {}) {
  const index = createSnapshotIndex(snapshot)
  const generatedAt = Number(snapshot.generatedAt)
  const now = Number.isFinite(generatedAt) ? generatedAt : Date.now()
  const currentDate = new Date(now)
  const quarterStart = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1).getTime()
  const quarterEnd = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 1).getTime() - 1
  const activeDependencies = (snapshot.dependencies || []).filter((item) => item.status == null || item.status === 'active')

  const rows = (snapshot.projects || []).filter((project) => !isArchived(project)).map((project) => {
    const projectMilestones = (snapshot.milestones || []).filter((item) => item.projectId === project.projectId && !isArchived(item))
    const columns = { past: [], current: [], future: [], unscheduled: [] }
    for (const milestone of projectMilestones) {
      if (TERMINAL_STATUSES.has(milestone.status)) columns.past.push(milestone)
      else if (milestone.targetAt == null) columns.unscheduled.push(milestone)
      else if (milestone.status === 'active' || milestone.status === 'blocked' || Number(milestone.targetAt) <= quarterEnd) columns.current.push(milestone)
      else columns.future.push(milestone)
    }

    const relatedDependencies = activeDependencies.filter((dependency) => (
      endpointProjectId(dependency.fromType, dependency.fromId, index) === project.projectId
      || endpointProjectId(dependency.toType, dependency.toId, index) === project.projectId
    ))
    const hasUpstreamRisk = activeDependencies.some((dependency) => {
      if (endpointProjectId(dependency.fromType, dependency.fromId, index) !== project.projectId) return false
      const upstream = dependency.toType === 'milestone'
        ? index.milestones.get(dependency.toId)
        : index.tasks.get(dependency.toId)
      return isRiskyWorkItem(upstream, now)
    })

    return {
      ...project,
      columns,
      activeDependencyCount: relatedDependencies.length,
      hasUpstreamRisk,
    }
  })

  return { generatedAt: now, quarterStart, quarterEnd, rows }
}

export function buildPlanningTree(snapshot = {}, options = {}) {
  const showArchived = Boolean(options.showArchived)
  const source = showArchived && snapshot.hierarchy ? snapshot.hierarchy : snapshot
  const visible = (item) => showArchived || !isArchived(item)
  const tasksByMilestone = new Map()
  for (const task of source.tasks || []) {
    if (!visible(task)) continue
    tasksByMilestone.set(task.milestoneId, [...(tasksByMilestone.get(task.milestoneId) || []), {
      ...task,
      entityType: 'task',
      children: [],
    }])
  }
  const milestonesByProject = new Map()
  for (const milestone of source.milestones || []) {
    if (!visible(milestone)) continue
    milestonesByProject.set(milestone.projectId, [...(milestonesByProject.get(milestone.projectId) || []), {
      ...milestone,
      entityType: 'milestone',
      children: tasksByMilestone.get(milestone.id) || [],
    }])
  }
  const projectsByDirection = new Map()
  for (const project of source.projects || []) {
    if (!visible(project)) continue
    projectsByDirection.set(project.directionId, [...(projectsByDirection.get(project.directionId) || []), {
      ...project,
      title: project.name || project.projectId,
      status: project.planningStatus,
      entityType: 'project-profile',
      children: milestonesByProject.get(project.projectId) || [],
    }])
  }
  return (source.directions || []).filter(visible).map((direction) => ({
    ...direction,
    entityType: 'direction',
    children: projectsByDirection.get(direction.id) || [],
  }))
}

function filterDateValue(value, endOfDay = false) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = dateInputToTimestamp(value)
  return parsed == null ? null : parsed + (endOfDay ? DAY_MS - 1 : 0)
}

export function buildPlanningHistory(snapshot = {}, filters = {}) {
  const index = createSnapshotIndex(snapshot)
  const from = filterDateValue(filters.from)
  const to = filterDateValue(filters.to, true)
  const events = (snapshot.events || []).map((item) => ({
    ...item,
    kind: 'event',
    timelineAt: Number(item.occurredAt ?? item.createdAt ?? 0),
  }))
  const decisions = (snapshot.decisions || []).map((item) => ({
    ...item,
    entityType: 'decision',
    eventType: 'decision',
    kind: 'decision',
    timelineAt: Number(item.decidedAt ?? item.updatedAt ?? item.createdAt ?? 0),
  }))

  return [...events, ...decisions]
    .map((item) => {
      const ancestry = ancestryFor(item, index)
      const project = index.projects.get(ancestry.projectId)
      return { ...item, ...ancestry, projectName: project?.name || project?.projectId || '' }
    })
    .filter((item) => !filters.directionId || item.directionId === filters.directionId)
    .filter((item) => !filters.projectId || item.projectId === filters.projectId)
    .filter((item) => !filters.type || filters.type === 'all' || (
      filters.type === 'event' ? item.kind === 'event' : item.eventType === filters.type
    ))
    .filter((item) => from == null || item.timelineAt >= from)
    .filter((item) => to == null || item.timelineAt <= to)
    .sort((left, right) => right.timelineAt - left.timelineAt)
}

export function timestampToDateInput(value) {
  if (value == null || value === '') return ''
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateInputToTimestamp(value) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  if (!match) return null
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date.getTime()
}

export function buildInitialPlanningForm(entity, initialValue = {}, context = {}, snapshot = {}) {
  const milestone = (snapshot.milestones || []).find((item) => item.id === (context.milestoneId || initialValue.milestoneId))
  const projectId = milestone?.projectId || context.projectId || initialValue.projectId
  const project = (snapshot.projects || []).find((item) => item.projectId === projectId || item.id === projectId)
  const contextualTarget = entity === 'event' && !context.entityId
    ? context.milestoneId
      ? { entityType: 'milestone', entityId: context.milestoneId }
      : context.projectId
        ? { entityType: 'project', entityId: context.projectId }
        : context.directionId
          ? { entityType: 'direction', entityId: context.directionId }
          : {}
    : {}
  const merged = {
    ...context,
    ...(project ? { directionId: project.directionId, projectId: project.projectId } : {}),
    ...(milestone ? {
      directionId: milestone.directionId,
      projectId: milestone.projectId,
      milestoneId: milestone.id,
    } : {}),
    ...contextualTarget,
    ...initialValue,
  }
  const result = {}
  for (const field of TEXT_FIELDS[entity] || []) result[field] = merged[field] ?? FORM_DEFAULTS[entity]?.[field] ?? ''
  for (const field of HIERARCHY_FIELDS[entity] || []) result[field] = merged[field] ?? ''
  for (const field of DATE_FIELDS[entity] || []) result[field] = timestampToDateInput(merged[field])
  if (entity === 'project-profile') result.isFocus = Boolean(merged.isFocus ?? FORM_DEFAULTS[entity].isFocus)
  if (entity === 'dependency' && !merged.toType) result.toType = result.fromType
  return result
}

export function buildPlanningPayload(entity, form = {}) {
  const result = {}
  for (const field of TEXT_FIELDS[entity] || []) {
    const value = String(form[field] ?? '')
    if (entity === 'decision' && ['directionId', 'projectId', 'milestoneId'].includes(field)) result[field] = value || null
    else result[field] = field === 'title' ? value.trim() : value
  }
  for (const field of DATE_FIELDS[entity] || []) result[field] = dateInputToTimestamp(form[field])
  if (entity === 'project-profile') result.isFocus = Boolean(form.isFocus)
  return result
}

export function validatePlanningEditor(entity, form = {}) {
  if (!['project-profile', 'dependency'].includes(entity) && !String(form.title || '').trim()) return '请填写标题。'
  if (entity === 'project-profile' && !form.projectId) return '请选择要关联的项目。'
  if (entity === 'project-profile' && !form.directionId) return '请选择所属方向。'
  if (entity === 'milestone' && !form.directionId) return '请选择所属方向。'
  if (entity === 'milestone' && !form.projectId) return '请选择所属项目。'
  if (entity === 'task' && !form.milestoneId) return '请选择所属里程碑。'
  if (entity === 'event' && (!form.entityType || !form.entityId)) return '请选择历史事件关联的实体。'
  if (entity === 'decision' && form.status === 'decided' && !String(form.conclusion || '').trim()) return '已决策记录必须填写最终结论。'
  if (entity === 'dependency' && (!form.fromId || !form.toId)) return '请选择依赖关系的两端。'
  if (entity === 'dependency' && form.fromType !== form.toType) return '依赖关系只能连接两个里程碑或两个任务。'
  if (entity === 'dependency' && !['milestone', 'task'].includes(form.fromType)) return '依赖关系只能连接里程碑或任务。'
  if (entity === 'dependency' && form.fromId === form.toId) return '不能让规划事项依赖自身。'
  for (const field of DATE_FIELDS[entity] || []) {
    if (form[field] && dateInputToTimestamp(form[field]) == null) return '请填写有效日期。'
  }
  if (form.startAt && form.targetAt && dateInputToTimestamp(form.targetAt) < dateInputToTimestamp(form.startAt)) return '目标日期不能早于开始日期。'
  return ''
}

async function parseResponseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function planningRequest(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: { Accept: 'application/json', ...(options.headers || {}) },
  })
  const payload = await parseResponseJson(response)

  if (!response.ok || payload?.error) {
    const error = new Error(payload?.message || payload?.error || `请求失败（${response.status}）`)
    error.code = payload?.error || 'PLANNING_REQUEST_FAILED'
    if (payload && typeof payload === 'object') Object.assign(error, payload)
    throw error
  }
  if (payload == null) {
    const error = new Error('规划中心返回了无法识别的数据。')
    error.code = 'PLANNING_INVALID_RESPONSE'
    throw error
  }
  return payload
}
