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

const badCalendarDate = structuredClone(fixture)
badCalendarDate.sources[0].publishedAt = '2026-02-30'
assert.ok(validateRepository(badCalendarDate).errors.some((error) => error.includes('invalid dates')))

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

console.log('[x-intelligence:model] all assertions passed')
