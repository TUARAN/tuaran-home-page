'use client'

import { useEffect, useMemo, useRef } from 'react'

import { confidenceLabel, formatMetricValue, formatPeriod, geographyLabel, segmentLabel } from '../presentation.mjs'
import { comparisonDimensionLabel } from '../selectors.mjs'

const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

function valueOrUnknown(value) {
  return value || '未注明'
}

function EvidenceTitle({ evidenceRef, repository, subject }) {
  if (!subject) return '证据详情'
  if (evidenceRef.kind === 'insight') return subject.title
  if (evidenceRef.kind === 'observation') {
    const platform = repository.platforms.find((item) => item.id === subject.platformId)
    const metric = repository.metrics.find((item) => item.id === subject.metricId)
    return `${platform?.name || subject.platformId} · ${metric?.label || subject.metricId}`
  }
  const platform = repository.platforms.find((item) => item.id === subject.platformId)
  return `${platform?.name || subject.platformId} · ${comparisonDimensionLabel(subject.dimensionId)}`
}

function SubjectDefinition({ evidenceRef, repository, subject }) {
  if (evidenceRef.kind === 'comparison') {
    return <p className="text-sm leading-7 text-[#4e554b] dark:text-gray-300">{subject.rationale}</p>
  }
  if (evidenceRef.kind === 'insight') {
    return <p className="text-sm leading-7 text-[#4e554b] dark:text-gray-300">{subject.summary}</p>
  }
  const metric = repository.metrics.find((item) => item.id === subject.metricId)
  return (
    <div className="grid gap-2 text-sm leading-7 text-[#4e554b] dark:text-gray-300">
      <p><span className="font-semibold">指标定义：</span>{metric?.label || subject.metricId}（允许单位：{metric?.allowedUnits?.join('、') || '未注明'}）</p>
      <p><span className="font-semibold">观测口径：</span>{valueOrUnknown(subject.methodology)}</p>
      {subject.editorNote ? <p><span className="font-semibold">编辑说明：</span>{subject.editorNote}</p> : null}
    </div>
  )
}

function ObservationTable({ rows, repository, caption }) {
  const platformById = new Map(repository.platforms.map((item) => [item.id, item]))
  const metricById = new Map(repository.metrics.map((item) => [item.id, item]))

  return (
    <div className="overflow-x-auto border border-[#dfe2dc] dark:border-gray-800">
      <table className="min-w-[900px] w-full border-collapse text-left text-[11px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#f3f5ef] text-[#555c52] dark:bg-gray-900 dark:text-gray-400">
          <tr>
            {['平台 / 指标', '值', '地域 / 人群', '周期', '方法', '置信度'].map((label) => <th key={label} scope="col" className="border-b border-[#dfe2dc] px-3 py-2 font-semibold dark:border-gray-800">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[#e4e7e1] last:border-b-0 dark:border-gray-800">
              <th scope="row" className="px-3 py-3 align-top font-semibold text-[#343a32] dark:text-gray-300">
                {platformById.get(row.platformId)?.name || row.platformId}<br />
                <span className="font-normal text-[#747b70] dark:text-gray-500">{metricById.get(row.metricId)?.label || row.metricId}</span>
              </th>
              <td className="px-3 py-3 align-top font-mono text-[#343a32] dark:text-gray-300">{formatMetricValue(row)}</td>
              <td className="px-3 py-3 align-top text-[#5d645a] dark:text-gray-400">
                {geographyLabel(row.geography)}<br />
                <span className="text-[#7a8076] dark:text-gray-500">{row.segments.length ? row.segments.map(segmentLabel).join('、') : '全部人群'}</span>
              </td>
              <td className="px-3 py-3 align-top font-mono text-[#5d645a] dark:text-gray-400">{formatPeriod(row.periodStart, row.periodEnd)}</td>
              <td className="max-w-xs px-3 py-3 align-top leading-5 text-[#5d645a] dark:text-gray-400">{valueOrUnknown(row.methodology)}</td>
              <td className="px-3 py-3 align-top text-[#5d645a] dark:text-gray-400">{confidenceLabel(row.confidence)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SourceList({ sources }) {
  return (
    <div className="grid gap-3">
      {sources.map((source) => (
        <article key={source.id} className="border border-[#dfe2dc] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <h4 className="font-serif text-base font-semibold leading-6 text-[#2b3029] dark:text-gray-200">{source.title}</h4>
          <p className="mt-1 text-xs text-[#71776d] dark:text-gray-500">{source.publisher}</p>
          <dl className="mt-3 grid gap-3 text-[11px] sm:grid-cols-2">
            <div><dt className="text-[#7b8177] dark:text-gray-600">来源类别</dt><dd className="mt-1 text-[#4e554b] dark:text-gray-400">{valueOrUnknown(source.sourceClass)}</dd></div>
            <div><dt className="text-[#7b8177] dark:text-gray-600">地域</dt><dd className="mt-1 text-[#4e554b] dark:text-gray-400">{source.geography ? geographyLabel(source.geography) : '未注明'}</dd></div>
            <div><dt className="text-[#7b8177] dark:text-gray-600">发布日期 / 统计期</dt><dd className="mt-1 font-mono text-[#4e554b] dark:text-gray-400">{valueOrUnknown(source.publishedAt)}</dd></div>
            <div><dt className="text-[#7b8177] dark:text-gray-600">归档状态</dt><dd className="mt-1 text-[#4e554b] dark:text-gray-400">{valueOrUnknown(source.archiveStatus)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-[#7b8177] dark:text-gray-600">方法</dt><dd className="mt-1 leading-5 text-[#4e554b] dark:text-gray-400">{valueOrUnknown(source.methodologySummary)}</dd></div>
          </dl>
          {source.url?.startsWith('https://') ? (
            <a href={source.url} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex text-xs font-semibold text-[#245538] underline decoration-[#aab8ac] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:text-emerald-300">
              打开原始 HTTPS 来源<span className="sr-only">：{source.title}（新窗口）</span>
            </a>
          ) : <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">原始 HTTPS 链接不可用</p>}
        </article>
      ))}
    </div>
  )
}

export default function EvidenceDrawer({ evidenceRef, bundle, repository, onClose }) {
  const closeButtonRef = useRef(null)
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = 'x-evidence-dialog-title'
  const descriptionId = 'x-evidence-dialog-description'
  const subject = bundle?.subject || null
  const title = useMemo(() => <EvidenceTitle evidenceRef={evidenceRef} repository={repository} subject={subject} />, [evidenceRef, repository, subject])

  useEffect(() => {
    returnFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
    }
  }, [onClose])

  return (
    <div
      data-testid="evidence-backdrop"
      className="fixed inset-0 z-[100] flex justify-end bg-black/50"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        onClose()
      }}
      aria-hidden="false"
    >
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="h-full w-full max-w-3xl overflow-y-auto border-l border-[#cbd1c7] bg-[#fbfcf8] shadow-2xl dark:border-gray-800 dark:bg-gray-950"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d9dcd7] bg-[#fbfcf8]/95 px-5 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sm:px-7">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#7c8277] dark:text-gray-500">Evidence record</p>
            <h2 id={titleId} className="mt-1 font-serif text-xl font-semibold leading-7 text-[#20231e] dark:text-gray-100">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 border border-[#aeb6aa] bg-white px-3 py-2 text-xs font-semibold text-[#3e453b] hover:border-[#566052] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f44] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            aria-label="关闭证据详情"
          >
            关闭
          </button>
        </header>

        <div className="grid gap-7 px-5 py-6 sm:px-7">
          {!subject ? (
            <section id={descriptionId} className="border border-dashed border-[#b9c0b4] bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-serif text-lg font-semibold text-[#30362e] dark:text-gray-200">未找到证据记录</h3>
              <p className="mt-2 text-sm leading-6 text-[#666d63] dark:text-gray-400">引用可能已失效或不属于当前数据快照。关闭后可从其他证据入口重试。</p>
            </section>
          ) : (
            <>
              <section id={descriptionId} aria-labelledby="evidence-definition-title">
                <h3 id="evidence-definition-title" className="font-serif text-lg font-semibold text-[#30362e] dark:text-gray-200">定义与判断理由</h3>
                <div className="mt-3 border-l-2 border-[#91a292] pl-4">
                  <SubjectDefinition evidenceRef={evidenceRef} repository={repository} subject={subject} />
                </div>
                <dl className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2">
                  <div><dt className="text-[#7b8177] dark:text-gray-600">引用类型</dt><dd className="mt-1 text-[#4e554b] dark:text-gray-400">{evidenceRef.kind}</dd></div>
                  <div><dt className="text-[#7b8177] dark:text-gray-600">置信度</dt><dd className="mt-1 text-[#4e554b] dark:text-gray-400">{confidenceLabel(subject.confidence || '未注明')}</dd></div>
                </dl>
              </section>

              <section aria-labelledby="evidence-observations-title">
                <h3 id="evidence-observations-title" className="font-serif text-lg font-semibold text-[#30362e] dark:text-gray-200">观测记录</h3>
                <div className="mt-3">
                  {bundle.observations.length ? <ObservationTable rows={bundle.observations} repository={repository} caption="支持当前结论的观测记录" /> : <p className="text-sm text-[#70776d] dark:text-gray-500">本条判断由来源事实直接支持，没有绑定定量观测。</p>}
                </div>
              </section>

              <section aria-labelledby="evidence-conflicts-title">
                <h3 id="evidence-conflicts-title" className="font-serif text-lg font-semibold text-[#30362e] dark:text-gray-200">冲突记录</h3>
                <div className="mt-3">
                  {bundle.conflicts.length ? <ObservationTable rows={bundle.conflicts} repository={repository} caption="与当前观测属于同一冲突组的记录" /> : <p className="text-sm text-[#70776d] dark:text-gray-500">无冲突记录。</p>}
                </div>
              </section>

              <section aria-labelledby="evidence-sources-title">
                <h3 id="evidence-sources-title" className="font-serif text-lg font-semibold text-[#30362e] dark:text-gray-200">原始来源</h3>
                <div className="mt-3">
                  {bundle.sources.length ? <SourceList sources={bundle.sources} /> : <p className="text-sm text-[#70776d] dark:text-gray-500">没有可用来源。</p>}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
