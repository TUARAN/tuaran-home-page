'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AdminButton } from '../../components/ui'
import usePlanningModal from './planningModalFocus'
import { planningRequest } from './planningUi'

const COUNT_LABELS = {
  directions: '方向',
  profiles: '项目关联',
  milestones: '待办里程碑',
  events: '历史事件',
}

function importErrorMessage(error) {
  if (error?.code === 'DB_UNAVAILABLE') return '规划数据库暂时不可用，请稍后重试。'
  if (error?.code === 'IMPORT_READ_FAILED') return '初始化预览生成失败，请重试。'
  if (error?.code === 'IMPORT_WRITE_FAILED') return '导入未完成，已有规划数据不会被覆盖。'
  return error?.message || '初始化数据处理失败，请重试。'
}

function ResultCounts({ title, counts }) {
  return (
    <div className="rounded-xl border bg-[var(--admin-surface-subtle)] p-3">
      <p className="m-0 text-xs font-medium text-[var(--admin-muted)]">{title}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {Object.entries(COUNT_LABELS).map(([key, label]) => (
          <span key={key}>{label} {Number(counts?.[key] || 0)}</span>
        ))}
      </div>
    </div>
  )
}

export default function PlanningImportPanel({ backgroundRef, onClose, onApplied }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const dialogRef = useRef(null)
  const initialFocusRef = useRef(null)
  usePlanningModal({ dialogRef, initialFocusRef, backgroundRef, onClose })

  const loadPreview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPreview(await planningRequest('/api/admin/planning/import', { cache: 'no-store' }))
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPreview()
  }, [loadPreview])

  const estimate = useMemo(() => {
    if (!preview) return { inserted: 0, skipped: 0 }
    const candidates = Number(preview.counts?.milestones || 0) + Number(preview.counts?.events || 0)
    const skipped = Number(preview.existingSourceKeyCounts?.milestones || 0)
      + Number(preview.existingSourceKeyCounts?.events || 0)
    return { inserted: Math.max(0, candidates - skipped), skipped }
  }, [preview])

  async function applyImport() {
    if (!confirmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const nextResult = await planningRequest('/api/admin/planning/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      setResult(nextResult)
      setConfirmed(false)
      await onApplied?.()
      await loadPreview()
    } catch (requestError) {
      setError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="planning-import-title">
      <button type="button" tabIndex={-1} className="absolute inset-0 bg-black/35" aria-label="关闭初始化面板" onClick={onClose} />
      <section className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl border bg-[var(--admin-surface)] p-4 shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[42rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs text-[var(--admin-muted)]">只补齐缺失来源，不覆盖已有规划</p>
            <h2 id="planning-import-title" className="m-0 mt-1 font-serif text-xl font-semibold">初始化规划数据</h2>
          </div>
          <button ref={initialFocusRef} type="button" className="rounded-lg border px-2.5 py-1.5 text-sm font-medium transition hover:bg-[var(--admin-surface-subtle)]" onClick={onClose}>关闭</button>
        </div>

        {loading && !preview ? <p className="mt-5 text-sm text-[var(--admin-muted)]">正在读取项目组合与 Changelog…</p> : null}
        {error ? (
          <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100">
            <p className="m-0">{importErrorMessage(error)}</p>
            {!preview ? <button type="button" className="mt-2 underline" onClick={loadPreview}>重新生成预览</button> : null}
          </div>
        ) : null}

        {preview ? (
          <div className="mt-5 grid gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(COUNT_LABELS).map(([key, label]) => (
                <div key={key} className="rounded-xl border p-3">
                  <p className="m-0 text-xs text-[var(--admin-muted)]">{label}</p>
                  <p className="m-0 mt-1 text-xl font-semibold">{Number(preview.counts?.[key] || 0)}</p>
                </div>
              ))}
            </div>

            <p className="m-0 rounded-xl border border-dashed px-3 py-2 text-sm text-[var(--admin-muted)]">
              按来源键估算：新增里程碑/历史事件 {estimate.inserted} 条，跳过重复 {estimate.skipped} 条；方向与项目关联由写入时按稳定 ID 去重。
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border p-3">
                <h3 className="m-0 text-sm font-semibold">前 5 条 next_step 里程碑</h3>
                {preview.milestones.slice(0, 5).length ? (
                  <ul className="mb-0 mt-2 grid gap-2 pl-5 text-sm">
                    {preview.milestones.slice(0, 5).map((item) => <li key={item.id}>{item.title}</li>)}
                  </ul>
                ) : <p className="mb-0 mt-2 text-sm text-[var(--admin-muted)]">没有可导入的 next_step。</p>}
              </div>
              <div className="rounded-xl border p-3">
                <h3 className="m-0 text-sm font-semibold">前 5 条 Changelog 事件</h3>
                {preview.events.slice(0, 5).length ? (
                  <ul className="mb-0 mt-2 grid gap-2 pl-5 text-sm">
                    {preview.events.slice(0, 5).map((item) => (
                      <li key={item.id}>{item.title}{item.details?.range ? <span className="text-[var(--admin-muted)]"> · {item.details.range}</span> : null}</li>
                    ))}
                  </ul>
                ) : <p className="mb-0 mt-2 text-sm text-[var(--admin-muted)]">没有可导入的 Changelog 事件。</p>}
              </div>
            </div>

            {result ? (
              <div role="status" className="grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100">
                <p className="m-0 text-sm font-medium">导入完成，规划快照已刷新。</p>
                <ResultCounts title="实际新增" counts={result.inserted} />
                <ResultCounts title="实际跳过" counts={result.skipped} />
              </div>
            ) : null}

            <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>我知道重复来源会跳过，已有规划不会被覆盖。</span>
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <AdminButton type="button" onClick={onClose}>取消</AdminButton>
              <AdminButton type="button" variant="primary" disabled={!confirmed || submitting || loading} onClick={applyImport}>
                {submitting ? '正在导入…' : '确认导入为规划初始数据'}
              </AdminButton>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
