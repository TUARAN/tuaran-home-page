import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const originalEmitWarning = process.emitWarning
process.emitWarning = function filteredEmitWarning(warning, ...args) {
  if (args.some((value) => value === 'ExperimentalWarning')) return
  return originalEmitWarning.call(process, warning, ...args)
}
const { DatabaseSync } = await import('node:sqlite')

import {
  applyInitialImport,
  archivePlanningEntity,
  createDecision,
  createDependency,
  createManualEvent,
  createMilestone,
  createTask,
  deletePristinePlanningEntity,
  readPlanningSnapshot,
  updateMilestone,
  updateProjectProfile,
  updateTask,
  upsertProjectProfile,
} from '../../lib/planning/repository.mjs'

const portfolioMigration = await readFile(new URL('../../migrations/0020_portfolio_projects.sql', import.meta.url), 'utf8')
const planningMigration = await readFile(new URL('../../migrations/0053_planning_center.sql', import.meta.url), 'utf8')

class D1Statement {
  constructor(owner, sql) {
    this.owner = owner
    this.sql = sql
    this.binds = []
  }

  bind(...binds) {
    this.binds = binds
    return this
  }

  all() {
    return { results: this.owner.sqlite.prepare(this.sql).all(...this.binds) }
  }

  first() {
    return this.owner.sqlite.prepare(this.sql).get(...this.binds) || null
  }

  run() {
    this.owner.runHook?.(this)
    const result = this.owner.sqlite.prepare(this.sql).run(...this.binds)
    return { meta: { changes: Number(result.changes) } }
  }
}

class D1Adapter {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:')
    this.sqlite.exec('PRAGMA foreign_keys = ON')
    this.sqlite.exec(portfolioMigration)
    this.sqlite.exec(planningMigration)
    this.preparedSql = []
    this.batchSql = []
    this.beforeBatch = null
    this.beforeRun = null
  }

  prepare(sql) {
    this.preparedSql.push(sql)
    return new D1Statement(this, sql)
  }

  batch(statements) {
    this.batchSql.push(statements.map((statement) => statement.sql))
    const hook = this.beforeBatch
    this.beforeBatch = null
    hook?.(this.sqlite)
    this.sqlite.exec('BEGIN')
    try {
      const results = statements.map((statement) => statement.run())
      this.sqlite.exec('COMMIT')
      return results
    } catch (error) {
      this.sqlite.exec('ROLLBACK')
      throw error
    }
  }

  runHook(statement) {
    const hook = this.beforeRun
    this.beforeRun = null
    hook?.(this.sqlite, statement)
  }
}

function insertDirection(db, { id = 'direction:one', status = 'active', archivedAt = null } = {}) {
  db.sqlite.prepare(`INSERT INTO planning_directions
    (id, title, status, priority, archived_at, created_at, updated_at)
    VALUES (?, 'Direction', ?, 'normal', ?, 1, 1)`).run(id, status, archivedAt)
}

function insertProfile(db, {
  id = 'profile:one', projectId = 'tuaran-home-page', directionId = 'direction:one',
  status = 'active', archivedAt = null,
} = {}) {
  db.sqlite.prepare(`INSERT INTO planning_project_profiles
    (id, project_id, direction_id, planning_status, archived_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, 1)`).run(id, projectId, directionId, status, archivedAt)
}

function insertMilestone(db, {
  id = 'milestone:one', directionId = 'direction:one', projectId = 'tuaran-home-page',
  status = 'active', archivedAt = null, updatedAt = 1,
} = {}) {
  db.sqlite.prepare(`INSERT INTO planning_milestones
    (id, direction_id, project_id, title, status, priority, archived_at, created_at, updated_at)
    VALUES (?, ?, ?, 'Milestone', ?, 'normal', ?, 1, ?)`).run(id, directionId, projectId, status, archivedAt, updatedAt)
}

function insertTask(db, {
  id = 'task:one', milestoneId = 'milestone:one', status = 'planned', archivedAt = null, updatedAt = 1,
} = {}) {
  db.sqlite.prepare(`INSERT INTO planning_tasks
    (id, milestone_id, title, status, priority, archived_at, created_at, updated_at)
    VALUES (?, ?, 'Task', ?, 'normal', ?, 1, ?)`).run(id, milestoneId, status, archivedAt, updatedAt)
}

function baseHierarchy() {
  const db = new D1Adapter()
  insertDirection(db)
  insertProfile(db)
  insertMilestone(db)
  return db
}

test('rejects missing or archived parents before create writes', async (t) => {
  const db = new D1Adapter()
  t.after(() => db.sqlite.close())
  insertDirection(db, { status: 'archived', archivedAt: 2 })

  assert.deepEqual(await upsertProjectProfile(db, {
    projectId: 'missing-project', directionId: 'direction:one',
  }), { ok: false, error: 'PROJECT_NOT_FOUND' })
  assert.deepEqual(await upsertProjectProfile(db, {
    projectId: 'tuaran-home-page', directionId: 'direction:one',
  }), { ok: false, error: 'DIRECTION_ARCHIVED' })

  insertDirection(db, { id: 'direction:active' })
  assert.deepEqual(await createMilestone(db, {
    directionId: 'direction:active', projectId: 'tuaran-home-page', title: 'No profile',
  }), { ok: false, error: 'PROJECT_PROFILE_NOT_FOUND' })
  assert.deepEqual(await createTask(db, {
    milestoneId: 'missing-milestone', title: 'No milestone',
  }), { ok: false, error: 'MILESTONE_NOT_FOUND' })
  assert.deepEqual(await createDecision(db, {
    title: 'Bad decision', milestoneId: 'missing-milestone',
  }), { ok: false, error: 'MILESTONE_NOT_FOUND' })
  assert.deepEqual(await createManualEvent(db, {
    entityType: 'task', entityId: 'missing-task', title: 'Bad history',
  }), { ok: false, error: 'NOT_FOUND' })

  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_project_profiles').get().count, 0)
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_milestones').get().count, 0)
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_tasks').get().count, 0)
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_decisions').get().count, 0)
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_events').get().count, 0)
})

test('validates merged parent IDs when reparenting milestones and tasks', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertDirection(db, { id: 'direction:two' })
  insertTask(db)
  insertMilestone(db, { id: 'milestone:archived', status: 'archived', archivedAt: 2 })

  assert.deepEqual(await updateProjectProfile(db, 'profile:one', { directionId: 'direction:missing' }), {
    ok: false,
    error: 'DIRECTION_NOT_FOUND',
  })
  assert.deepEqual(await updateMilestone(db, 'milestone:one', { directionId: 'direction:two' }), {
    ok: false,
    error: 'PROJECT_PROFILE_NOT_FOUND',
  })
  assert.deepEqual(await updateTask(db, 'task:one', { milestoneId: 'milestone:archived' }), {
    ok: false,
    error: 'MILESTONE_ARCHIVED',
  })
  assert.equal(db.sqlite.prepare("SELECT direction_id FROM planning_milestones WHERE id = 'milestone:one'").get().direction_id, 'direction:one')
  assert.equal(db.sqlite.prepare("SELECT milestone_id FROM planning_tasks WHERE id = 'task:one'").get().milestone_id, 'milestone:one')
})

test('moves a project profile and its milestone ancestry together', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertDirection(db, { id: 'direction:two' })

  assert.deepEqual(await updateProjectProfile(db, 'profile:one', { directionId: 'direction:two' }, { now: 20 }), {
    ok: true,
    id: 'profile:one',
  })
  assert.equal(db.sqlite.prepare("SELECT direction_id FROM planning_project_profiles WHERE id = 'profile:one'").get().direction_id, 'direction:two')
  assert.equal(db.sqlite.prepare("SELECT direction_id FROM planning_milestones WHERE id = 'milestone:one'").get().direction_id, 'direction:two')
})

test('allows historical links to archived records and canonical portfolio projects', async (t) => {
  const db = new D1Adapter()
  t.after(() => db.sqlite.close())
  insertDirection(db, { status: 'archived', archivedAt: 2 })
  insertProfile(db, { status: 'archived', archivedAt: 2 })
  insertMilestone(db, { status: 'archived', archivedAt: 2 })

  assert.equal((await createDecision(db, {
    id: 'decision:history', title: 'Historical decision', directionId: 'direction:one',
    projectId: 'tuaran-home-page', milestoneId: 'milestone:one',
  })).ok, true)
  assert.equal((await createManualEvent(db, {
    id: 'event:archived', entityType: 'milestone', entityId: 'milestone:one', title: 'Archived history',
  })).ok, true)
  assert.equal((await createManualEvent(db, {
    id: 'event:portfolio', entityType: 'project', entityId: 'blogger-alliance', title: 'Portfolio history',
  })).ok, true)
})

test('uses the authoritative row ID for generated transition events', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())

  const result = await updateMilestone(db, 'milestone:one', {
    id: 'milestone:poison', status: 'completed', completedAt: 20,
  }, { now: 20, idFactory: () => 'event-one' })

  assert.equal(result.ok, true)
  const event = db.sqlite.prepare('SELECT entity_id FROM planning_events').get()
  assert.equal(event.entity_id, 'milestone:one')
})

test('conditionally inserts transition events only when the versioned update succeeds', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db)
  db.beforeBatch = (sqlite) => sqlite.prepare("DELETE FROM planning_tasks WHERE id = 'task:one'").run()

  const result = await updateTask(db, 'task:one', { status: 'done' }, {
    now: 20,
    idFactory: () => 'event-one',
  })

  assert.deepEqual(result, { ok: false, error: 'NOT_FOUND' })
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_events').get().count, 0)
  assert.equal(db.batchSql.length, 1)
  assert.match(db.batchSql[0][0], /updated_at\s*=[\s\S]*WHERE[\s\S]*updated_at\s*=/i)
  assert.match(db.batchSql[0][1], /INSERT[\s\S]*SELECT[\s\S]*changes\(\)/i)
})

test('atomically rejects milestone completion when an open task appears before the batch', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  db.beforeBatch = (sqlite) => {
    sqlite.prepare(`INSERT INTO planning_tasks
      (id, milestone_id, title, status, priority, created_at, updated_at)
      VALUES ('task:race', 'milestone:one', 'Race', 'planned', 'normal', 1, 1)`).run()
  }

  const result = await updateMilestone(db, 'milestone:one', { status: 'completed' }, {
    now: 20,
    idFactory: () => 'event-one',
  })

  assert.deepEqual(result, {
    ok: false,
    error: 'MILESTONE_HAS_OPEN_TASKS',
    openTaskIds: ['task:race'],
  })
  assert.equal(db.sqlite.prepare("SELECT status FROM planning_milestones WHERE id = 'milestone:one'").get().status, 'active')
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_events').get().count, 0)
  assert.match(db.batchSql[0][0], /NOT EXISTS[\s\S]*planning_tasks/i)
})

test('uses one conditional DELETE and classifies a concurrent reference as ENTITY_REFERENCED', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db)
  db.beforeRun = (sqlite, statement) => {
    if (!/^DELETE/i.test(statement.sql.trim())) return
    sqlite.prepare(`INSERT INTO planning_events
      (id, entity_type, entity_id, event_type, title, source_key, occurred_at, created_at)
      VALUES ('event:race', 'task', 'task:one', 'note', 'Race', 'race', 2, 2)`).run()
  }

  const result = await deletePristinePlanningEntity(db, 'task', 'task:one')

  assert.deepEqual(result, { ok: false, error: 'ENTITY_REFERENCED', archiveAllowed: true })
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM planning_tasks WHERE id = 'task:one'").get().count, 1)
  const deletes = db.preparedSql.filter((sql) => /^DELETE/i.test(sql.trim()))
  assert.equal(deletes.length, 1)
  assert.match(deletes[0], /NOT EXISTS[\s\S]*planning_events/i)

  assert.deepEqual(await deletePristinePlanningEntity(db, 'task', 'task:missing'), {
    ok: false,
    error: 'NOT_FOUND',
  })
  db.sqlite.prepare("DELETE FROM planning_events WHERE id = 'event:race'").run()
  assert.deepEqual(await deletePristinePlanningEntity(db, 'task', 'task:one'), {
    ok: true,
    id: 'task:one',
  })
})

test('bounds event and closed-decision history on both sides of generatedAt', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  const now = 100 * 86400000
  const old = now - 31 * 86400000
  const recent = now - 1
  const future = now + 1
  const insertEvent = db.sqlite.prepare(`INSERT INTO planning_events
    (id, entity_type, entity_id, event_type, title, source_key, occurred_at, created_at)
    VALUES (?, 'milestone', 'milestone:one', 'note', ?, ?, ?, ?)`)
  insertEvent.run('event:old', 'old', 'event:old', old, old)
  insertEvent.run('event:recent', 'recent', 'event:recent', recent, recent)
  insertEvent.run('event:future', 'future', 'event:future', future, future)
  const insertDecision = db.sqlite.prepare(`INSERT INTO planning_decisions
    (id, title, status, decided_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
  insertDecision.run('decision:old', 'old', 'decided', old, old, old)
  insertDecision.run('decision:recent', 'recent', 'decided', recent, recent, recent)
  insertDecision.run('decision:future', 'future', 'decided', future, future, future)
  insertDecision.run('decision:open', 'open', 'open', null, old, old)

  const snapshot = await readPlanningSnapshot(db, { window: 'month', now })

  assert.deepEqual(snapshot.events.map((event) => event.id), ['event:recent'])
  assert.deepEqual(snapshot.decisions.map((decision) => decision.id).sort(), ['decision:open', 'decision:recent'])
  assert.equal(snapshot.stats.decisions, 1)
  const historySql = db.preparedSql.filter((sql) => /planning_(events|decisions)/.test(sql))
  assert.match(historySql[0], /occurred_at\s*>=\s*\?1[\s\S]*occurred_at\s*<=\s*\?2/i)
  assert.match(historySql[1], /COALESCE[\s\S]*>=\s*\?1[\s\S]*COALESCE[\s\S]*<=\s*\?2/i)
})

test('snapshot includes a full hierarchy lookup while keeping archived work out of active arrays', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db)
  await createManualEvent(db, {
    id: 'event:archived-task', entityType: 'task', entityId: 'task:one', title: 'Archived task', occurredAt: 90,
  }, { now: 90 })
  await archivePlanningEntity(db, 'direction', 'direction:one', { now: 91 })
  await archivePlanningEntity(db, 'project-profile', 'profile:one', { now: 92 })
  await archivePlanningEntity(db, 'milestone', 'milestone:one', { now: 93 })
  await archivePlanningEntity(db, 'task', 'task:one', { now: 94 })

  const snapshot = await readPlanningSnapshot(db, { window: 'month', now: 100 })
  assert.deepEqual(snapshot.directions, [])
  assert.deepEqual(snapshot.projects, [])
  assert.deepEqual(snapshot.milestones, [])
  assert.deepEqual(snapshot.tasks, [])
  assert.equal(snapshot.events[0].id, 'event:archived-task')
  assert.deepEqual(snapshot.hierarchy.directions.map((item) => item.id), ['direction:one'])
  assert.deepEqual(snapshot.hierarchy.projects.map((item) => item.id), ['profile:one'])
  assert.deepEqual(snapshot.hierarchy.milestones.map((item) => item.id), ['milestone:one'])
  assert.deepEqual(snapshot.hierarchy.tasks.map((item) => item.id), ['task:one'])
})

test('returns the existing persisted profile ID after an upsert conflict', async (t) => {
  const db = new D1Adapter()
  t.after(() => db.sqlite.close())
  insertDirection(db)
  insertProfile(db, { id: 'profile:existing' })

  const result = await upsertProjectProfile(db, {
    id: 'profile:discarded', projectId: 'tuaran-home-page', directionId: 'direction:one', summary: 'Updated',
  }, { now: 20 })

  assert.equal(result.ok, true)
  assert.equal(result.id, 'profile:existing')
  assert.equal(result.profile.id, 'profile:existing')
  assert.equal(result.profile.summary, 'Updated')
})

test('persists acyclic dependencies and reports idempotent import counts', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db, { id: 'task:a' })
  insertTask(db, { id: 'task:b' })

  assert.deepEqual(await createDependency(db, {
    fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'missing',
  }), { ok: false, error: 'DEPENDENCY_ENDPOINT_NOT_FOUND' })
  assert.equal((await createDependency(db, {
    id: 'dependency:one', fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'task:b',
  })).ok, true)
  assert.deepEqual(await createDependency(db, {
    fromType: 'task', fromId: 'task:b', toType: 'task', toId: 'task:a',
  }), { ok: false, error: 'DEPENDENCY_CYCLE' })

  const preview = {
    directions: [], profiles: [], milestones: [],
    events: [{
      id: 'event:import', entityType: 'project', entityId: 'tuaran-home-page',
      eventType: 'note', title: 'Imported', sourceKey: 'import:one', occurredAt: 10,
      details: { stable: true },
    }],
  }
  assert.deepEqual(await applyInitialImport(db, preview, 20), {
    inserted: { directions: 0, profiles: 0, milestones: 0, events: 1 },
    skipped: { directions: 0, profiles: 0, milestones: 0, events: 0 },
  })
  assert.deepEqual(await applyInitialImport(db, preview, 20), {
    inserted: { directions: 0, profiles: 0, milestones: 0, events: 0 },
    skipped: { directions: 0, profiles: 0, milestones: 0, events: 1 },
  })
})

test('does not append a manual event when its target is deleted before the insert', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db)
  db.beforeRun = (sqlite, statement) => {
    if (/INSERT INTO planning_events/i.test(statement.sql)) {
      sqlite.prepare("DELETE FROM planning_tasks WHERE id = 'task:one'").run()
    }
  }

  const result = await createManualEvent(db, {
    id: 'event:race', entityType: 'task', entityId: 'task:one', title: 'Race',
  })

  assert.deepEqual(result, { ok: false, error: 'NOT_FOUND' })
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_events').get().count, 0)
  assert.match(db.preparedSql.find((sql) => /INSERT INTO planning_events/i.test(sql)), /SELECT[\s\S]*EXISTS/i)
})

test('creates a profile, milestone, and task through live-parent SQL gates', async (t) => {
  const db = new D1Adapter()
  t.after(() => db.sqlite.close())
  insertDirection(db)

  assert.equal((await upsertProjectProfile(db, {
    id: 'profile:created', projectId: 'tuaran-home-page', directionId: 'direction:one',
  })).ok, true)
  assert.equal((await createMilestone(db, {
    id: 'milestone:created', directionId: 'direction:one', projectId: 'tuaran-home-page', title: 'Created',
  })).ok, true)
  assert.equal((await createTask(db, {
    id: 'task:created', milestoneId: 'milestone:created', title: 'Created',
  })).ok, true)

  const gatedWrites = db.preparedSql.filter((sql) => /INSERT(?: OR IGNORE)? INTO planning_(project_profiles|milestones|tasks)/i.test(sql))
  assert.equal(gatedWrites.length, 3)
  assert.ok(gatedWrites.every((sql) => /SELECT[\s\S]*(EXISTS|JOIN|WHERE)/i.test(sql)))
})

test('atomically rejects dependencies when an endpoint disappears before insertion', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db, { id: 'task:a' })
  insertTask(db, { id: 'task:b' })
  db.beforeRun = (sqlite, statement) => {
    if (/INSERT(?: OR IGNORE)? INTO planning_dependencies/i.test(statement.sql)) {
      sqlite.prepare("DELETE FROM planning_tasks WHERE id = 'task:b'").run()
    }
  }

  const result = await createDependency(db, {
    id: 'dependency:race', fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'task:b',
  })

  assert.deepEqual(result, { ok: false, error: 'DEPENDENCY_ENDPOINT_NOT_FOUND' })
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS count FROM planning_dependencies').get().count, 0)
})

test('atomically rejects a dependency when the opposing edge wins the race', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db, { id: 'task:a' })
  insertTask(db, { id: 'task:b' })
  db.beforeRun = (sqlite, statement) => {
    if (/INSERT(?: OR IGNORE)? INTO planning_dependencies/i.test(statement.sql)) {
      sqlite.prepare(`INSERT INTO planning_dependencies
        (id, from_type, from_id, to_type, to_id, status, created_at, updated_at)
        VALUES ('dependency:winner', 'task', 'task:b', 'task', 'task:a', 'active', 2, 2)`).run()
    }
  }

  const result = await createDependency(db, {
    id: 'dependency:loser', fromType: 'task', fromId: 'task:a', toType: 'task', toId: 'task:b',
  })

  assert.deepEqual(result, { ok: false, error: 'DEPENDENCY_CYCLE' })
  assert.deepEqual(db.sqlite.prepare('SELECT id FROM planning_dependencies ORDER BY id').all().map((row) => row.id), ['dependency:winner'])
  assert.match(db.preparedSql.find((sql) => /INSERT(?: OR IGNORE)? INTO planning_dependencies/i.test(sql)), /WITH RECURSIVE[\s\S]*NOT EXISTS/i)
})

test('rejects child creates and reparents when the live parent is archived before the write', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())

  db.beforeRun = (sqlite, statement) => {
    if (/INSERT(?: OR IGNORE)? INTO planning_tasks/i.test(statement.sql)) {
      sqlite.prepare("UPDATE planning_milestones SET status = 'archived', archived_at = 2 WHERE id = 'milestone:one'").run()
    }
  }
  assert.deepEqual(await createTask(db, {
    id: 'task:race', milestoneId: 'milestone:one', title: 'Race',
  }), { ok: false, error: 'MILESTONE_ARCHIVED' })
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS count FROM planning_tasks WHERE id = 'task:race'").get().count, 0)

  db.sqlite.prepare("UPDATE planning_milestones SET status = 'active', archived_at = NULL WHERE id = 'milestone:one'").run()
  insertDirection(db, { id: 'direction:two' })
  insertProfile(db, { id: 'profile:two', projectId: 'blogger-alliance', directionId: 'direction:two' })
  db.beforeRun = (sqlite, statement) => {
    if (/UPDATE planning_project_profiles/i.test(statement.sql)) {
      sqlite.prepare("UPDATE planning_directions SET status = 'archived', archived_at = 2 WHERE id = 'direction:two'").run()
    }
  }
  assert.deepEqual(await updateProjectProfile(db, 'profile:one', { directionId: 'direction:two' }), {
    ok: false,
    error: 'DIRECTION_ARCHIVED',
  })
  assert.equal(db.sqlite.prepare("SELECT direction_id FROM planning_project_profiles WHERE id = 'profile:one'").get().direction_id, 'direction:one')
})

test('allows descendants to be archived after their parents are archived top-down', async (t) => {
  const db = baseHierarchy()
  t.after(() => db.sqlite.close())
  insertTask(db)
  const context = { now: 20 }

  assert.equal((await archivePlanningEntity(db, 'direction', 'direction:one', context)).ok, true)
  assert.equal((await archivePlanningEntity(db, 'project-profile', 'profile:one', context)).ok, true)
  assert.equal((await archivePlanningEntity(db, 'milestone', 'milestone:one', context)).ok, true)
  assert.equal((await archivePlanningEntity(db, 'task', 'task:one', context)).ok, true)

  assert.equal(db.sqlite.prepare("SELECT planning_status FROM planning_project_profiles WHERE id = 'profile:one'").get().planning_status, 'archived')
  assert.equal(db.sqlite.prepare("SELECT status FROM planning_milestones WHERE id = 'milestone:one'").get().status, 'archived')
  assert.equal(db.sqlite.prepare("SELECT status FROM planning_tasks WHERE id = 'task:one'").get().status, 'archived')
})
