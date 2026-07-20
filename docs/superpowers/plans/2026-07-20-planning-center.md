# Admin Planning Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an owner-only Admin planning center that manages every project through directions, milestones, tasks, append-only history, decisions, dependencies, and past/present/future views.

**Architecture:** Keep `portfolio_projects` as the project identity and commercial ledger. Add a bounded planning domain backed by D1 tables, pure `.mjs` rules that can be tested with Node 22, thin owner-protected API routes, and focused React views under `/admin/planning`. Initial data is imported idempotently from portfolio pillars, `next_step`, and the existing Changelog.

**Tech Stack:** Next.js 15 App Router, React 19, JavaScript, Tailwind CSS 3, Cloudflare D1/Edge runtime, Node.js 22 built-in test runner.

## Global Constraints

- Planning Center is the only source of truth for planning data after initialization.
- Continue reading project identity and commercial fields from `portfolio_projects`; do not duplicate project names, paths, revenue, hours, or business status.
- First release supports one primary direction per project.
- Every task belongs to one milestone; every milestone belongs to one referenced project and direction.
- Historical events are append-only and are not cascade-deleted.
- Use rolling windows: past history, present week/month/quarter focus, and future near/mid/long-term or unscheduled.
- Reuse `AdminPageGate`, `getOwnerOrReject`, Admin UI primitives, and existing visual tokens.
- Keep Edge runtime compatibility; do not add Node-only runtime dependencies to app or API code.
- Add no third-party package or test framework.
- First release excludes GitHub synchronization, reminders, AI summaries, multi-user collaboration, and public roadmaps.
- Preserve unrelated SEO and working-tree changes.

---

## File Structure

### New files

- `migrations/0053_planning_center.sql` — D1 schema, indexes, and referential constraints.
- `lib/planning/constants.mjs` — status sets, priorities, horizons, entity and event names.
- `lib/planning/rules.mjs` — validation, date normalization, time classification, transition-to-event mapping, dependency cycle detection.
- `lib/planning/seed.mjs` — pure import preview builder and stable source keys.
- `lib/planning/repository.mjs` — D1 reads, writes, transactional batches, row mapping, import application.
- `app/api/admin/planning/route.js` — owner-protected snapshot and CRUD endpoint.
- `app/api/admin/planning/import/route.js` — owner-protected import preview and application endpoint.
- `app/(admin)/admin/planning/page.jsx` — protected route and metadata.
- `app/(admin)/admin/planning/PlanningCenter.jsx` — client state, tabs, fetch/mutation orchestration, local error handling.
- `app/(admin)/admin/planning/TriStateOverview.jsx` — strategy strip and past/present/future columns.
- `app/(admin)/admin/planning/PlanningRoadmap.jsx` — project-by-horizon milestone matrix and dependencies.
- `app/(admin)/admin/planning/PlanningTree.jsx` — direction/project/milestone/task hierarchy.
- `app/(admin)/admin/planning/PlanningHistory.jsx` — event and decision timeline.
- `app/(admin)/admin/planning/PlanningEditor.jsx` — context-aware create/edit/archive form drawer.
- `app/(admin)/admin/planning/PlanningImportPanel.jsx` — preview and one-time import confirmation.
- `app/(admin)/admin/planning/planningUi.js` — labels, tones, display helpers, and client request helper.
- `tests/planning/rules.test.mjs` — pure rule and validation coverage.
- `tests/planning/seed.test.mjs` — idempotent seed-preview coverage.

### Modified files

- `app/(site)/changelog/page.jsx` — import shared Changelog data instead of owning the array.
- `lib/changelogData.js` — new shared home for the unchanged Changelog array.
- `lib/adminRoutes.js` — add Planning Center navigation and project workspace active path.
- `lib/adminIcons.jsx` — map the planning icon key.
- `app/(admin)/admin/projects/ProjectWorkspace.jsx` — add Planning Center card.
- `scripts/verify-admin-pages-build.cjs` — require `/admin/planning` and `/api/admin/planning` routes.
- `package.json` — add the `test:planning` script.

---

### Task 1: Planning schema and pure domain rules

**Files:**
- Create: `migrations/0053_planning_center.sql`
- Create: `lib/planning/constants.mjs`
- Create: `lib/planning/rules.mjs`
- Create: `tests/planning/rules.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `classifyPlanningItem(item, now, window) -> 'past' | 'present' | 'future'`.
- Produces: `validatePlanningPayload(entity, payload) -> { ok, value?, error? }`.
- Produces: `eventForTransition(entity, before, after, occurredAt) -> event | null`.
- Produces: `wouldCreateDependencyCycle(edges, candidate) -> boolean`.

- [ ] **Step 1: Write failing rule tests**

Create `tests/planning/rules.test.mjs` with Node's built-in test runner:

```js
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
```

- [ ] **Step 2: Add and run the planning test script**

Add to `package.json` scripts:

```json
"test:planning": "node --test tests/planning/*.test.mjs"
```

Run: `pnpm test:planning`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/planning/rules.mjs`.

- [ ] **Step 3: Create constants and minimal rule implementations**

Define exact exported constants in `lib/planning/constants.mjs`:

```js
export const DIRECTION_STATUSES = ['planned', 'active', 'paused', 'completed', 'archived']
export const MILESTONE_STATUSES = ['planned', 'active', 'blocked', 'completed', 'cancelled', 'archived']
export const TASK_STATUSES = ['planned', 'doing', 'blocked', 'done', 'cancelled', 'archived']
export const DECISION_STATUSES = ['open', 'decided', 'superseded']
export const PRIORITIES = ['low', 'normal', 'high', 'critical']
export const WINDOWS = ['week', 'month', 'quarter']
export const DEPENDENCY_ENTITY_TYPES = ['milestone', 'task']
export const TERMINAL_STATUSES = new Set(['completed', 'done', 'cancelled'])
```

Implement `lib/planning/rules.mjs` with these rules:

```js
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
```

- [ ] **Step 4: Add the D1 migration**

Create `migrations/0053_planning_center.sql` with seven tables named exactly as in the design: `planning_directions`, `planning_project_profiles`, `planning_milestones`, `planning_tasks`, `planning_events`, `planning_decisions`, and `planning_dependencies`. Use TEXT primary keys, INTEGER millisecond timestamps, `archived_at` for soft deletion, a UNIQUE constraint on `planning_project_profiles.project_id`, and a UNIQUE constraint on `planning_events.source_key`. Add indexes for direction/project lookup, milestone status and target date, task milestone/status/target date, event occurrence, decision date, and both dependency endpoints.

The event table must not declare a cascading foreign key to a mutable entity. The task table must reference milestones with `ON DELETE RESTRICT`; milestone and project-profile children also use `ON DELETE RESTRICT`. `planning_decisions.status` is required and constrained to `open`, `decided`, or `superseded`; an open decision may omit its conclusion, while a decided record requires one at API validation time.

- [ ] **Step 5: Run tests and inspect migration**

Run: `pnpm test:planning`

Expected: 6 tests pass.

Run: `rg -n "CREATE TABLE|CREATE INDEX|ON DELETE RESTRICT|source_key" migrations/0053_planning_center.sql`

Expected: 7 tables, required indexes, restrictive child relationships, and the idempotency key are visible.

- [ ] **Step 6: Commit**

```bash
git add package.json migrations/0053_planning_center.sql lib/planning/constants.mjs lib/planning/rules.mjs tests/planning/rules.test.mjs
git commit -m "feat: add planning domain schema and rules"
```

---

### Task 2: Shared Changelog data and idempotent import preview

**Files:**
- Create: `lib/changelogData.js`
- Create: `lib/planning/seed.mjs`
- Create: `tests/planning/seed.test.mjs`
- Modify: `app/(site)/changelog/page.jsx`

**Interfaces:**
- Consumes: a `portfolio_projects`-shaped project array and the shared `CHANGELOG` array.
- Produces: `buildPlanningImportPreview(projects, changelog) -> { directions, profiles, milestones, events, counts }`.
- Produces stable source keys: `portfolio-next:<projectId>` and `changelog:<version>`.

- [ ] **Step 1: Write failing seed tests**

Create `tests/planning/seed.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPlanningImportPreview } from '../../lib/planning/seed.mjs'

const projects = [
  { id: 'site', name: 'Site', pillar: 'blog', next: 'Ship planning' },
  { id: 'agent', name: 'Agent', pillar: 'agent', next: '' },
]
const changelog = [{ version: 'v1', title: 'First release', summary: 'Done', done: ['A'], planned: ['B'], range: '2026-07-01' }]

test('builds directions, references, pending milestones, and one event per changelog entry', () => {
  const preview = buildPlanningImportPreview(projects, changelog)
  assert.deepEqual(preview.counts, { directions: 2, profiles: 2, milestones: 1, events: 1 })
  assert.equal(preview.milestones[0].sourceKey, 'portfolio-next:site')
  assert.equal(preview.events[0].sourceKey, 'changelog:v1')
  assert.deepEqual(preview.events[0].details.done, ['A'])
})

test('returns stable ids and keys for repeated previews', () => {
  assert.deepEqual(buildPlanningImportPreview(projects, changelog), buildPlanningImportPreview(projects, changelog))
})
```

- [ ] **Step 2: Run the seed test to verify failure**

Run: `pnpm test:planning`

Expected: existing rule tests pass and seed tests fail with `ERR_MODULE_NOT_FOUND` for `lib/planning/seed.mjs`.

- [ ] **Step 3: Extract Changelog data without changing content**

Move the existing `const changelog = [...]` array byte-for-byte from `app/(site)/changelog/page.jsx` to `lib/changelogData.js` and export it as:

```js
export const CHANGELOG = [
  // the existing entries move here unchanged
]
```

At the top of `app/(site)/changelog/page.jsx`, add:

```js
import { CHANGELOG as changelog } from '../../../lib/changelogData'
```

Remove only the original array declaration from the page. Keep all presentation constants and JSX in place.

Do not add the public `/changelog` route to `KEPT_SITE_ENTRIES`; importing `lib/changelogData.js` from the Admin API keeps the data available without shipping the public page.

- [ ] **Step 4: Implement deterministic preview generation**

Create `lib/planning/seed.mjs` with a fixed pillar mapping:

```js
const DIRECTION_BY_PILLAR = {
  blog: { id: 'direction:blog', title: '个人门户', vision: '个人门户、知识资产与共享内容基础设施。' },
  alliance: { id: 'direction:alliance', title: '博主联盟', vision: '创作者增长、品牌协作与商业闭环。' },
  weekly: { id: 'direction:weekly', title: '前端周刊', vision: '技术趋势、专题内容与学习资源。' },
  agent: { id: 'direction:agent', title: 'AI Agent', vision: '自动化执行、Agent runtime 与智能工作流。' },
}
```

`buildPlanningImportPreview` must deduplicate directions by pillar, create one profile per project, create a planned unscheduled milestone only when `next.trim()` is non-empty, and create one `note` event per Changelog entry attached to project `tuaran-home-page`. Serialize `done` and `planned` arrays into `details` rather than splitting bullets into tasks.

- [ ] **Step 5: Run tests and static Changelog checks**

Run: `pnpm test:planning`

Expected: all rule and seed tests pass.

Run: `rg -n "const changelog =|CHANGELOG as changelog|export const CHANGELOG" app/'(site)'/changelog/page.jsx lib/changelogData.js`

Expected: one exported shared array and one page import; no page-owned array remains.

- [ ] **Step 6: Commit**

```bash
git add lib/changelogData.js lib/planning/seed.mjs tests/planning/seed.test.mjs app/'(site)'/changelog/page.jsx
git commit -m "refactor: share planning import source data"
```

---

### Task 3: D1 planning repository and snapshot read model

**Files:**
- Create: `lib/planning/repository.mjs`
- Create: `tests/planning/repository-shapes.test.mjs`

**Interfaces:**
- Consumes: D1 binding from `getD1()` and pure rules from Task 1.
- Produces: `readPortfolioCatalog(db)` and `readPlanningSnapshot(db, options)` returning `{ directions, projectCatalog, projects, milestones, tasks, events, decisions, dependencies, triState, stats }`.
- Produces: explicit create/update/archive/delete functions for every mutable entity.
- Produces: `previewInitialImport(projects, changelog)` and `applyInitialImport(db, preview, now)`.

- [ ] **Step 1: Add failing row-shape tests**

Create `tests/planning/repository-shapes.test.mjs` to import and assert the exact camelCase output of `rowToMilestone`, `rowToTask`, and `rowToEvent`. Include null dates, numeric priorities, JSON event details, and archived timestamps. Expected keys for a task are:

```js
[
  'id', 'milestoneId', 'title', 'description', 'status', 'priority', 'assignee',
  'plannedAt', 'startAt', 'targetAt', 'completedAt', 'note', 'blockedReason',
  'sortOrder', 'archivedAt', 'createdAt', 'updatedAt',
]
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test:planning`

Expected: repository-shape tests fail because `lib/planning/repository.mjs` does not exist.

- [ ] **Step 3: Implement row mappers and snapshot reads**

Export row mappers for testing. `readPortfolioCatalog` reads every current `portfolio_projects` row. `readPlanningSnapshot` must run bounded queries: active directions and profiles, non-archived milestones/tasks, events and decisions within the selected history range, and all active dependencies. Join project profiles to `portfolio_projects` so the returned planned-project object contains the current project `name`, `pillar`, `action`, `bizStatus`, and `next` without storing copies. Decisions use `open`, `decided`, or `superseded`; `stats.decisions` counts `open` records.

Return this stable response shape:

```js
{
  generatedAt,
  window: 'week' | 'month' | 'quarter',
  directions: [],
  projectCatalog: [],
  projects: [],
  milestones: [],
  tasks: [],
  events: [],
  decisions: [],
  dependencies: [],
  triState: { past: [], present: [], future: [], unscheduled: [] },
  stats: { completed: 0, focus: 0, blocked: 0, overdue: 0, decisions: 0 },
}
```

Use `classifyPlanningItem` for milestones and tasks. Put future items with no `targetAt` into `unscheduled` as well as the future total, but return them only once in display lists.

- [ ] **Step 4: Implement explicit mutation functions**

Add named functions rather than dynamic table names:

```js
createDirection(db, payload, context)
upsertProjectProfile(db, payload, context)
createMilestone(db, payload, context)
createTask(db, payload, context)
createDecision(db, payload, context)
createManualEvent(db, payload, context)
createDependency(db, payload, context)
updateDirection(db, id, changes, context)
updateProjectProfile(db, id, changes, context)
updateMilestone(db, id, changes, context)
updateTask(db, id, changes, context)
archivePlanningEntity(db, entity, id, context)
deletePristinePlanningEntity(db, entity, id)
```

For task and milestone status updates, read the old row, validate the transition, call `eventForTransition`, and use `db.batch([updateStatement, eventInsert])` when an event is required. Before completing a milestone, query for child tasks outside `done`, `cancelled`, and `archived`; return `{ ok: false, error: 'MILESTONE_HAS_OPEN_TASKS', openTaskIds }` when any exist.

Before creating a dependency, load active edges and reject self-links, mixed entity types, missing endpoints, and cycles.

- [ ] **Step 5: Implement import persistence**

`applyInitialImport` must use `INSERT OR IGNORE` with the stable IDs and source keys produced in Task 2. It returns inserted/skipped counts for every entity type. It must never update an existing planning record.

- [ ] **Step 6: Run tests**

Run: `pnpm test:planning`

Expected: all tests pass, including exact row shapes and malformed JSON fallback for event details.

- [ ] **Step 7: Commit**

```bash
git add lib/planning/repository.mjs tests/planning/repository-shapes.test.mjs
git commit -m "feat: add planning repository and read model"
```

---

### Task 4: Owner-protected planning and import APIs

**Files:**
- Create: `app/api/admin/planning/route.js`
- Create: `app/api/admin/planning/import/route.js`

**Interfaces:**
- Consumes: `getOwnerOrReject`, `getD1`, planning rules, repository functions, and `CHANGELOG`.
- Produces: `GET /api/admin/planning?window=week|month|quarter`.
- Produces: CRUD via `POST`, `PATCH`, and `DELETE /api/admin/planning`.
- Produces: `GET` preview and `POST` application at `/api/admin/planning/import`.

- [ ] **Step 1: Create the read endpoint**

Set both route modules to:

```js
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

For `GET /api/admin/planning`, guard with `getOwnerOrReject`, return 503 `{ error: 'DB_UNAVAILABLE' }` when D1 is missing, reject an invalid `window` with 400 `{ error: 'INVALID_WINDOW' }`, and return `{ status: 'ok', ...snapshot }` on success.

- [ ] **Step 2: Create explicit mutation dispatch**

Use these action names for `POST`:

```js
const POST_ACTIONS = {
  'create-direction': createDirection,
  'upsert-project-profile': upsertProjectProfile,
  'create-milestone': createMilestone,
  'create-task': createTask,
  'create-decision': createDecision,
  'create-event': createManualEvent,
  'create-dependency': createDependency,
}
```

`PATCH` accepts `{ entity: 'direction' | 'project-profile' | 'milestone' | 'task', id, changes }`. `DELETE` reads `entity` and `id` from query parameters. If a record is referenced, return 409 `{ error: 'ENTITY_REFERENCED', archiveAllowed: true }`; if it is pristine, delete it. Archiving is a PATCH change, never an implicit DELETE fallback.

Map known repository errors to stable HTTP statuses: validation 400, missing 404, conflict/open children/cycle 409, D1 unavailable 503, unexpected read/write failures 500.

- [ ] **Step 3: Create import preview and apply handlers**

`GET /api/admin/planning/import` calls `readPortfolioCatalog(db)`, builds the pure preview from live D1 projects plus `CHANGELOG`, and returns it with existing-source-key counts. `POST` rebuilds the same preview from live projects and requires body `{ confirm: true }`; otherwise return 400 `{ error: 'IMPORT_CONFIRMATION_REQUIRED' }`. Apply the preview with `INSERT OR IGNORE` and return `{ status: 'ok', inserted, skipped }`.

- [ ] **Step 4: Verify route source contracts**

Run:

```bash
rg -n "getOwnerOrReject|DB_UNAVAILABLE|INVALID_WINDOW|create-direction|MILESTONE_HAS_OPEN_TASKS|IMPORT_CONFIRMATION_REQUIRED" app/api/admin/planning
```

Expected: both routes contain owner protection and the stable contract names.

Run: `pnpm lint`

Expected: exit 0, or only an already-known unrelated failure recorded before this task.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/planning/route.js app/api/admin/planning/import/route.js
git commit -m "feat: expose admin planning APIs"
```

---

### Task 5: Admin route, navigation, and Planning Center shell

**Files:**
- Create: `app/(admin)/admin/planning/page.jsx`
- Create: `app/(admin)/admin/planning/PlanningCenter.jsx`
- Create: `app/(admin)/admin/planning/planningUi.js`
- Modify: `lib/adminRoutes.js`
- Modify: `lib/adminIcons.jsx`
- Modify: `app/(admin)/admin/projects/ProjectWorkspace.jsx`

**Interfaces:**
- Consumes: planning snapshot API from Task 4.
- Produces: protected `/admin/planning` route with four tabs and reusable client mutation/reload functions.
- Produces: `planningRequest(path, options) -> parsed JSON or thrown Error`.

- [ ] **Step 1: Add navigation registration**

Add `/admin/planning` to the “项目与工程” workspace `activePaths`, add a Planning Center card before “项目总览,” and add `planning: IconTimelineEvent` to `lib/adminIcons.jsx`. The card copy is:

```js
{
  href: '/admin/planning',
  title: '规划中心',
  description: '统一记录全部项目的过去、当前焦点、未来里程碑与执行任务。',
  icon: 'planning',
}
```

- [ ] **Step 2: Create the protected page**

`page.jsx` must use `AdminPageGate`, Edge runtime, force-dynamic rendering, noindex metadata, label “规划中心,” and return path `/admin/planning`.

- [ ] **Step 3: Create UI constants and request helper**

In `planningUi.js`, define Chinese labels and tones for every status from Task 1, tab definitions for `overview`, `roadmap`, `tree`, and `history`, date formatting that returns `—` for null, and `planningRequest` that safely parses JSON and throws an Error whose `code` is the response `error` value.

- [ ] **Step 4: Create the client shell**

`PlanningCenter.jsx` owns `activeTab`, `window`, `directionId`, `snapshot`, `loading`, `error`, and editor/import-panel state. It fetches `/api/admin/planning?window=${window}` with `cache: 'no-store'`, shows a non-blocking error panel with retry, and keeps the last successful snapshot visible during refresh.

Render an `AdminPage` with title “规划中心,” description “把全部项目的过去、现在与未来放在同一条主线上。”, “初始化数据” and “快速添加” actions, and four keyboard-focusable tab buttons.

- [ ] **Step 5: Run route and lint checks**

Run: `pnpm lint`

Expected: exit 0 or only documented unrelated pre-existing failures.

Run: `rg -n "/admin/planning|规划中心|planning:" lib/adminRoutes.js lib/adminIcons.jsx app/'(admin)'/admin/projects/ProjectWorkspace.jsx app/'(admin)'/admin/planning`

Expected: route, card, icon, metadata, and page copy are all registered.

- [ ] **Step 6: Commit**

```bash
git add lib/adminRoutes.js lib/adminIcons.jsx app/'(admin)'/admin/projects/ProjectWorkspace.jsx app/'(admin)'/admin/planning/page.jsx app/'(admin)'/admin/planning/PlanningCenter.jsx app/'(admin)'/admin/planning/planningUi.js
git commit -m "feat: add planning center admin shell"
```

---

### Task 6: Three-state overview and editing workflow

**Files:**
- Create: `app/(admin)/admin/planning/TriStateOverview.jsx`
- Create: `app/(admin)/admin/planning/PlanningEditor.jsx`
- Modify: `app/(admin)/admin/planning/PlanningCenter.jsx`

**Interfaces:**
- Consumes: `snapshot.triState`, `snapshot.stats`, directions/projects/milestones, and mutation callbacks.
- Produces: default A-led past/present/future view with B-style strategy metrics.
- Produces: context-aware editor for direction, milestone, task, event, and decision.

- [ ] **Step 1: Build the strategy strip and filters**

Render the active direction's `northStar` text followed by four `StatCard` components: completed, focus, blocked/overdue, and decisions. Add direction chips and a week/month/quarter select. Changing either filter reloads the snapshot without clearing the previous result.

- [ ] **Step 2: Build the three columns**

`TriStateOverview` renders past, present, and future columns. Past cards show event date and related project; present cards show status, priority, target date, and blocked reason; future cards group near term (30 days), mid term (31–90 days), long term (over 90 days), and unscheduled. Use `StatusPill`, not new hard-coded colors.

Empty copy must be actionable:

- Past: “完成任务或补录历史后，这里会形成时间线。”
- Present: “还没有当前焦点；开始一个计划，或添加进行中的任务。”
- Future: “还没有未来计划；创建里程碑来明确下一步。”

- [ ] **Step 3: Build the editor**

`PlanningEditor` receives `{ mode, entity, initialValue, context, snapshot, onSave, onClose }`. Use a right-side fixed drawer on desktop and a full-screen sheet on small screens. Keep form state after API errors. Show only fields supported by each entity, require the hierarchy selectors, and convert local date inputs to millisecond timestamps before submit. Decision forms expose `open`, `decided`, and `superseded`; conclusion is required when status is `decided`.

For milestone completion conflicts, display the returned `openTaskIds` and keep the editor open. Offer links that set the active tab to the planning tree; do not auto-complete or auto-cancel child tasks.

- [ ] **Step 4: Wire quick-add and card edit actions**

The top-level button opens a type chooser. Creating from a project or milestone context preselects its ancestors. On successful save, close the drawer, reload the snapshot, and preserve active tab/window/direction filters.

- [ ] **Step 5: Verify UI behavior**

Run: `pnpm lint`

Expected: exit 0 or only documented unrelated pre-existing failures.

Start: `ADMIN_LOCAL_PREVIEW=1 pnpm dev`

Open: `http://localhost:3000/admin/planning`

Expected: owner preview renders the strategy strip, three columns, actionable empty states, responsive editor, and visible retry behavior when D1 is unavailable.

- [ ] **Step 6: Commit**

```bash
git add app/'(admin)'/admin/planning/TriStateOverview.jsx app/'(admin)'/admin/planning/PlanningEditor.jsx app/'(admin)'/admin/planning/PlanningCenter.jsx
git commit -m "feat: add planning overview and editor"
```

---

### Task 7: Roadmap, planning tree, history, decisions, and dependencies

**Files:**
- Create: `app/(admin)/admin/planning/PlanningRoadmap.jsx`
- Create: `app/(admin)/admin/planning/PlanningTree.jsx`
- Create: `app/(admin)/admin/planning/PlanningHistory.jsx`
- Modify: `app/(admin)/admin/planning/PlanningCenter.jsx`
- Modify: `app/(admin)/admin/planning/PlanningEditor.jsx`

**Interfaces:**
- Consumes: the same snapshot and mutation callback used by the overview.
- Produces: C-style project roadmap, full hierarchy maintenance, filtered append-only timeline, and dependency creation.

- [ ] **Step 1: Build the project roadmap**

Render projects as rows and past/current-quarter/future as columns. Place milestones using status and target date; unscheduled milestones receive a dashed “待排期” cell. Show active dependency counts and a warning icon when an upstream entity is blocked or overdue.

- [ ] **Step 2: Build the planning tree**

Render expandable direction → project → milestone → task nodes. Every node shows status, priority, and target date, plus edit/archive controls. Direction and project nodes provide context-aware add buttons for their allowed child type. Add “关联项目” on a direction: it filters `snapshot.projectCatalog` to projects that have no active planning profile and submits `upsert-project-profile`. Editing a project node may move its profile to another active direction without modifying `portfolio_projects`. Archived items are hidden by default behind a “显示已归档” toggle.

- [ ] **Step 3: Build history and decision timeline**

Merge `events` and `decisions` into a descending timeline without mutating either source array. Provide filters for direction, project, type, and date range. Decision cards show background, conclusion, rationale, and impact; event cards show source and correction links. Append-only events have no delete action.

- [ ] **Step 4: Add dependency editing**

The editor's dependency mode allows only milestone-to-milestone or task-to-task links. Disable self-selection in the UI, submit through `create-dependency`, and display `DEPENDENCY_CYCLE` and `DEPENDENCY_TYPE_MISMATCH` messages without clearing the form.

- [ ] **Step 5: Run focused interaction verification**

With local preview and a D1-backed dev environment, verify:

1. A cross-project milestone appears in the roadmap.
2. Expanding its project in the tree reaches all child tasks.
3. Blocking a task creates an event visible in history.
4. A reverse dependency that creates a cycle is rejected and does not disappear from the form.
5. Archiving hides the entity but preserves its prior events.

Run: `pnpm lint`

Expected: exit 0 or only documented unrelated pre-existing failures.

- [ ] **Step 6: Commit**

```bash
git add app/'(admin)'/admin/planning/PlanningRoadmap.jsx app/'(admin)'/admin/planning/PlanningTree.jsx app/'(admin)'/admin/planning/PlanningHistory.jsx app/'(admin)'/admin/planning/PlanningCenter.jsx app/'(admin)'/admin/planning/PlanningEditor.jsx
git commit -m "feat: add planning roadmap tree and history"
```

---

### Task 8: Import UI, Admin build coverage, and release verification

**Files:**
- Create: `app/(admin)/admin/planning/PlanningImportPanel.jsx`
- Modify: `app/(admin)/admin/planning/PlanningCenter.jsx`
- Modify: `scripts/verify-admin-pages-build.cjs`

**Interfaces:**
- Consumes: import preview/apply endpoint from Task 4.
- Produces: explicit preview-and-confirm initialization flow.
- Produces: Admin build enforcement for Planning Center routes.

- [ ] **Step 1: Build the import preview panel**

Fetch `/api/admin/planning/import` only when the panel opens. Show counts for directions, project references, pending milestones, and history events, plus inserted/skipped estimates. List the first five imported `next_step` milestones and Changelog events so the user can inspect mapping quality.

The apply button text is “确认导入为规划初始数据.” Disable it while submitting and require an explicit checkbox labeled “我知道重复来源会跳过，已有规划不会被覆盖.” POST `{ confirm: true }`, show inserted/skipped results, and reload the Planning Center snapshot after success.

- [ ] **Step 2: Require planning routes in Admin verification**

Add these values to `REQUIRED_ROUTES` in `scripts/verify-admin-pages-build.cjs`:

```js
'/admin/planning',
'/api/admin/planning',
'/api/admin/planning/import',
```

Do not broaden `isAllowedRoute`; its existing `/admin` and `/api/admin` prefixes already cover the new routes.

- [ ] **Step 3: Run planning and static checks**

Run: `pnpm test:planning`

Expected: all planning tests pass.

Run: `pnpm style:check`

Expected: exit 0.

Run: `pnpm security:check`

Expected: exit 0.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 4: Run full Admin build verification**

Run: `pnpm pages:build:admin`

Expected: Next-on-Pages build succeeds; `verify-admin-pages-build` reports the Planning Center page and both APIs present, no unexpected public routes, no missing client API references, and Worker gzip size below 3 MiB.

- [ ] **Step 5: Perform final acceptance walkthrough**

In an owner-authenticated D1 environment:

1. Preview and apply import twice; the second run inserts zero duplicate source records.
2. Confirm projects display live names and commercial attributes from `portfolio_projects`.
3. Create a direction, milestone, and task; move the task planned → doing → done.
4. Confirm the task moves future → present → past and creates started/completed events.
5. Confirm completing a milestone with open tasks returns the conflict and keeps form input.
6. Confirm an overdue planned task appears in present with risk styling.
7. Confirm an undated planned milestone appears once under future/unscheduled.
8. Confirm a cyclic dependency is rejected.
9. Confirm archived records disappear by default while their events remain visible.
10. Confirm anonymous and non-owner requests receive 401 and 403 without data.
11. Confirm mobile tabs, sheets, forms, labels, and keyboard focus are usable.

- [ ] **Step 6: Commit**

```bash
git add app/'(admin)'/admin/planning/PlanningImportPanel.jsx app/'(admin)'/admin/planning/PlanningCenter.jsx scripts/verify-admin-pages-build.cjs
git commit -m "feat: complete planning center initialization flow"
```

- [ ] **Step 7: Record the final verification evidence**

Run:

```bash
git status --short
git log -8 --oneline
```

Expected: only pre-existing unrelated user changes remain; the eight Planning Center commits are visible in order. Do not stage or rewrite unrelated files.
