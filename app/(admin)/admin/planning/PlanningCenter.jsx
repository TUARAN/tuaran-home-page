'use client'

import { useCallback, useEffect, useState } from 'react'

import AdminPage from '../../components/ui/AdminPage'
import { PLANNING_TABS, PLANNING_WINDOWS, planningRequest } from './planningUi'

const EMPTY_SNAPSHOT = { directions: [], stats: {} }

function errorMessage(error) {
  if (error?.code === 'DB_UNAVAILABLE') return '规划数据暂时不可用，请稍后重试。'
  if (error?.code === 'INVALID_WINDOW') return '时间窗口无效，已保留当前页面数据。'
  return error?.message || '加载规划中心时出现问题，请重试。'
}

function EmptyTab({ tab }) {
  return (
    <section className="rounded-xl border border-dashed px-4 py-8 text-sm leading-7 text-[var(--admin-muted)]">
      <h2 className="font-medium text-[var(--admin-foreground)]">{tab.label}</h2>
      <p className="mb-0 mt-1">此视图将在下一步补齐详细内容。当前仍可切换时间窗口并刷新规划快照。</p>
    </section>
  )
}

export default function PlanningCenter() {
  const [activeTab, setActiveTab] = useState('overview')
  const [window, setWindow] = useState('month')
  const [directionId, setDirectionId] = useState('')
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editor, setEditor] = useState(null)
  const [importPanel, setImportPanel] = useState(null)

  const safeWindow = PLANNING_WINDOWS.some((item) => item.id === window) ? window : 'month'

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextSnapshot = await planningRequest(`/api/admin/planning?window=${encodeURIComponent(safeWindow)}`, {
        cache: 'no-store',
      })
      setSnapshot(nextSnapshot)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [safeWindow])

  const mutate = useCallback(async (path, options) => {
    const result = await planningRequest(path, options)
    await reload()
    return result
  }, [reload])

  const runImport = useCallback(async () => {
    const result = await mutate('/api/admin/planning/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    })
    setImportPanel(null)
    return result
  }, [mutate])

  useEffect(() => {
    reload()
  }, [reload])

  const visibleSnapshot = snapshot || EMPTY_SNAPSHOT
  const stats = visibleSnapshot.stats || {}

  return (
    <AdminPage
      title="规划中心"
      description="把全部项目的过去、现在与未来放在同一条主线上。"
      actions={(
        <>
          <button type="button" className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setImportPanel({ open: true })}>
            初始化数据
          </button>
          <button type="button" className="rounded-lg bg-[var(--admin-foreground)] px-3 py-1.5 text-sm font-medium text-[var(--admin-background)] transition hover:opacity-90" onClick={() => setEditor({ mode: 'create' })}>
            快速添加
          </button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div role="tablist" aria-label="规划中心视图" className="flex flex-wrap gap-2">
            {PLANNING_TABS.map((tab) => (
              <button
                key={tab.id}
                id={`planning-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`planning-panel-${tab.id}`}
                className={`rounded-full px-3 py-1.5 text-sm transition ${activeTab === tab.id ? 'bg-[var(--admin-foreground)] text-[var(--admin-background)]' : 'border text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="planning-window">时间窗口</label>
            <select
              id="planning-window"
              value={safeWindow}
              className="rounded-lg border bg-transparent px-2 py-1.5 text-sm"
              onChange={(event) => {
                const nextWindow = event.target.value
                if (PLANNING_WINDOWS.some((item) => item.id === nextWindow)) setWindow(nextWindow)
              }}
            >
              {PLANNING_WINDOWS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <label className="sr-only" htmlFor="planning-direction">方向筛选</label>
            <select id="planning-direction" value={directionId} className="rounded-lg border bg-transparent px-2 py-1.5 text-sm" onChange={(event) => setDirectionId(event.target.value)}>
              <option value="">全部方向</option>
              {visibleSnapshot.directions.map((direction) => <option key={direction.id} value={direction.id}>{direction.title}</option>)}
            </select>
          </div>
        </div>

        {error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100">
            <span>{errorMessage(error)}</span>
            <button type="button" className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-rose-100 dark:hover:bg-rose-950/60" onClick={reload}>重试</button>
          </div>
        ) : null}

        {snapshot ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="规划摘要">
            {[
              ['已完成', stats.completed || 0],
              ['当前焦点', stats.focus || 0],
              ['受阻', stats.blocked || 0],
              ['已逾期', stats.overdue || 0],
              ['待决策', stats.decisions || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border px-3 py-3">
                <div className="text-xs text-[var(--admin-muted)]">{label}</div>
                <div className="mt-1 text-xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {loading && !snapshot ? <div className="rounded-xl border px-4 py-8 text-sm text-[var(--admin-muted)]">正在加载规划快照…</div> : null}
        {loading && snapshot ? <p className="mb-0 text-xs text-[var(--admin-muted)]">正在更新，保留上次成功加载的数据。</p> : null}
        {!loading && !snapshot && !error ? <div className="rounded-xl border px-4 py-8 text-sm text-[var(--admin-muted)]">暂无规划数据，可先初始化或快速添加。</div> : null}

        {PLANNING_TABS.map((tab) => (
          <div
            id={`planning-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`planning-tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            key={tab.id}
          >
            <EmptyTab tab={tab} />
          </div>
        ))}
      </div>

      {editor ? (
        <div role="status" className="mt-4 rounded-xl border border-dashed px-4 py-3 text-sm">
          快速添加面板将在下一步提供；当前不会创建不完整的规划记录。
          <button type="button" className="ml-3 underline" onClick={() => setEditor(null)}>关闭</button>
        </div>
      ) : null}
      {importPanel ? (
        <div role="status" className="mt-4 rounded-xl border border-dashed px-4 py-3 text-sm">
          初始化面板将在下一步提供预览与确认；当前不会执行导入。
          <button type="button" className="ml-3 underline" onClick={() => setImportPanel(null)}>关闭</button>
        </div>
      ) : null}
    </AdminPage>
  )
}
