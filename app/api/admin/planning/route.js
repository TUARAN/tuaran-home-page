import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { WINDOWS } from '../../../../lib/planning/constants.mjs'
import {
  createDecision,
  createDependency,
  createDirection,
  createManualEvent,
  createMilestone,
  createTask,
  deletePristinePlanningEntity,
  readPlanningSnapshot,
  updateDirection,
  updateMilestone,
  updateProjectProfile,
  updateTask,
  upsertProjectProfile,
} from '../../../../lib/planning/repository.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const POST_ACTIONS = {
  'create-direction': createDirection,
  'upsert-project-profile': upsertProjectProfile,
  'create-milestone': createMilestone,
  'create-task': createTask,
  'create-decision': createDecision,
  'create-event': createManualEvent,
  'create-dependency': createDependency,
}

const PATCH_ACTIONS = {
  direction: updateDirection,
  'project-profile': updateProjectProfile,
  milestone: updateMilestone,
  task: updateTask,
}

const VALIDATION_ERRORS = new Set([
  'TITLE_REQUIRED',
  'MILESTONE_REQUIRED',
  'PROJECT_REQUIRED',
  'DIRECTION_REQUIRED',
  'TARGET_BEFORE_START',
  'INVALID_STATUS',
  'CONCLUSION_REQUIRED',
  'ENTITY_REQUIRED',
  'DEPENDENCY_TYPE_MISMATCH',
  'INVALID_DEPENDENCY_ENTITY_TYPE',
  'DEPENDENCY_ENDPOINT_REQUIRED',
  'DEPENDENCY_SELF_LINK',
  'NO_CHANGES',
  'INVALID_ENTITY',
])

const NOT_FOUND_ERRORS = new Set([
  'NOT_FOUND',
  'PROJECT_NOT_FOUND',
  'DIRECTION_NOT_FOUND',
  'PROJECT_PROFILE_NOT_FOUND',
  'MILESTONE_NOT_FOUND',
  'DEPENDENCY_ENDPOINT_NOT_FOUND',
])

const CONFLICT_ERRORS = new Set([
  'WRITE_CONFLICT',
  'DIRECTION_ARCHIVED',
  'PROJECT_PROFILE_ARCHIVED',
  'MILESTONE_ARCHIVED',
  'MILESTONE_HAS_OPEN_TASKS',
  'DEPENDENCY_CYCLE',
  'ENTITY_REFERENCED',
])

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

async function readJson(req) {
  try {
    const value = await req.json()
    return isObject(value) ? { value } : { response: Response.json({ error: 'INVALID_JSON' }, { status: 400 }) }
  } catch {
    return { response: Response.json({ error: 'INVALID_JSON' }, { status: 400 }) }
  }
}

function repositoryStatus(error) {
  if (VALIDATION_ERRORS.has(error)) return 400
  if (NOT_FOUND_ERRORS.has(error)) return 404
  if (CONFLICT_ERRORS.has(error)) return 409
  return 500
}

function repositoryResponse(result) {
  if (result?.ok) return Response.json(result)
  const { ok: _ok, ...body } = result || { error: 'WRITE_FAILED' }
  return Response.json(body, { status: repositoryStatus(body.error) })
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const requestedWindow = new URL(req.url).searchParams.get('window')
  const window = requestedWindow ?? 'month'
  if (!WINDOWS.includes(window)) return Response.json({ error: 'INVALID_WINDOW' }, { status: 400 })

  try {
    const snapshot = await readPlanningSnapshot(db, { window })
    return Response.json({ status: 'ok', ...snapshot })
  } catch {
    return Response.json({ error: 'PLANNING_READ_FAILED' }, { status: 500 })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const parsed = await readJson(req)
  if (parsed.response) return parsed.response

  const action = typeof parsed.value.action === 'string' ? parsed.value.action : ''
  const handler = POST_ACTIONS[action]
  if (!handler) return Response.json({ error: 'INVALID_ACTION' }, { status: 400 })

  const payload = isObject(parsed.value.payload) ? parsed.value.payload : parsed.value
  if (action === 'create-decision' && payload?.status === 'decided' && !String(payload.conclusion || '').trim()) {
    return Response.json({ error: 'CONCLUSION_REQUIRED' }, { status: 400 })
  }

  try {
    return repositoryResponse(await handler(db, payload))
  } catch {
    return Response.json({ error: 'PLANNING_WRITE_FAILED' }, { status: 500 })
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const parsed = await readJson(req)
  if (parsed.response) return parsed.response

  const entity = typeof parsed.value.entity === 'string' ? parsed.value.entity : ''
  const id = typeof parsed.value.id === 'string' ? parsed.value.id.trim() : ''
  const changes = parsed.value.changes
  const handler = PATCH_ACTIONS[entity]
  if (!handler) return Response.json({ error: 'INVALID_ENTITY' }, { status: 400 })
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  if (!isObject(changes)) return Response.json({ error: 'INVALID_CHANGES' }, { status: 400 })

  try {
    return repositoryResponse(await handler(db, id, changes))
  } catch {
    return Response.json({ error: 'PLANNING_WRITE_FAILED' }, { status: 500 })
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const url = new URL(req.url)
  const entity = url.searchParams.get('entity') || ''
  const id = (url.searchParams.get('id') || '').trim()
  if (!entity) return Response.json({ error: 'INVALID_ENTITY' }, { status: 400 })
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

  try {
    return repositoryResponse(await deletePristinePlanningEntity(db, entity, id))
  } catch {
    return Response.json({ error: 'PLANNING_WRITE_FAILED' }, { status: 500 })
  }
}
