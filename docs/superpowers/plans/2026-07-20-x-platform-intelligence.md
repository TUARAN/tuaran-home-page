# X 平台多维情报图谱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 `/x-platform-intelligence` 公开多维页面，用季度快照、可分享筛选、证据抽屉和跨平台差异矩阵，帮助中文科技创作者理解 X 的用户、内容、国家、经营价值与风险。

**Architecture:** 使用 Next.js 15 App Router 静态页面和 React 19 客户端交互；数据以可版本控制的 `.mjs` 仓库形式维护，纯函数负责校验、筛选、图表视图模型、URL 状态和 CSV。页面复用现有站点型多维页面外壳，不增加数据库、运行时抓取或新图表依赖。

**Tech Stack:** Next.js 15、React 19、JavaScript、Tailwind CSS 3、`@tabler/icons-react`、Node.js `assert` 测试脚本、Cloudflare Pages 静态构建。

## Global Constraints

- 目标路由固定为 `/x-platform-intelligence`，并登记到“多维页面”的“数据可视化”分类。
- 首版使用静态数据和浏览器交互，不接 D1、不调用运行时 API、不做自动爬取。
- DAU、MAU、广告受众、访问者、设备和注册账户必须分别展示。
- 不同单位、地域、统计期或定义的数据不得进入同一排行榜。
- 冲突数据并列展示，不求平均；合理区间必须记录形成规则。
- 事实、定量观测、编辑判断和经营建议使用不同标签。
- 无可靠交叉数据时显示缺口，不从不同来源拼接伪画像。
- 筛选状态写入 URL；无效参数回退默认值；不支持的筛选明确说明作用范围。
- 图表必须有表格或文本替代，颜色不能成为表达高低或可信度的唯一方式。
- 所有核心数字、矩阵评级和编辑结论必须可追溯到来源。
- 数据默认快照为 `2026-q2`，核验日期为 `2026-07-20`；后续季度新增记录，不覆盖历史。
- 保持 Cloudflare Pages 兼容，不使用 Node-only 页面运行时代码。
- 不新增第三方依赖；使用现有 Tailwind、React 和 Tabler Icons。

---

## File Structure

### Create

- `app/(site)/x-platform-intelligence/page.jsx`：静态路由、metadata 和 JSON-LD 入口。
- `app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx`：全局筛选、URL 状态、抽屉状态和九个页面模块的组合层。
- `app/(site)/x-platform-intelligence/data.mjs`：平台、指标、来源、快照、观测、洞见、比较和覆盖缺口的唯一数据资产。
- `app/(site)/x-platform-intelligence/model.mjs`：数据校验、证据解析和跨实体索引。
- `app/(site)/x-platform-intelligence/filters.mjs`：筛选解析、序列化、过滤和 CSV 生成。
- `app/(site)/x-platform-intelligence/selectors.mjs`：把仓库转换为规模、国家、画像、经营和比较模块所需的视图模型。
- `app/(site)/x-platform-intelligence/components/FilterBar.jsx`：全局筛选和作用范围提示。
- `app/(site)/x-platform-intelligence/components/Overview.jsx`：首屏结论和季度变化。
- `app/(site)/x-platform-intelligence/components/ScaleTrends.jsx`：规模、趋势和口径冲突。
- `app/(site)/x-platform-intelligence/components/GeoExplorer.jsx`：国家排行和可访问表格地图。
- `app/(site)/x-platform-intelligence/components/AudienceProfile.jsx`：画像与样本说明。
- `app/(site)/x-platform-intelligence/components/ContentMechanics.jsx`：内容格式与传播机制。
- `app/(site)/x-platform-intelligence/components/CreatorPlaybook.jsx`：创作者适配、经营建议和变现门槛。
- `app/(site)/x-platform-intelligence/components/PlatformMatrix.jsx`：全球组与中文组差异矩阵。
- `app/(site)/x-platform-intelligence/components/RiskRegister.jsx`：平台风险和经营风险。
- `app/(site)/x-platform-intelligence/components/EvidenceDrawer.jsx`：数字、洞见和矩阵评级的证据详情。
- `app/(site)/x-platform-intelligence/components/EvidenceLedger.jsx`：完整证据表和 CSV 导出。
- `scripts/test-x-platform-intelligence-model.mjs`：数据结构和证据完整性测试。
- `scripts/test-x-platform-intelligence-filters.mjs`：URL、筛选和 CSV 测试。
- `scripts/test-x-platform-intelligence-selectors.mjs`：各模块视图模型测试。

### Modify

- `.gitignore`：已加入 `.superpowers/`，避免提交 brainstorming 可视化会话。
- `package.json`：加入单一验证命令 `x-intelligence:check`。
- `lib/engineeringWorks.js`：登记多维页面目录项。
- `lib/richPageSeo.js`：加入精确 SEO、关键词和 schema 配置。

### Explicitly Unchanged

- `app/(site)/sitemap.js`：继续从 `ENGINEERING_WORKS` / `RICH_PAGE_SEO` 自动生成，无需硬编码路由。
- `app/globals.css`：页面样式使用局部 Tailwind，不新增全局专题样式。
- D1 migrations 和 API routes：首版不需要。

## Shared Interfaces

```js
// data.mjs
export const X_INTELLIGENCE_REPOSITORY = {
  platforms: [],
  metrics: [],
  sources: [],
  snapshots: [],
  observations: [],
  insights: [],
  comparisons: [],
  coverageGaps: [],
}

// model.mjs
export function validateRepository(repository) // => { errors: string[], warnings: string[] }
export function createRepositoryIndex(repository) // => { sourceById, observationById, insightById, comparisonById }
export function getEvidenceBundle(repository, evidenceRef) // => { subject, sources, observations, conflicts }

// filters.mjs
export const DEFAULT_FILTERS
export function parseFilterParams(searchParams, repository) // => FilterState
export function serializeFilterParams(filters) // => URLSearchParams
export function filterObservations(repository, filters) // => Observation[]
export function buildEvidenceCsv(rows) // => string

// selectors.mjs
export function selectOverview(repository, filters)
export function selectScaleTrends(repository, filters)
export function selectGeoRows(repository, filters)
export function selectAudienceGroups(repository, filters)
export function selectOperationalInsights(repository, filters)
export function selectComparisonMatrix(repository, filters)
export function selectEvidenceRows(repository, filters)
```

`evidenceRef` is `{ kind: 'observation' | 'insight' | 'comparison', id: string }`. Every component emits this exact shape through `onOpenEvidence(evidenceRef)`.

---

### Task 1: Pure Data Contract and Repository Validation

**Files:**
- Create: `app/(site)/x-platform-intelligence/model.mjs`
- Create: `scripts/test-x-platform-intelligence-model.mjs`

**Interfaces:**
- Consumes: repository shape from Shared Interfaces.
- Produces: `validateRepository`, `createRepositoryIndex`, `getEvidenceBundle`.

- [ ] **Step 1: Write the failing repository validation test**

Create `scripts/test-x-platform-intelligence-model.mjs` with a valid fixture and explicit invalid mutations:

```js
import assert from 'node:assert/strict'
import {
  createRepositoryIndex,
  getEvidenceBundle,
  validateRepository,
} from '../app/(site)/x-platform-intelligence/model.mjs'

const fixture = {
  platforms: [{ id: 'x', name: 'X', group: 'focus' }],
  metrics: [{ id: 'mau', label: 'MAU', allowedUnits: ['people'] }],
  sources: [{
    id: 'x-dsa-2025-h2',
    title: 'X DSA Transparency Report H2 2025',
    publisher: 'X',
    url: 'https://transparency.x.com/en/reports/dsa-transparency-report',
    publishedAt: '2026-02-01',
    accessedAt: '2026-07-20',
    sourceClass: 'primary',
    methodologySummary: 'EU DSA active-recipient disclosure',
    archiveStatus: 'live',
  }],
  snapshots: [{ id: '2026-q2', label: '2026 Q2', periodStart: '2026-04-01', periodEnd: '2026-06-30', verifiedAt: '2026-07-20' }],
  observations: [{
    id: 'x-eu-mau-2025-h2', platformId: 'x', metricId: 'mau', valueType: 'exact', value: 100,
    unit: 'people', periodStart: '2025-07-01', periodEnd: '2025-12-31', publishedAt: '2026-02-01',
    geography: 'eu', segments: [], methodology: 'DSA active recipients', sourceId: 'x-dsa-2025-h2',
    confidence: 'high', comparability: 'same-metric-only', conflictGroupId: null, status: 'current',
    snapshotId: '2026-q2', editorNote: 'EU only',
  }],
  insights: [{
    id: 'x-real-time', title: '实时公共讨论强', summary: '适合热点、科技发布和人物关系连接。',
    audienceGoal: ['technology-creator'], geographies: ['global'], segmentFilters: [],
    evidenceObservationIds: ['x-eu-mau-2025-h2'], evidenceSourceIds: [], confidence: 'reference',
    validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2',
  }],
  comparisons: [{
    id: 'x-realtime', platformId: 'x', dimensionId: 'realtime', rating: 'high',
    quantitativeObservationIds: [], evidenceSourceIds: ['x-dsa-2025-h2'],
    rationale: '事件驱动的信息流与公开关系链。', confidence: 'reference', snapshotId: '2026-q2',
  }],
  coverageGaps: [],
}

assert.deepEqual(validateRepository(fixture).errors, [])

const badSource = structuredClone(fixture)
badSource.observations[0].sourceId = 'missing-source'
assert.ok(validateRepository(badSource).errors.some((error) => error.includes('missing-source')))

const badUnit = structuredClone(fixture)
badUnit.observations[0].unit = 'accounts'
assert.ok(validateRepository(badUnit).errors.some((error) => error.includes('accounts')))

const badDates = structuredClone(fixture)
badDates.observations[0].periodStart = '2026-01-02'
badDates.observations[0].periodEnd = '2026-01-01'
assert.ok(validateRepository(badDates).errors.some((error) => error.includes('periodStart')))

const index = createRepositoryIndex(fixture)
assert.equal(index.sourceById.get('x-dsa-2025-h2').publisher, 'X')

const bundle = getEvidenceBundle(fixture, { kind: 'insight', id: 'x-real-time' })
assert.equal(bundle.subject.id, 'x-real-time')
assert.deepEqual(bundle.sources.map((source) => source.id), ['x-dsa-2025-h2'])
assert.deepEqual(bundle.observations.map((row) => row.id), ['x-eu-mau-2025-h2'])

console.log('[x-intelligence:model] all assertions passed')
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node scripts/test-x-platform-intelligence-model.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `model.mjs`.

- [ ] **Step 3: Implement the repository model**

Create `model.mjs` with:

```js
const VALUE_TYPES = new Set(['exact', 'range', 'percentage', 'index', 'qualitative'])
const CONFIDENCE = new Set(['high', 'reference', 'disputed', 'lead-only'])
const RATINGS = new Set(['high', 'medium', 'low', 'unknown'])

function duplicateIds(items) {
  const seen = new Set()
  return items.map((item) => item.id).filter((id) => seen.has(id) || !seen.add(id))
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

export function createRepositoryIndex(repository) {
  return {
    sourceById: new Map(repository.sources.map((item) => [item.id, item])),
    observationById: new Map(repository.observations.map((item) => [item.id, item])),
    insightById: new Map(repository.insights.map((item) => [item.id, item])),
    comparisonById: new Map(repository.comparisons.map((item) => [item.id, item])),
  }
}

export function validateRepository(repository) {
  const errors = []
  const warnings = []
  const collections = ['platforms', 'metrics', 'sources', 'snapshots', 'observations', 'insights', 'comparisons', 'coverageGaps']
  for (const name of collections) if (!Array.isArray(repository[name])) errors.push(`${name} must be an array`)
  if (errors.length) return { errors, warnings }

  for (const name of collections.filter((name) => name !== 'coverageGaps')) {
    for (const id of duplicateIds(repository[name])) errors.push(`${name} duplicate id: ${id}`)
  }

  const platformIds = new Set(repository.platforms.map((item) => item.id))
  const metricById = new Map(repository.metrics.map((item) => [item.id, item]))
  const sourceIds = new Set(repository.sources.map((item) => item.id))
  const snapshotIds = new Set(repository.snapshots.map((item) => item.id))
  const observationIds = new Set(repository.observations.map((item) => item.id))

  for (const source of repository.sources) {
    if (!validDate(source.publishedAt) || !validDate(source.accessedAt)) errors.push(`source ${source.id} has invalid dates`)
    if (!/^https:\/\//.test(source.url)) errors.push(`source ${source.id} must use https`)
  }

  for (const row of repository.observations) {
    const metric = metricById.get(row.metricId)
    if (!platformIds.has(row.platformId)) errors.push(`observation ${row.id} missing platform ${row.platformId}`)
    if (!metric) errors.push(`observation ${row.id} missing metric ${row.metricId}`)
    if (!sourceIds.has(row.sourceId)) errors.push(`observation ${row.id} missing source ${row.sourceId}`)
    if (!snapshotIds.has(row.snapshotId)) errors.push(`observation ${row.id} missing snapshot ${row.snapshotId}`)
    if (!VALUE_TYPES.has(row.valueType)) errors.push(`observation ${row.id} invalid valueType ${row.valueType}`)
    if (!CONFIDENCE.has(row.confidence)) errors.push(`observation ${row.id} invalid confidence ${row.confidence}`)
    if (metric && !metric.allowedUnits.includes(row.unit)) errors.push(`observation ${row.id} unit ${row.unit} not allowed`)
    if (!validDate(row.periodStart) || !validDate(row.periodEnd) || row.periodStart > row.periodEnd) errors.push(`observation ${row.id} periodStart must not exceed periodEnd`)
    if (row.valueType === 'percentage' && (row.value < 0 || row.value > 100)) errors.push(`observation ${row.id} percentage outside 0..100`)
    if (row.valueType === 'range' && !(row.valueMin <= row.valueMax)) errors.push(`observation ${row.id} invalid range`)
  }

  const conflictCounts = repository.observations.reduce((counts, row) => {
    if (row.conflictGroupId) counts.set(row.conflictGroupId, (counts.get(row.conflictGroupId) || 0) + 1)
    return counts
  }, new Map())
  for (const [groupId, count] of conflictCounts) if (count < 2) errors.push(`conflict group ${groupId} must contain at least two observations`)

  for (const insight of repository.insights) {
    if (!snapshotIds.has(insight.snapshotId)) errors.push(`insight ${insight.id} missing snapshot ${insight.snapshotId}`)
    for (const id of insight.evidenceObservationIds) if (!observationIds.has(id)) errors.push(`insight ${insight.id} missing observation ${id}`)
    for (const id of insight.evidenceSourceIds) if (!sourceIds.has(id)) errors.push(`insight ${insight.id} missing source ${id}`)
    if (insight.confidence === 'lead-only') warnings.push(`insight ${insight.id} is lead-only and must not enter overview`)
  }

  for (const comparison of repository.comparisons) {
    if (!platformIds.has(comparison.platformId)) errors.push(`comparison ${comparison.id} missing platform ${comparison.platformId}`)
    if (!snapshotIds.has(comparison.snapshotId)) errors.push(`comparison ${comparison.id} missing snapshot ${comparison.snapshotId}`)
    if (!RATINGS.has(comparison.rating)) errors.push(`comparison ${comparison.id} invalid rating ${comparison.rating}`)
    if (!comparison.quantitativeObservationIds.length && !comparison.evidenceSourceIds.length) errors.push(`comparison ${comparison.id} has no evidence`)
    for (const id of comparison.quantitativeObservationIds) if (!observationIds.has(id)) errors.push(`comparison ${comparison.id} missing observation ${id}`)
    for (const id of comparison.evidenceSourceIds) if (!sourceIds.has(id)) errors.push(`comparison ${comparison.id} missing source ${id}`)
  }

  return { errors, warnings }
}

export function getEvidenceBundle(repository, evidenceRef) {
  const index = createRepositoryIndex(repository)
  const map = evidenceRef.kind === 'observation' ? index.observationById : evidenceRef.kind === 'insight' ? index.insightById : index.comparisonById
  const subject = map.get(evidenceRef.id)
  if (!subject) return { subject: null, sources: [], observations: [], conflicts: [] }
  const observationIds = evidenceRef.kind === 'observation' ? [subject.id] : subject.evidenceObservationIds || subject.quantitativeObservationIds || []
  const observations = observationIds.map((id) => index.observationById.get(id)).filter(Boolean)
  const sourceIds = new Set([...(subject.evidenceSourceIds || []), ...observations.map((row) => row.sourceId)])
  const conflicts = observations.filter((row) => row.conflictGroupId).flatMap((row) => repository.observations.filter((candidate) => candidate.conflictGroupId === row.conflictGroupId))
  return { subject, observations, sources: [...sourceIds].map((id) => index.sourceById.get(id)).filter(Boolean), conflicts: [...new Map(conflicts.map((row) => [row.id, row])).values()] }
}
```

- [ ] **Step 4: Run the model test**

Run: `node scripts/test-x-platform-intelligence-model.mjs`

Expected: `[x-intelligence:model] all assertions passed`.

- [ ] **Step 5: Commit the domain contract**

```bash
git add 'app/(site)/x-platform-intelligence/model.mjs' scripts/test-x-platform-intelligence-model.mjs
git commit -m "test: define X intelligence data contract"
```

---

### Task 2: Source-Backed 2026 Q2 Repository

**Files:**
- Create: `app/(site)/x-platform-intelligence/data.mjs`
- Modify: `scripts/test-x-platform-intelligence-model.mjs`

**Interfaces:**
- Consumes: validation contract from Task 1.
- Produces: `X_INTELLIGENCE_REPOSITORY` and all evidence IDs used by UI tasks.

- [ ] **Step 1: Add failing coverage assertions**

Append to the model test:

```js
const { X_INTELLIGENCE_REPOSITORY } = await import('../app/(site)/x-platform-intelligence/data.mjs')
const result = validateRepository(X_INTELLIGENCE_REPOSITORY)
assert.deepEqual(result.errors, [], result.errors.join('\n'))
assert.deepEqual(X_INTELLIGENCE_REPOSITORY.platforms.map((item) => item.id).sort(), [
  'facebook', 'instagram', 'jike', 'linkedin', 'reddit', 'threads', 'wechat-oa', 'weibo', 'xiaohongshu', 'x', 'zhihu', 'tiktok',
].sort())
assert.ok(X_INTELLIGENCE_REPOSITORY.sources.length >= 30)
assert.ok(X_INTELLIGENCE_REPOSITORY.observations.length >= 60)
assert.ok(X_INTELLIGENCE_REPOSITORY.insights.length >= 12)
assert.equal(X_INTELLIGENCE_REPOSITORY.comparisons.length, 12 * 16)
assert.ok(X_INTELLIGENCE_REPOSITORY.observations.some((row) => row.platformId === 'x' && row.metricId === 'mau' && row.conflictGroupId === 'x-global-mau-2025'))
assert.ok(X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => gap.platformId === 'jike'))
```

- [ ] **Step 2: Run the test to verify the repository is missing**

Run: `node scripts/test-x-platform-intelligence-model.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `data.mjs`.

- [ ] **Step 3: Re-verify every source before recording data**

Browse and record `publishedAt`, `accessedAt=2026-07-20`, methodology, geography and metric definition for this exact source floor:

```text
X: DSA H2 2025 report; EU AMARS history; X Ads audience planning data; Premium;
Creator Revenue Sharing; Creator Subscriptions; organic and creative best practices;
historical recommendation-algorithm repository; applicable EU Commission DSA decisions.

Independent X measurement: Pew 2025 Social Media Fact Sheet; Pew X user experience;
Pew X news influencers; Ofcom Online Nation 2025; DataReportal Essential X Stats;
Similarweb or Sensor Tower current daily-use trend; at least one method-published academic dataset.

Global comparisons: Meta Threads 500M official announcement; Meta annual/quarterly filing;
Reddit FY2025 results; LinkedIn FY2025 official highlights; TikTok H2 2025 DSA report.

Chinese comparisons: Weibo FY2025 results/20-F; Zhihu FY2025 results/20-F;
Tencent FY2025 materials for WeChat; Xiaohongshu official commercial/user materials plus one
method-disclosed independent estimate; Jike official product material plus one independent estimate.
```

If a listed source is unavailable, create a `coverageGaps` record with `reason`, `attemptedSourceUrl`, `checkedAt`, and `impact`; do not substitute an unattributed number.

- [ ] **Step 4: Create the repository with explicit taxonomies**

Start `data.mjs` with these exact IDs:

```js
export const PLATFORM_GROUPS = ['focus', 'global', 'china']
export const COMPARISON_DIMENSIONS = [
  'reach', 'realtime', 'content-longevity', 'search-value', 'professional-relationships',
  'public-conversation', 'external-links', 'algorithmic-distribution', 'follow-graph',
  'chinese-reach', 'internationalization', 'production-cost', 'native-monetization',
  'private-audience', 'brand-safety', 'data-transparency',
]

const platforms = [
  ['x', 'X', 'focus'], ['threads', 'Threads', 'global'], ['facebook', 'Facebook', 'global'],
  ['instagram', 'Instagram', 'global'], ['tiktok', 'TikTok', 'global'], ['reddit', 'Reddit', 'global'],
  ['linkedin', 'LinkedIn', 'global'], ['weibo', '微博', 'china'], ['zhihu', '知乎', 'china'],
  ['xiaohongshu', '小红书', 'china'], ['wechat-oa', '微信公众号', 'china'], ['jike', '即刻', 'china'],
].map(([id, name, group]) => ({ id, name, group }))

const metrics = [
  ['dau', 'DAU', ['people']], ['mau', 'MAU', ['people']], ['ad-reach', '广告可触达人数', ['people']],
  ['monthly-visitors', '月访问者', ['people']], ['daily-minutes', '日均使用时长', ['minutes']],
  ['country-share', '国家受众占比', ['percent']], ['internet-penetration', '互联网人口渗透率', ['percent']],
  ['age-share', '年龄占比', ['percent']], ['gender-share', '性别占比', ['percent']],
  ['income-use-rate', '收入人群使用率', ['percent']], ['education-use-rate', '教育人群使用率', ['percent']],
  ['news-use-rate', '新闻使用率', ['percent']], ['creator-threshold', '创作者门槛', ['qualitative']],
  ['post-volume', '发布量', ['posts']], ['engagement-rate', '互动率', ['percent']],
].map(([id, label, allowedUnits]) => ({ id, label, allowedUnits }))

const snapshots = [{
  id: '2026-q2', label: '2026 Q2', periodStart: '2026-04-01', periodEnd: '2026-06-30',
  verifiedAt: '2026-07-20', summary: '私有化后的 X 数据透明度有限；规模需用多来源区间理解。', previousSnapshotId: null,
}]
```

Populate `sources`, `observations`, `insights`, `comparisons`, and `coverageGaps` with complete records matching the design schema. Create exactly one comparison record for every `platform × COMPARISON_DIMENSIONS` pair. Use `rating: 'unknown'` with evidence and a gap rationale when a comparative judgment cannot be supported.

Export:

```js
export const X_INTELLIGENCE_REPOSITORY = Object.freeze({
  platforms, metrics, sources, snapshots, observations, insights, comparisons, coverageGaps,
})
```

- [ ] **Step 5: Run repository validation**

Run: `node scripts/test-x-platform-intelligence-model.mjs`

Expected: all assertions pass; no missing sources, invalid units, orphan evidence or incomplete comparison cells.

- [ ] **Step 6: Manually audit contentious X metrics**

Inspect the repository and verify these conditions:

```text
X global MAU self-reports and independent estimates share conflictGroupId=x-global-mau-2025.
X EU active recipients remain EU-only and never appear as global MAU.
X ad reach observations use metricId=ad-reach, never metricId=mau.
Pew usage rates retain geography=us and survey sample notes.
Ofcom time-spent data retains geography=uk and device scope.
LinkedIn member count is not labeled MAU.
WeChat official-account reach is not inferred from total WeChat MAU.
Jike unknowns are explicit coverage gaps.
```

- [ ] **Step 7: Commit the evidence repository**

```bash
git add 'app/(site)/x-platform-intelligence/data.mjs' scripts/test-x-platform-intelligence-model.mjs
git commit -m "feat: add source-backed X intelligence dataset"
```

---

### Task 3: Filters, Shareable URL State, and CSV

**Files:**
- Create: `app/(site)/x-platform-intelligence/filters.mjs`
- Create: `scripts/test-x-platform-intelligence-filters.mjs`

**Interfaces:**
- Consumes: `X_INTELLIGENCE_REPOSITORY`.
- Produces: `DEFAULT_FILTERS`, `parseFilterParams`, `serializeFilterParams`, `filterObservations`, `buildEvidenceCsv`.

- [ ] **Step 1: Write failing filter tests**

```js
import assert from 'node:assert/strict'
import { X_INTELLIGENCE_REPOSITORY as repository } from '../app/(site)/x-platform-intelligence/data.mjs'
import {
  DEFAULT_FILTERS, buildEvidenceCsv, filterObservations, parseFilterParams, serializeFilterParams,
} from '../app/(site)/x-platform-intelligence/filters.mjs'

assert.deepEqual(parseFilterParams(new URLSearchParams(), repository), DEFAULT_FILTERS)

const parsed = parseFilterParams(new URLSearchParams('snapshot=bad&geo=us&goal=technology-creator&platforms=x,weibo,bad&confidence=high,disputed'), repository)
assert.equal(parsed.snapshotId, '2026-q2')
assert.equal(parsed.geography, 'us')
assert.deepEqual(parsed.platformIds, ['x', 'weibo'])
assert.deepEqual(parsed.confidences, ['high', 'disputed'])

const serialized = serializeFilterParams({ ...DEFAULT_FILTERS, geography: 'us', platformIds: ['x', 'reddit'] })
assert.equal(serialized.toString(), 'geo=us&platforms=x%2Creddit')

const rows = filterObservations(repository, { ...DEFAULT_FILTERS, geography: 'us', platformIds: ['x'] })
assert.ok(rows.length > 0)
assert.ok(rows.every((row) => row.platformId === 'x' && (row.geography === 'us' || row.geography === 'global')))

const csv = buildEvidenceCsv([{ metric: 'MAU', value: '区间', source: 'X, Inc.', note: '含“冲突”' }])
assert.equal(csv, '\uFEFFmetric,value,source,note\r\nMAU,区间,"X, Inc.","含“冲突”"\r\n')

console.log('[x-intelligence:filters] all assertions passed')
```

- [ ] **Step 2: Run the test to verify failure**

Run: `node scripts/test-x-platform-intelligence-filters.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `filters.mjs`.

- [ ] **Step 3: Implement filter and CSV functions**

Use this state contract:

```js
export const DEFAULT_FILTERS = Object.freeze({
  snapshotId: '2026-q2', geography: 'global', segment: 'all', goal: 'technology-creator',
  platformIds: ['x'], confidences: ['high', 'reference', 'disputed'],
})
```

Implementation requirements:

```text
parseFilterParams accepts URLSearchParams, drops unknown platform/confidence values, and falls back to 2026-q2.
serializeFilterParams omits values equal to DEFAULT_FILTERS and writes keys in snapshot, geo, segment, goal, platforms, confidence order.
filterObservations always enforces snapshot, platform and confidence; geography=global accepts global rows only, while a country accepts country and global context rows.
buildEvidenceCsv emits UTF-8 BOM, CRLF, fixed caller-provided column order, and RFC 4180 quoting for commas, quotes and newlines.
```

- [ ] **Step 4: Run filter tests**

Run: `node scripts/test-x-platform-intelligence-filters.mjs`

Expected: `[x-intelligence:filters] all assertions passed`.

- [ ] **Step 5: Commit filter behavior**

```bash
git add 'app/(site)/x-platform-intelligence/filters.mjs' scripts/test-x-platform-intelligence-filters.mjs
git commit -m "feat: add shareable X intelligence filters"
```

---

### Task 4: Module Selectors and Comparison Safety

**Files:**
- Create: `app/(site)/x-platform-intelligence/selectors.mjs`
- Create: `scripts/test-x-platform-intelligence-selectors.mjs`

**Interfaces:**
- Consumes: repository and `FilterState`.
- Produces: all `select*` functions from Shared Interfaces.

- [ ] **Step 1: Write failing selector tests**

```js
import assert from 'node:assert/strict'
import { X_INTELLIGENCE_REPOSITORY as repository } from '../app/(site)/x-platform-intelligence/data.mjs'
import { DEFAULT_FILTERS } from '../app/(site)/x-platform-intelligence/filters.mjs'
import {
  selectAudienceGroups, selectComparisonMatrix, selectEvidenceRows, selectGeoRows,
  selectOperationalInsights, selectOverview, selectScaleTrends,
} from '../app/(site)/x-platform-intelligence/selectors.mjs'

const overview = selectOverview(repository, DEFAULT_FILTERS)
assert.ok(overview.insights.length >= 3)
assert.ok(overview.insights.every((item) => item.confidence !== 'lead-only'))

const scale = selectScaleTrends(repository, DEFAULT_FILTERS)
assert.ok(scale.groups.some((group) => group.metricId === 'mau' && group.conflict))
for (const series of scale.comparableSeries) assert.equal(new Set(series.rows.map((row) => `${row.metricId}:${row.unit}:${row.geography}`)).size, 1)

assert.ok(selectGeoRows(repository, DEFAULT_FILTERS).every((row) => row.metricId === 'country-share' || row.metricId === 'internet-penetration'))
assert.ok(selectAudienceGroups(repository, { ...DEFAULT_FILTERS, geography: 'us' }).every((group) => group.geography === 'us'))
assert.ok(selectOperationalInsights(repository, DEFAULT_FILTERS).some((item) => item.audienceGoal.includes('technology-creator')))

const matrix = selectComparisonMatrix(repository, { ...DEFAULT_FILTERS, platformIds: repository.platforms.map((item) => item.id) })
assert.equal(matrix.rows.length, 12)
assert.ok(matrix.rows.every((row) => row.cells.length === 16))

const evidenceRows = selectEvidenceRows(repository, DEFAULT_FILTERS)
assert.ok(evidenceRows.every((row) => row.sourceUrl.startsWith('https://')))

console.log('[x-intelligence:selectors] all assertions passed')
```

- [ ] **Step 2: Run the test to verify failure**

Run: `node scripts/test-x-platform-intelligence-selectors.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `selectors.mjs`.

- [ ] **Step 3: Implement selectors with explicit outputs**

Return these shapes:

```js
selectOverview(...) // { snapshot, headlineMetrics, insights, changeNotes, transparencyNote }
selectScaleTrends(...) // { groups: [{ metricId, label, rows, conflict }], comparableSeries: [{ key, rows }] }
selectGeoRows(...) // [{ observationId, country, metricId, value, unit, confidence, sourceId }]
selectAudienceGroups(...) // [{ key, metricId, geography, segmentLabel, rows }]
selectOperationalInsights(...) // Insight[] ordered high, reference, disputed
selectComparisonMatrix(...) // { dimensions, rows: [{ platform, cells: [{ comparisonId, dimensionId, rating, confidence }] }] }
selectEvidenceRows(...) // flat rows with sourceTitle, sourceUrl, period, geography, methodology, conflictGroupId
```

`selectScaleTrends` may only create a `comparableSeries` group when every row shares `metricId`, `unit`, `geography`, `periodStart`, `periodEnd`, and compatible methodology. Conflicting rows remain in `groups` and set `conflict: true`.

- [ ] **Step 4: Run selector tests**

Run: `node scripts/test-x-platform-intelligence-selectors.mjs`

Expected: `[x-intelligence:selectors] all assertions passed`.

- [ ] **Step 5: Commit selector layer**

```bash
git add 'app/(site)/x-platform-intelligence/selectors.mjs' scripts/test-x-platform-intelligence-selectors.mjs
git commit -m "feat: add X intelligence view selectors"
```

---

### Task 5: Route, Directory Registration, SEO, and Page Shell

**Files:**
- Create: `app/(site)/x-platform-intelligence/page.jsx`
- Create: `app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx`
- Create: `app/(site)/x-platform-intelligence/components/FilterBar.jsx`
- Modify: `lib/engineeringWorks.js`
- Modify: `lib/richPageSeo.js`

**Interfaces:**
- Consumes: repository, filters, selectors.
- Produces: a buildable static page with visible header, filters and placeholder module sections ready for Tasks 6–9.

- [ ] **Step 1: Register the directory item and SEO before the route exists**

Add to `ENGINEERING_WORKS`:

```js
{
  id: 'x-platform-intelligence',
  category: 'data-visualization',
  title: 'X 平台情报图谱',
  summary: '从活跃规模、国家分布、用户画像、内容机制、创作者经营和平台差异理解 X；把官方披露、独立调查和第三方估算拆开，支持季度、地区、人群、目标、平台与可信度筛选。',
  date: '2026-07-20',
  href: '/x-platform-intelligence',
  kind: '社交平台情报图谱',
  badge: 'New',
},
```

Add `SEO_OVERRIDES['x-platform-intelligence']`:

```js
{
  metadataTitle: 'X 平台用户、国家、画像与创作者经营｜多维情报图谱',
  description: 'X（Twitter）平台季度情报图谱：核验 DAU、MAU、广告受众、国家分布和用户画像，比较 Threads、Reddit、微博、知乎、小红书等平台，并给出中文科技创作者经营建议。',
  keywords: ['X 平台', 'Twitter 用户数据', 'X 月活', 'X 日活', 'X 用户画像', 'X 国家分布', 'X 创作者', '社交媒体分析'],
  schemaType: 'Dataset',
  about: ['X', 'Twitter', '社交媒体分析', '创作者经济'],
}
```

- [ ] **Step 2: Run a build to verify the missing route is visible as incomplete work**

Run: `npm run build:check`

Expected: build succeeds because directory registration does not require the target route to exist yet. The plan does not claim the feature is usable until Step 6 verifies the new route.

- [ ] **Step 3: Create the static page entry**

```jsx
import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import XPlatformIntelligenceClient from './XPlatformIntelligenceClient'

export const dynamic = 'force-static'
export const metadata = createRichPageMetadata('x-platform-intelligence')

export default function XPlatformIntelligencePage() {
  return <><RichPageJsonLd pageId="x-platform-intelligence" /><XPlatformIntelligenceClient /></>
}
```

- [ ] **Step 4: Create the client shell and URL synchronization**

Implement one state object initialized with `DEFAULT_FILTERS`, one `evidenceRef` state, and two effects:

```jsx
useEffect(() => {
  setFilters(parseFilterParams(new URLSearchParams(window.location.search), repository))
}, [])

useEffect(() => {
  const query = serializeFilterParams(filters).toString()
  window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
}, [filters])
```

Render a semantic `<main>` with header, snapshot stamp, `SharePageButton`, `FilterBar`, and `<section id>` placeholders for `overview`, `scale`, `geography`, `audience`, `content`, `creator`, `comparison`, `risk`, and `evidence`.

- [ ] **Step 5: Implement FilterBar**

Render labeled native `<select>` controls for snapshot, geography, segment and goal; checkbox/popover groups for platforms and confidence. Emit full next state via `onChange(nextFilters)`. Display `筛选影响 7 / 9 个模块；风险与完整证据账本保留全局范围` and a “清除筛选” button that restores `DEFAULT_FILTERS`.

- [ ] **Step 6: Build and inspect directory/SEO integration**

Run: `npm run build:check`

Expected: build succeeds; output includes `/x-platform-intelligence`; `createRichPageMetadata` does not throw.

- [ ] **Step 7: Commit page registration and shell**

```bash
git add 'app/(site)/x-platform-intelligence/page.jsx' 'app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx' 'app/(site)/x-platform-intelligence/components/FilterBar.jsx' lib/engineeringWorks.js lib/richPageSeo.js
git commit -m "feat: register X platform intelligence page"
```

---

### Task 6: Overview, Scale, Geography, and Audience Modules

**Files:**
- Create: `app/(site)/x-platform-intelligence/components/Overview.jsx`
- Create: `app/(site)/x-platform-intelligence/components/ScaleTrends.jsx`
- Create: `app/(site)/x-platform-intelligence/components/GeoExplorer.jsx`
- Create: `app/(site)/x-platform-intelligence/components/AudienceProfile.jsx`
- Modify: `app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx`

**Interfaces:**
- Consumes: selector outputs and `onOpenEvidence(evidenceRef)`.
- Produces: accessible quantitative and demographic sections.

- [ ] **Step 1: Wire selector outputs before components exist**

In the client, memoize:

```jsx
const overview = useMemo(() => selectOverview(repository, filters), [filters])
const scale = useMemo(() => selectScaleTrends(repository, filters), [filters])
const geoRows = useMemo(() => selectGeoRows(repository, filters), [filters])
const audienceGroups = useMemo(() => selectAudienceGroups(repository, filters), [filters])
```

Render the four components. Run `npm run build:check` and expect module-not-found failures for the new component files.

- [ ] **Step 2: Implement Overview**

Render:

```text
Snapshot label and verified date.
Headline metric cards with valueType-aware exact/range formatting.
Confidence text badge on every card.
Three to five non-lead-only insight buttons.
Quarter change notes and transparency note.
```

Metric and insight buttons call `onOpenEvidence({ kind: 'observation', id })` or `{ kind: 'insight', id }`.

- [ ] **Step 3: Implement ScaleTrends**

Render separate groups for MAU, DAU, ad reach, monthly visitors, daily minutes and post volume. Use small inline SVG only for `comparableSeries`; use a source-by-source table for conflict groups. Label axes, include `<caption className="sr-only">`, and render `不可直接比较` when definitions differ.

- [ ] **Step 4: Implement GeoExplorer**

Render a CSS/SVG dot map for supported countries plus a sortable accessible table. Provide metric toggle only between `country-share` and `internet-penetration`; never infer missing countries. Each row shows period and source confidence.

- [ ] **Step 5: Implement AudienceProfile**

Render age, gender, income, education and news-use groups as horizontal bars plus exact text values. Group by geography and methodology so U.S. survey data never appears as global. Every group displays sample/method summary and source link.

- [ ] **Step 6: Build and manually test filters**

Run: `npm run build:check`

Expected: build succeeds.

Start: `npm run dev`

Verify at `/x-platform-intelligence?geo=us&platforms=x&confidence=high%2Creference`:

```text
URL state survives reload.
US profile groups do not claim global coverage.
MAU conflicts remain separate rows.
Ad reach is labeled ad reach.
Every visible number opens evidence.
```

- [ ] **Step 7: Commit quantitative modules**

```bash
git add 'app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx' 'app/(site)/x-platform-intelligence/components/Overview.jsx' 'app/(site)/x-platform-intelligence/components/ScaleTrends.jsx' 'app/(site)/x-platform-intelligence/components/GeoExplorer.jsx' 'app/(site)/x-platform-intelligence/components/AudienceProfile.jsx'
git commit -m "feat: visualize X audience and scale evidence"
```

---

### Task 7: Content Mechanics, Creator Playbook, and Risks

**Files:**
- Create: `app/(site)/x-platform-intelligence/components/ContentMechanics.jsx`
- Create: `app/(site)/x-platform-intelligence/components/CreatorPlaybook.jsx`
- Create: `app/(site)/x-platform-intelligence/components/RiskRegister.jsx`
- Modify: `app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx`

**Interfaces:**
- Consumes: `selectOperationalInsights(repository, filters)` and risk/content insight categories.
- Produces: decision-oriented qualitative modules with evidence links.

- [ ] **Step 1: Add category coverage assertions**

Append to selector tests:

```js
const operational = selectOperationalInsights(repository, DEFAULT_FILTERS)
for (const category of ['content', 'distribution', 'creator-fit', 'monetization', 'platform-risk', 'creator-risk']) {
  assert.ok(operational.some((item) => item.category === category), `missing ${category}`)
}
```

Run: `node scripts/test-x-platform-intelligence-selectors.mjs`

Expected: FAIL if any category is absent; add evidence-backed insight records to `data.mjs` until it passes.

- [ ] **Step 2: Implement ContentMechanics**

Render separate cards for formats, discovery surfaces, relationship propagation, content lifespan, search value and external-link behavior. Every card shows evidence type: `当前产品规则`, `监管材料`, `历史开源代码`, `独立研究`, or `编辑推断`.

- [ ] **Step 3: Implement CreatorPlaybook**

Use three explicit verdict groups:

```text
适合 X：科技发布、实时评论、国际同行关系、人物型账号。
适合作为组合渠道：教程、长尾知识、中文大众内容、私域经营。
不适合只做 X：依赖稳定搜索沉淀、强站内交易或低互动批量分发的目标。
```

Derive displayed items from evidence-backed insights rather than hard-coded prose. Include monetization eligibility, payout geography, subscription, revenue-sharing stability and external conversion paths.

- [ ] **Step 4: Implement RiskRegister**

Split into `平台层风险` and `创作者经营风险`. Each item displays severity text, confidence, current/changed status, last verified date and evidence button. Risk severity uses text and icon in addition to color.

- [ ] **Step 5: Run tests and build**

Run:

```bash
node scripts/test-x-platform-intelligence-selectors.mjs
npm run build:check
```

Expected: selector assertions and build pass.

- [ ] **Step 6: Commit decision modules**

```bash
git add 'app/(site)/x-platform-intelligence/data.mjs' 'app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx' 'app/(site)/x-platform-intelligence/components/ContentMechanics.jsx' 'app/(site)/x-platform-intelligence/components/CreatorPlaybook.jsx' 'app/(site)/x-platform-intelligence/components/RiskRegister.jsx' scripts/test-x-platform-intelligence-selectors.mjs
git commit -m "feat: add X creator strategy and risk guidance"
```

---

### Task 8: Platform Matrix and Evidence Drawer

**Files:**
- Create: `app/(site)/x-platform-intelligence/components/PlatformMatrix.jsx`
- Create: `app/(site)/x-platform-intelligence/components/EvidenceDrawer.jsx`
- Modify: `app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx`

**Interfaces:**
- Consumes: `selectComparisonMatrix`, `getEvidenceBundle`, `evidenceRef`.
- Produces: 12-platform × 16-dimension matrix and one accessible evidence drawer.

- [ ] **Step 1: Add evidence-bundle coverage tests for every comparison**

Append to model tests:

```js
for (const comparison of X_INTELLIGENCE_REPOSITORY.comparisons) {
  const bundle = getEvidenceBundle(X_INTELLIGENCE_REPOSITORY, { kind: 'comparison', id: comparison.id })
  assert.ok(bundle.subject)
  assert.ok(bundle.sources.length > 0 || bundle.observations.length > 0)
}
```

Run: `node scripts/test-x-platform-intelligence-model.mjs` and ensure it passes.

- [ ] **Step 2: Implement PlatformMatrix**

Render tabs `全球平台` and `中文平台`, with X pinned as the first row in both. Desktop uses a horizontally scrollable table; mobile uses one dimension at a time. Each cell includes rating text, confidence text and an evidence button calling `{ kind: 'comparison', id: comparisonId }`. `unknown` displays `未知`, never a neutral-looking score.

- [ ] **Step 3: Implement EvidenceDrawer**

The drawer must:

```text
Use role=dialog, aria-modal=true, an accessible title and close button.
Close on Escape and backdrop click.
Move focus to close button on open and return focus to the triggering element on close.
Show subject, metric definition/rationale, observation table, conflict records and original HTTPS links.
Label source class, methodology, geography, period, confidence and archive status.
Render “未找到证据记录” without crashing for an invalid reference.
```

- [ ] **Step 4: Wire matrix and drawer**

Memoize matrix from current filters. When `evidenceRef` is non-null, call `getEvidenceBundle(repository, evidenceRef)` and render the drawer. Preserve filters when opening and closing.

- [ ] **Step 5: Build and keyboard-test**

Run: `npm run build:check`.

Manual check:

```text
Tab reaches every matrix cell action.
Enter opens the correct evidence.
Escape closes.
Focus returns to the same cell.
X remains first in both comparison groups.
No cell relies only on color.
```

- [ ] **Step 6: Commit comparison and evidence interaction**

```bash
git add 'app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx' 'app/(site)/x-platform-intelligence/components/PlatformMatrix.jsx' 'app/(site)/x-platform-intelligence/components/EvidenceDrawer.jsx' scripts/test-x-platform-intelligence-model.mjs
git commit -m "feat: add evidence-backed platform comparison"
```

---

### Task 9: Evidence Ledger, CSV Export, and Verification Command

**Files:**
- Create: `app/(site)/x-platform-intelligence/components/EvidenceLedger.jsx`
- Modify: `app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `selectEvidenceRows`, `buildEvidenceCsv`.
- Produces: filterable evidence table, current-view CSV download and one repository check command.

- [ ] **Step 1: Add the verification script to package.json**

```json
"x-intelligence:check": "node scripts/test-x-platform-intelligence-model.mjs && node scripts/test-x-platform-intelligence-filters.mjs && node scripts/test-x-platform-intelligence-selectors.mjs"
```

- [ ] **Step 2: Run the consolidated command**

Run: `npm run x-intelligence:check`

Expected: all three `[x-intelligence:*] all assertions passed` messages.

- [ ] **Step 3: Implement EvidenceLedger**

Render a semantic table with columns:

```text
平台 | 指标 | 数值 | 统计期 | 地区/人群 | 来源 | 口径 | 可信度 | 冲突状态
```

Support local text search and sorting by platform, metric, period and confidence. Search operates after global filters, not instead of them. Each source opens in a new tab with `rel="noreferrer"`.

- [ ] **Step 4: Implement current-view CSV download**

Convert only currently filtered evidence rows using `buildEvidenceCsv`, then:

```js
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
const url = URL.createObjectURL(blob)
const anchor = document.createElement('a')
anchor.href = url
anchor.download = `x-platform-intelligence-${filters.snapshotId}.csv`
anchor.click()
URL.revokeObjectURL(url)
```

Button text must state the exported row count.

- [ ] **Step 5: Add the ledger to the client and build**

Run:

```bash
npm run x-intelligence:check
npm run build:check
```

Expected: tests and build pass.

- [ ] **Step 6: Inspect CSV output**

Export a view containing Chinese text, commas and quotation marks. Open it in a spreadsheet and verify UTF-8 Chinese, CRLF rows, quoted commas and the filename snapshot.

- [ ] **Step 7: Commit the ledger and verification command**

```bash
git add 'app/(site)/x-platform-intelligence/XPlatformIntelligenceClient.jsx' 'app/(site)/x-platform-intelligence/components/EvidenceLedger.jsx' package.json
git commit -m "feat: add X intelligence evidence ledger"
```

---

### Task 10: Responsive, Accessibility, SEO, and Cloudflare Release Verification

**Files:**
- Modify: page components only where verification finds defects.
- Modify: `app/(site)/x-platform-intelligence/data.mjs` only for evidence corrections found during final audit.

**Interfaces:**
- Consumes: the complete page.
- Produces: release-ready, source-traceable static page.

- [ ] **Step 1: Run all deterministic checks**

```bash
npm run x-intelligence:check
npm run style:check
npm run security:check
npm run build:check
```

Expected: every command exits 0.

- [ ] **Step 2: Verify static route and metadata**

Run the dev server and inspect `/x-platform-intelligence` and `/rich-pages`:

```text
The route is present in the directory under 数据可视化.
Title, description, canonical, Open Graph, Twitter metadata and Dataset JSON-LD are present.
The page uses the site presentation and does not hide the main site chrome.
The default content is readable before interaction.
```

- [ ] **Step 3: Verify every global filter and URL state**

Exercise snapshot, geography, segment, goal, comparison platform and confidence filters individually and in combination. Reload copied URLs. Invalid values such as `?snapshot=bad&platforms=bad` must return the default state without an error.

- [ ] **Step 4: Verify desktop and mobile layouts**

At 1440px, 1024px, 768px and 390px widths verify:

```text
No horizontal page overflow; only matrix/table containers may scroll.
Filter controls remain labeled and usable.
Metric cards do not truncate definitions.
Comparison switches to dimension-at-a-time on mobile.
Evidence drawer fits viewport and its content scrolls internally.
```

- [ ] **Step 5: Verify accessibility**

Keyboard-walk the entire page; check visible focus, semantic headings, table captions, dialog focus return, Escape close, form labels, link names and text alternatives. Temporarily disable color perception by checking that every confidence and rating remains available as text.

- [ ] **Step 6: Perform the final source audit**

For every overview metric, overview insight, creator verdict and comparison dimension opened from the default view:

```text
Original link resolves or is marked unavailable.
Publisher and publication date match the source.
Period, geography, population and device scope match the recorded methodology.
No ad-reach value is labeled MAU.
No member/registered-account number is labeled active users.
No lead-only source appears in the overview.
Conflict groups show all material competing values.
```

- [ ] **Step 7: Run the public Cloudflare build**

Run: `npm run pages:build:public`

Expected: Cloudflare public build completes and includes `/x-platform-intelligence`.

- [ ] **Step 8: Review the final diff for scope**

Run:

```bash
git status --short
git diff --check
git diff --stat -- 'app/(site)/x-platform-intelligence' package.json lib/engineeringWorks.js lib/richPageSeo.js
```

Expected: the scoped diff contains only X intelligence files, `package.json`, `lib/engineeringWorks.js`, and `lib/richPageSeo.js`. `git status --short` may still show the user's unrelated SEO work, but none of it is staged or modified by this plan.

- [ ] **Step 9: Commit final verification corrections**

If Step 2–8 required corrections, stage only the files changed for this feature and commit:

```bash
git add 'app/(site)/x-platform-intelligence' package.json lib/engineeringWorks.js lib/richPageSeo.js
git commit -m "fix: finalize X intelligence accessibility and evidence"
```

If no correction was required, do not create an empty commit.

---

## Completion Checklist

- [ ] `npm run x-intelligence:check` passes.
- [ ] `npm run style:check` passes.
- [ ] `npm run security:check` passes.
- [ ] `npm run build:check` passes.
- [ ] `npm run pages:build:public` passes.
- [ ] `/x-platform-intelligence` is listed in `/rich-pages` and sitemap generation includes it automatically.
- [ ] Default and shared filter URLs survive reload.
- [ ] Every core number and decision claim opens evidence.
- [ ] X data conflicts are visible rather than averaged.
- [ ] Global and Chinese platform groups both provide 16-dimension comparisons.
- [ ] Mobile, keyboard, empty-state and CSV checks pass.
- [ ] Unrelated working-tree changes are neither overwritten nor committed.
