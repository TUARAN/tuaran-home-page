'use client'

import { useEffect, useMemo, useState } from 'react'

import { confidenceLabel } from '../presentation.mjs'
import { groupComparisonRows } from '../selectors.mjs'

const GROUPS = [
  ['global', '全球平台'],
  ['china', '中文平台'],
]

const RATING_LABELS = {
  high: '高',
  medium: '中',
  low: '低',
  unknown: '未知',
}

const RATING_STYLES = {
  high: 'border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  medium: 'border-amber-700/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  low: 'border-rose-700/30 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  unknown: 'border-dashed border-gray-400 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

function EvidenceCellButton({ cell, dimension, platform, onOpenEvidence }) {
  const rating = RATING_LABELS[cell.rating] || '未知'
  const confidence = confidenceLabel(cell.confidence)

  return (
    <button
      type="button"
      onClick={() => onOpenEvidence({ kind: 'comparison', id: cell.comparisonId })}
      aria-label={`${platform.name}，${dimension.label}：${rating}，${confidence}。查看证据`}
      data-evidence-kind="comparison"
      data-evidence-id={cell.comparisonId}
      className={`group flex min-h-16 w-full min-w-28 flex-col items-start justify-center border px-3 py-2 text-left transition hover:border-[#526354] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] ${RATING_STYLES[cell.rating] || RATING_STYLES.unknown}`}
    >
      <span className="text-xs font-semibold">{rating}</span>
      <span className="mt-1 font-mono text-[9px] opacity-75">置信度：{confidence}</span>
      <span className="mt-1 text-[10px] underline decoration-current/40 underline-offset-2">查看证据</span>
    </button>
  )
}

function DesktopMatrix({ dimensions, rows, onOpenEvidence }) {
  return (
    <div className="hidden overflow-x-auto border border-[#dfe2dc] bg-white dark:border-gray-800 dark:bg-gray-950 md:block">
      <table className="w-max min-w-full border-collapse text-left">
        <caption className="sr-only">平台在十六个经营维度上的评级、置信度与证据入口</caption>
        <thead>
          <tr className="border-b border-[#dfe2dc] dark:border-gray-800">
            <th scope="col" className="sticky left-0 z-20 min-w-36 bg-[#f4f6f0] px-4 py-3 text-xs font-semibold text-[#363c34] dark:bg-gray-900 dark:text-gray-300">
              平台
            </th>
            {dimensions.map((dimension) => (
              <th key={dimension.id} scope="col" className="min-w-32 bg-[#f4f6f0] px-3 py-3 text-xs font-semibold text-[#4e554b] dark:bg-gray-900 dark:text-gray-400">
                {dimension.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.platform.id} className="border-b border-[#e4e7e1] last:border-b-0 dark:border-gray-800">
              <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 dark:bg-gray-950">
                <span className="font-serif text-base font-semibold text-[#252a23] dark:text-gray-200">{row.platform.name}</span>
                {row.platform.id === 'x' ? <span className="ml-2 border border-[#99aa9b] px-1.5 py-0.5 font-mono text-[8px] text-[#526052] dark:border-emerald-900 dark:text-emerald-400">基准</span> : null}
              </th>
              {row.cells.map((cell, index) => (
                <td key={cell.dimensionId} className="p-2 align-top">
                  <EvidenceCellButton cell={cell} dimension={dimensions[index]} platform={row.platform} onOpenEvidence={onOpenEvidence} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileMatrix({ dimensions, rows, activeDimensionId, onDimensionChange, onOpenEvidence }) {
  const dimensionIndex = Math.max(0, dimensions.findIndex((item) => item.id === activeDimensionId))
  const dimension = dimensions[dimensionIndex]

  return (
    <div className="md:hidden">
      <label className="grid gap-1.5 text-xs font-medium text-[#555b51] dark:text-gray-400">
        每次查看一个维度
        <select
          value={dimension?.id || ''}
          onChange={(event) => onDimensionChange(event.target.value)}
          className="min-h-11 border border-[#bcc2b6] bg-white px-3 text-sm text-[#272b25] outline-none focus:border-[#5c6c58] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          {dimensions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>

      <div className="mt-3 grid gap-2" aria-live="polite">
        {rows.map((row) => (
          <article key={row.platform.id} className="grid grid-cols-[7rem_1fr] items-stretch border border-[#dfe2dc] bg-white dark:border-gray-800 dark:bg-gray-950">
            <h3 className="flex items-center px-3 font-serif text-sm font-semibold text-[#2d322b] dark:text-gray-200">
              {row.platform.name}
              {row.platform.id === 'x' ? <span className="sr-only">（基准平台）</span> : null}
            </h3>
            <div className="p-2">
              <EvidenceCellButton cell={row.cells[dimensionIndex]} dimension={dimension} platform={row.platform} onOpenEvidence={onOpenEvidence} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default function PlatformMatrix({ matrix, onOpenEvidence }) {
  const groupedRows = useMemo(() => groupComparisonRows(matrix.rows), [matrix.rows])
  const [activeGroup, setActiveGroup] = useState('global')
  const [activeDimensionId, setActiveDimensionId] = useState(matrix.dimensions[0]?.id || '')

  useEffect(() => {
    if (!matrix.dimensions.some((item) => item.id === activeDimensionId)) {
      setActiveDimensionId(matrix.dimensions[0]?.id || '')
    }
  }, [activeDimensionId, matrix.dimensions])

  const rows = groupedRows[activeGroup]

  return (
    <section id="comparison" aria-labelledby="comparison-title" className="scroll-mt-24 border border-[#d9dcd7] bg-[#fbfcf8] p-5 dark:border-gray-800 dark:bg-gray-950/40 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Evidence-backed comparison</p>
          <h2 id="comparison-title" className="mt-2 font-serif text-2xl font-semibold text-[#20231e] dark:text-gray-100">重点差异矩阵</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5a6056] dark:text-gray-400">
            高、中、低是有依据的编辑判断，不是精确分数；证据不足时明确标为“未知”。X 始终作为两组的首行基准。
          </p>
        </div>
        <a href="#platform-matrix-end" className="text-xs font-semibold text-[#315e40] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300">
          跳过矩阵
        </a>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="平台比较分组">
        {GROUPS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={activeGroup === id}
            onClick={() => setActiveGroup(id)}
            className={`border px-4 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] ${activeGroup === id ? 'border-[#526354] bg-[#e8eee5] text-[#26392a] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'border-[#c8cec3] bg-white text-[#60665c] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'}`}
          >
            {label} · {groupedRows[id].length}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <DesktopMatrix dimensions={matrix.dimensions} rows={rows} onOpenEvidence={onOpenEvidence} />
        <MobileMatrix
          dimensions={matrix.dimensions}
          rows={rows}
          activeDimensionId={activeDimensionId}
          onDimensionChange={setActiveDimensionId}
          onOpenEvidence={onOpenEvidence}
        />
      </div>

      <p id="platform-matrix-end" tabIndex="-1" className="mt-4 text-[11px] leading-5 text-[#747a70] dark:text-gray-500">
        当前组显示 {rows.length} 个平台 × {matrix.dimensions.length} 个维度。矩阵仅响应数据快照与对比平台筛选；地区、人群、目标和可信度筛选不适用于编辑评级。平台筛选不会移除基准平台 X。
      </p>
    </section>
  )
}
