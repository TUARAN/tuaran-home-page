'use client'

import { useMemo, useState } from 'react'

import { confidenceLabel, formatMetricValue, formatPeriod, geographyLabel } from '../presentation.mjs'

const METRICS = [
  ['country-share', '国家受众占比'],
  ['internet-penetration', '互联网人口渗透率'],
]

const MAP_POINTS = {
  us: [24, 42],
  uk: [48, 31],
  eu: [53, 36],
  japan: [86, 43],
  china: [77, 44],
}

export default function GeoExplorer({ rows, onOpenEvidence }) {
  const [metricId, setMetricId] = useState('country-share')
  const [sort, setSort] = useState({ key: 'value', direction: 'desc' })
  const visibleRows = useMemo(() => {
    const selected = rows.filter((row) => row.metricId === metricId)
    return [...selected].sort((left, right) => {
      const order = sort.key === 'country'
        ? geographyLabel(left.country).localeCompare(geographyLabel(right.country), 'zh-CN')
        : left.value - right.value
      return sort.direction === 'asc' ? order : -order
    })
  }, [metricId, rows, sort])

  const changeSort = (key) => {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }))
  }

  return (
    <section id="geography" aria-labelledby="geography-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Observed geographies only</p>
          <h2 id="geography-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">国家与地区</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">地图只标出证据仓库中已有观察值的国家或地区，不推断、不补齐缺失国家。</p>
        </div>
        <div className="inline-flex w-fit border border-[#cfd4cc] bg-white p-1 dark:border-gray-800 dark:bg-gray-950" aria-label="国家指标">
          {METRICS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={metricId === id}
              onClick={() => setMetricId(id)}
              className={`px-3 py-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] ${metricId === id ? 'bg-[#244d32] text-white' : 'text-[#596057] hover:bg-[#eef1eb] dark:text-gray-400 dark:hover:bg-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
        <div className="relative min-h-64 overflow-hidden border border-[#dfe2dc] bg-[#f2f4ef] dark:border-gray-800 dark:bg-gray-950" aria-label="支持国家与地区点位图">
          <svg viewBox="0 0 100 60" aria-hidden="true" className="absolute inset-0 h-full w-full text-[#c9d0c6] dark:text-gray-800">
            <path d="M5 18 18 10l13 5 3 10-8 7-10-2-4 10-7-8Z" fill="currentColor" />
            <path d="m25 36 8 4 3 13-6 5-5-10Z" fill="currentColor" />
            <path d="m42 15 13-7 8 5-3 9-9 3-8-4Z" fill="currentColor" />
            <path d="m47 27 14-3 8 9-4 21-12-2-7-14Z" fill="currentColor" />
            <path d="m62 12 22 2 12 11-8 14-21-6-8-11Z" fill="currentColor" />
            <path d="m80 46 12-2 6 8-8 5-11-5Z" fill="currentColor" />
          </svg>
          {visibleRows.map((row) => {
            const point = MAP_POINTS[row.country]
            if (!point) return null
            return (
              <button
                key={row.observationId}
                type="button"
                onClick={() => onOpenEvidence({ kind: 'observation', id: row.observationId })}
                data-evidence-kind="observation"
                data-evidence-id={row.observationId}
                aria-label={`${geographyLabel(row.country)}，${formatMetricValue(row)}，打开证据`}
                className="group absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2f6f44] shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1d4e2d] dark:border-gray-950 dark:bg-emerald-400"
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              >
                <span className="pointer-events-none absolute left-1/2 top-5 z-10 hidden -translate-x-1/2 whitespace-nowrap border border-[#d4d8d1] bg-white px-2 py-1 text-[10px] text-[#343a32] shadow-sm group-hover:block group-focus-visible:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  {geographyLabel(row.country)} · {formatMetricValue(row)}
                </span>
              </button>
            )
          })}
          {visibleRows.length === 0 ? (
            <p className="absolute inset-x-6 bottom-6 border border-dashed border-[#c6cbc3] bg-[#fbfcf8]/90 p-3 text-center text-xs leading-5 text-[#6f756b] dark:border-gray-700 dark:bg-gray-950/90 dark:text-gray-500">
              当前筛选下没有这一指标的国家观察值。
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-xs">
            <caption className="sr-only">国家指标排序表，包含周期、来源和置信度</caption>
            <thead>
              <tr className="border-b border-[#d8dcd5] text-[#626960] dark:border-gray-800 dark:text-gray-500">
                <th scope="col" aria-sort={sort.key === 'country' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="py-2 pr-3 font-medium">
                  <button type="button" onClick={() => changeSort('country')} className="underline decoration-[#c0c5bd] underline-offset-4">国家 / 地区</button>
                </th>
                <th scope="col" aria-sort={sort.key === 'value' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-3 py-2 font-medium">
                  <button type="button" onClick={() => changeSort('value')} className="underline decoration-[#c0c5bd] underline-offset-4">数值</button>
                </th>
                <th scope="col" className="px-3 py-2 font-medium">周期</th>
                <th scope="col" className="px-3 py-2 font-medium">来源与置信</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.observationId} className="border-b border-[#e7e9e4] align-top last:border-0 dark:border-gray-900">
                  <th scope="row" className="py-3 pr-3 font-semibold text-[#31362f] dark:text-gray-300">{geographyLabel(row.country)}</th>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onOpenEvidence({ kind: 'observation', id: row.observationId })}
                      data-evidence-kind="observation"
                      data-evidence-id={row.observationId}
                      className="font-semibold tabular-nums text-[#1e4f30] underline decoration-[#aab8ac] underline-offset-4 dark:text-emerald-300"
                    >
                      {formatMetricValue(row)}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-[#5c6359] dark:text-gray-400">{formatPeriod(row.periodStart, row.periodEnd)}</td>
                  <td className="px-3 py-3 text-[#5c6359] dark:text-gray-400">
                    {row.sourceUrl ? <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-[#b8beb5] underline-offset-4">{row.sourceTitle || row.sourceId}</a> : row.sourceId}
                    <span className="mt-1 block font-mono text-[9px]">{confidenceLabel(row.confidence)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
