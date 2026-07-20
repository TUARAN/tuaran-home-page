'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'
import { X_INTELLIGENCE_REPOSITORY as repository } from './data.mjs'
import { DEFAULT_FILTERS, parseFilterParams, serializeFilterParams } from './filters.mjs'
import { getEvidenceBundle } from './model.mjs'
import {
  selectAudienceGroups,
  selectComparisonMatrix,
  selectEvidenceRows,
  selectGeoRows,
  selectOperationalInsights,
  selectOverview,
  selectScaleTrends,
} from './selectors.mjs'
import AudienceProfile from './components/AudienceProfile'
import ContentMechanics from './components/ContentMechanics'
import CreatorPlaybook from './components/CreatorPlaybook'
import EvidenceDrawer from './components/EvidenceDrawer'
import EvidenceLedger from './components/EvidenceLedger'
import FilterBar from './components/FilterBar'
import GeoExplorer from './components/GeoExplorer'
import Overview from './components/Overview'
import PlatformMatrix from './components/PlatformMatrix'
import RiskRegister from './components/RiskRegister'
import ScaleTrends from './components/ScaleTrends'

const PAGE_URL = 'https://2aran.com/x-platform-intelligence'

export default function XPlatformIntelligenceClient() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [evidenceRef, setEvidenceRef] = useState(null)

  useEffect(() => {
    setFilters(parseFilterParams(new URLSearchParams(window.location.search), repository))
  }, [])

  useEffect(() => {
    const query = serializeFilterParams(filters).toString()
    window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
  }, [filters])

  const snapshot = repository.snapshots.find((item) => item.id === filters.snapshotId)
  const overview = useMemo(() => selectOverview(repository, filters), [filters])
  const scale = useMemo(() => selectScaleTrends(repository, filters), [filters])
  const geoRows = useMemo(() => selectGeoRows(repository, filters), [filters])
  const geoCoverageGaps = useMemo(() => repository.coverageGaps.filter((gap) => (
    filters.platformIds.includes(gap.platformId)
    && (gap.metricId === 'country-share' || gap.metricId === 'internet-penetration')
  )), [filters])
  const audienceGroups = useMemo(() => selectAudienceGroups(repository, filters), [filters])
  const operationalInsights = useMemo(() => selectOperationalInsights(repository, filters), [filters])
  const riskInsights = useMemo(() => selectOperationalInsights(repository, {
    ...filters,
    geography: 'global',
    segment: 'all',
    goal: DEFAULT_FILTERS.goal,
  }), [filters])
  const comparisonMatrix = useMemo(() => selectComparisonMatrix(repository, filters), [filters])
  const evidenceRows = useMemo(() => selectEvidenceRows(repository, filters), [filters])
  const evidenceBundle = useMemo(() => (
    evidenceRef ? getEvidenceBundle(repository, evidenceRef) : null
  ), [evidenceRef])
  const closeEvidence = useCallback(() => setEvidenceRef(null), [])

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-10">
      <header className="flex flex-col gap-4 border-b border-[#d9dcd7] pb-6 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#697063] dark:text-gray-500">
            X Platform Intelligence · Quarterly evidence map
          </p>
          <h1 className="mt-2 font-serif text-[28px] font-semibold leading-tight text-[#151713] dark:text-gray-100 sm:text-[34px]">
            X 平台情报图谱
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#53584f] dark:text-gray-400">
            把官方披露、独立调查和第三方估算拆开，观察 X 的活跃规模、国家分布、用户画像、内容机制、创作者经营与平台差异。
          </p>
          <p className="mt-3 font-mono text-[10px] tracking-[0.08em] text-[#7a7f75] dark:text-gray-500">
            数据快照 {snapshot?.label || filters.snapshotId} · 核验于 {snapshot?.verifiedAt || '2026-07-20'}
          </p>
        </div>
        <SharePageButton
          title="X 平台用户、国家、画像与创作者经营｜多维情报图谱"
          text="核验 X 的规模、受众与创作者经营，并与多个公共内容平台横向比较。"
          url={PAGE_URL}
          size="md"
        />
      </header>

      <FilterBar repository={repository} filters={filters} onChange={setFilters} />

      <div className="mt-8 grid gap-5">
        <Overview overview={overview} onOpenEvidence={setEvidenceRef} />
        <ScaleTrends scale={scale} onOpenEvidence={setEvidenceRef} />
        <GeoExplorer rows={geoRows} coverageGaps={geoCoverageGaps} onOpenEvidence={setEvidenceRef} />
        <AudienceProfile groups={audienceGroups} onOpenEvidence={setEvidenceRef} />
        <ContentMechanics insights={operationalInsights} onOpenEvidence={setEvidenceRef} />
        <CreatorPlaybook insights={operationalInsights} onOpenEvidence={setEvidenceRef} />
        <RiskRegister insights={riskInsights} onOpenEvidence={setEvidenceRef} />
        <PlatformMatrix matrix={comparisonMatrix} onOpenEvidence={setEvidenceRef} />
        <EvidenceLedger
          rows={evidenceRows}
          repository={repository}
          snapshotId={filters.snapshotId}
          onOpenEvidence={setEvidenceRef}
        />
      </div>
      {evidenceRef ? (
        <EvidenceDrawer
          evidenceRef={evidenceRef}
          bundle={evidenceBundle}
          repository={repository}
          onClose={closeEvidence}
        />
      ) : null}
    </main>
  )
}
