'use client'

import { useMemo, useState } from 'react'

import { buildEvidenceCsv } from '../filters.mjs'
import { confidenceLabel, formatMetricValue, formatPeriod } from '../presentation.mjs'
import {
  buildEvidenceExportRows,
  enrichEvidenceRows,
  evidenceAudienceLabel,
  filterEvidenceRowsForSearch,
  sortEvidenceRows,
} from '../evidenceLedger.mjs'

const SORTABLE_COLUMNS = [
  ['platform', '平台'],
  ['metric', '指标'],
  ['period', '统计期'],
  ['confidence', '可信度'],
]

function nextSort(sort, key) {
  if (sort.key !== key) return { key, direction: 'ascending' }
  return { key, direction: sort.direction === 'ascending' ? 'descending' : 'ascending' }
}

function sortAriaValue(sort, key) {
  return sort.key === key ? sort.direction : 'none'
}

function SortableHeader({ sort, sortKey, children, onSort }) {
  return (
    <th scope="col" aria-sort={sortAriaValue(sort, sortKey)} className="border-b border-[#dfe2dc] px-3 py-2 text-left font-semibold dark:border-gray-800">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44]"
      >
        {children}<span aria-hidden="true">{sort.key === sortKey ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )
}

function EvidenceSource({ row }) {
  if (!row.sourceUrl?.startsWith('https://')) return <span>{row.sourceTitle || '来源未注明'}</span>
  return (
    <a
      href={row.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-[#245538] underline decoration-[#aab8ac] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300"
    >
      {row.sourceTitle || '打开来源'}<span className="sr-only">（新窗口）</span>
    </a>
  )
}

export default function EvidenceLedger({ rows, repository, snapshotId, onOpenEvidence }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'period', direction: 'descending' })
  const enrichedRows = useMemo(() => enrichEvidenceRows(rows, repository), [repository, rows])
  const visibleRows = useMemo(() => sortEvidenceRows(
    filterEvidenceRowsForSearch(enrichedRows, query),
    sort,
  ), [enrichedRows, query, sort])
  const exportRows = useMemo(() => buildEvidenceExportRows(enrichedRows, repository), [enrichedRows, repository])

  function downloadCurrentFilter() {
    const csv = buildEvidenceCsv(exportRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    try {
      anchor.href = url
      anchor.download = `x-platform-intelligence-${snapshotId}.csv`
      anchor.style.display = 'none'
      document.body.append(anchor)
      anchor.click()
    } finally {
      anchor.remove()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <section id="evidence" aria-labelledby="evidence-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Evidence ledger</p>
          <h2 id="evidence-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">完整证据账本</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">
            {rows.length} 条记录已按页面全局筛选收窄；本地检索只影响阅读，不改变导出范围。
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCurrentFilter}
          disabled={exportRows.length === 0}
          className="min-h-11 border border-[#526354] bg-[#e8eee5] px-4 text-xs font-semibold text-[#26392a] hover:bg-[#dfe9db] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          导出当前全局筛选的 {exportRows.length} 条 CSV
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid max-w-md flex-1 gap-1.5 text-xs font-medium text-[#555b51] dark:text-gray-400">
          在当前账本中检索
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="平台、指标、来源、地区、口径…"
            className="min-h-11 border border-[#bcc2b6] bg-white px-3 text-sm text-[#272b25] outline-none placeholder:text-[#858b80] focus:border-[#5c6c58] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </label>
        <p className="text-xs text-[#6d7469] dark:text-gray-500" aria-live="polite">显示 {visibleRows.length} / {rows.length} 条</p>
      </div>

      <div className="mt-4 overflow-x-auto border border-[#dfe2dc] dark:border-gray-800">
        <table className="min-w-[1100px] w-full border-collapse text-left text-[11px]">
          <caption className="sr-only">X 平台情报图谱的完整证据账本。可按平台、指标、统计期或可信度排序。</caption>
          <thead className="bg-[#f3f5ef] text-[#555c52] dark:bg-gray-900 dark:text-gray-400">
            <tr>
              {SORTABLE_COLUMNS.slice(0, 2).map(([key, label]) => <SortableHeader key={key} sort={sort} sortKey={key} onSort={(nextKey) => setSort(nextSort(sort, nextKey))}>{label}</SortableHeader>)}
              <th scope="col" className="border-b border-[#dfe2dc] px-3 py-2 text-left font-semibold dark:border-gray-800">数值</th>
              <SortableHeader sort={sort} sortKey="period" onSort={(nextKey) => setSort(nextSort(sort, nextKey))}>统计期</SortableHeader>
              <th scope="col" className="border-b border-[#dfe2dc] px-3 py-2 text-left font-semibold dark:border-gray-800">地区/人群</th>
              <th scope="col" className="border-b border-[#dfe2dc] px-3 py-2 text-left font-semibold dark:border-gray-800">来源</th>
              <th scope="col" className="border-b border-[#dfe2dc] px-3 py-2 text-left font-semibold dark:border-gray-800">口径</th>
              <SortableHeader sort={sort} sortKey="confidence" onSort={(nextKey) => setSort(nextSort(sort, nextKey))}>可信度</SortableHeader>
              <th scope="col" className="border-b border-[#dfe2dc] px-3 py-2 text-left font-semibold dark:border-gray-800">冲突状态</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.observationId} className="border-b border-[#e4e7e1] align-top last:border-b-0 dark:border-gray-800">
                <th scope="row" className="px-3 py-3 font-semibold text-[#343a32] dark:text-gray-300">{row.platformName}</th>
                <td className="px-3 py-3 text-[#5d645a] dark:text-gray-400">{row.metricLabel}</td>
                <td className="px-3 py-3 font-mono text-[#343a32] dark:text-gray-300">{formatMetricValue(row)}</td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-[#5d645a] dark:text-gray-400">{formatPeriod(row.periodStart, row.periodEnd)}</td>
                <td className="px-3 py-3 text-[#5d645a] dark:text-gray-400">{evidenceAudienceLabel(row)}</td>
                <td className="max-w-xs px-3 py-3 leading-5"><EvidenceSource row={row} /></td>
                <td className="max-w-xs px-3 py-3 leading-5 text-[#5d645a] dark:text-gray-400">{row.methodology || '未注明'}</td>
                <td className="px-3 py-3 text-[#5d645a] dark:text-gray-400">{confidenceLabel(row.confidence)}</td>
                <td className="px-3 py-3 text-[#5d645a] dark:text-gray-400">
                  {row.conflictGroupId ? (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence({ kind: 'observation', id: row.observationId })}
                      className="text-left font-semibold text-[#7c3f28] underline decoration-[#d9ad9d] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-orange-300"
                    >
                      冲突组：{row.conflictGroupId}
                    </button>
                  ) : '无'}
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr><td colSpan="9" className="px-3 py-8 text-center text-sm text-[#737a70] dark:text-gray-500">当前页面筛选和本地检索下没有匹配的证据记录。</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
