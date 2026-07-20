import {
  DEPENDENCY_ENTITY_TYPES,
  DIRECTION_STATUSES,
  MILESTONE_STATUSES,
  TASK_STATUSES,
  TERMINAL_STATUSES,
} from './constants.mjs'

const STATUS_BY_ENTITY = { direction: DIRECTION_STATUSES, milestone: MILESTONE_STATUSES, task: TASK_STATUSES }

const WINDOW_MS = { week: 7 * 86400000, month: 30 * 86400000, quarter: 90 * 86400000 }

export function classifyPlanningItem(item, now = Date.now(), window = 'month') {
  if (TERMINAL_STATUSES.has(item.status)) return 'past'
  if (item.status === 'doing' || item.status === 'active' || item.status === 'blocked') return 'present'
  if (item.targetAt != null && Number(item.targetAt) <= now + WINDOW_MS[window]) return 'present'
  return 'future'
}

export function validatePlanningPayload(entity, payload) {
  const title = String(payload?.title || '').trim()
  if (!title) return { ok: false, error: 'TITLE_REQUIRED' }
  if (entity === 'task' && !String(payload?.milestoneId || '').trim()) return { ok: false, error: 'MILESTONE_REQUIRED' }
  if (entity === 'milestone' && !String(payload?.projectId || '').trim()) return { ok: false, error: 'PROJECT_REQUIRED' }
  if (entity === 'milestone' && !String(payload?.directionId || '').trim()) return { ok: false, error: 'DIRECTION_REQUIRED' }
  if (payload?.startAt != null && payload?.targetAt != null && Number(payload.targetAt) < Number(payload.startAt)) {
    return { ok: false, error: 'TARGET_BEFORE_START' }
  }
  if (payload?.status && !STATUS_BY_ENTITY[entity]?.includes(payload.status)) return { ok: false, error: 'INVALID_STATUS' }
  return { ok: true, value: { ...payload, title } }
}

export function eventForTransition(entityType, before, after, occurredAt = Date.now()) {
  if (!before || before.status === after.status) return null
  const eventType = {
    active: 'started', doing: 'started', blocked: 'blocked', completed: 'completed', done: 'completed', cancelled: 'cancelled',
  }[after.status]
  if (!eventType) return null
  const verb = { started: '开始', blocked: '阻塞', completed: '完成', cancelled: '取消' }[eventType]
  const noun = entityType === 'milestone' ? '里程碑' : '任务'
  return { entityType, entityId: after.id, eventType, title: `${verb}${noun}：${after.title}`, occurredAt }
}

export function wouldCreateDependencyCycle(edges, candidate) {
  if (!DEPENDENCY_ENTITY_TYPES.includes(candidate.fromType) || candidate.fromType !== candidate.toType) return true
  const graph = new Map()
  for (const edge of [...edges, candidate]) {
    const key = `${edge.fromType}:${edge.fromId}`
    const target = `${edge.toType}:${edge.toId}`
    graph.set(key, [...(graph.get(key) || []), target])
  }
  const start = `${candidate.toType}:${candidate.toId}`
  const goal = `${candidate.fromType}:${candidate.fromId}`
  const queue = [start]
  const seen = new Set()
  while (queue.length) {
    const node = queue.shift()
    if (node === goal) return true
    if (seen.has(node)) continue
    seen.add(node)
    queue.push(...(graph.get(node) || []))
  }
  return false
}
