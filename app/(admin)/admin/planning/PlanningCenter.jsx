'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AdminButton, AdminPage } from '../../components/ui'
import PlanningEditor from './PlanningEditor'
import PlanningHistory from './PlanningHistory'
import PlanningImportPanel from './PlanningImportPanel'
import PlanningRoadmap from './PlanningRoadmap'
import PlanningTree from './PlanningTree'
import TriStateOverview from './TriStateOverview'
import usePlanningModal from './planningModalFocus'
import { PLANNING_TABS, PLANNING_WINDOWS, planningRequest } from './planningUi'

const EMPTY_SNAPSHOT = {
  directions: [], projects: [], projectCatalog: [], milestones: [], tasks: [],
  events: [], decisions: [], dependencies: [], triState: {}, stats: {},
}

function errorMessage(error) {
  if (error?.code === 'DB_UNAVAILABLE') return '规划数据暂时不可用，请稍后重试。'
  if (error?.code === 'INVALID_WINDOW') return '时间窗口无效，已保留当前页面数据。'
  return error?.message || '加载规划中心时出现问题，请重试。'
}

const entityTypes = [
  { id: 'direction', label: '方向', description: '定义长期目标与本期北极星。' },
  { id: 'milestone', label: '里程碑', description: '为项目创建可验证的阶段成果。' },
  { id: 'task', label: '任务', description: '把下一步放入明确的里程碑。' },
  { id: 'event', label: '历史事件', description: '补录已发生的节点、复盘或更正。' },
  { id: 'decision', label: '决策', description: '保存背景、结论、理由与影响。' },
]

function QuickAddChooser({ backgroundRef, onChoose, onClose }) {
  const dialogRef = useRef(null)
  const initialFocusRef = useRef(null)
  usePlanningModal({ dialogRef, initialFocusRef, backgroundRef, onClose })

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="planning-quick-add-title">
      <button type="button" tabIndex={-1} className="absolute inset-0 bg-black/35" aria-label="关闭快速添加" onClick={onClose} />
      <section className="absolute inset-x-0 bottom-0 rounded-t-2xl border bg-[var(--admin-surface)] p-4 shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[32rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs text-[var(--admin-muted)]">快速添加</p>
            <h2 id="planning-quick-add-title" className="m-0 mt-1 font-serif text-xl font-semibold">要创建什么？</h2>
          </div>
          <button ref={initialFocusRef} type="button" className="rounded-lg border px-2.5 py-1.5 text-sm font-medium transition hover:bg-[var(--admin-surface-subtle)]" aria-label="关闭快速添加" onClick={onClose}>关闭</button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {entityTypes.map((item) => (
            <button key={item.id} type="button" className="rounded-xl border p-3 text-left transition hover:border-[var(--admin-focus)] hover:bg-[var(--admin-surface-subtle)]" onClick={() => onChoose(item.id)}>
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">{item.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
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
  const [importPanel, setImportPanel] = useState(false)
  const backgroundRef = useRef(null)

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

  useEffect(() => {
    reload()
  }, [reload])

  const visibleSnapshot = snapshot || EMPTY_SNAPSHOT

  const openCreate = useCallback((entity, context = {}) => {
    setEditor({
      mode: 'create',
      entity,
      context: { directionId: directionId || '', ...context },
      initialValue: {},
    })
  }, [directionId])

  const openEdit = useCallback((item) => {
    if (!['direction', 'project-profile', 'milestone', 'task'].includes(item.entityType)) return
    setEditor({ mode: 'edit', entity: item.entityType, initialValue: item, context: {} })
  }, [])

  const openLinkProject = useCallback((direction) => {
    setEditor({
      mode: 'create',
      entity: 'project-profile',
      initialValue: {},
      context: { directionId: direction.id },
    })
  }, [])

  const openDependency = useCallback((item) => {
    const fromType = item.entityType === 'task' ? 'task' : 'milestone'
    setEditor({
      mode: 'create',
      entity: 'dependency',
      initialValue: {},
      context: { fromType, fromId: item.id, toType: fromType },
    })
  }, [])

  const saveEditor = useCallback(async (payload) => {
    if (!editor?.entity) return
    if (editor.mode === 'edit') {
      await mutate('/api/admin/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: editor.entity, id: editor.initialValue.id, changes: payload }),
      })
    } else {
      const action = {
        direction: 'create-direction',
        'project-profile': 'upsert-project-profile',
        milestone: 'create-milestone',
        task: 'create-task',
        event: 'create-event',
        decision: 'create-decision',
        dependency: 'create-dependency',
      }[editor.entity]
      await mutate('/api/admin/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
    }
    setEditor(null)
  }, [editor, mutate])

  const archiveItem = useCallback(async (item) => {
    const entity = item.entityType
    const changes = entity === 'project-profile'
      ? { planningStatus: 'archived', archivedAt: Date.now() }
      : { status: 'archived', archivedAt: Date.now() }
    try {
      await mutate('/api/admin/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id: item.id, changes }),
      })
    } catch (archiveError) {
      setError(archiveError)
    }
  }, [mutate])

  const changeDirection = useCallback((nextDirectionId) => {
    setDirectionId(nextDirectionId)
    void reload()
  }, [reload])

  return (
    <>
      <div ref={backgroundRef} data-planning-modal-background data-planning-focus-fallback tabIndex={-1}>
        <AdminPage
      title="规划中心"
      description="把全部项目的过去、现在与未来放在同一条主线上。"
      actions={(
        <>
          <AdminButton type="button" onClick={() => setImportPanel(true)}>
            初始化数据
          </AdminButton>
          <AdminButton type="button" variant="primary" onClick={() => setEditor({ mode: 'choose' })}>
            快速添加
          </AdminButton>
        </>
      )}
        >
          <div className="flex flex-col gap-4">
        <div role="tablist" aria-label="规划中心视图" className="flex flex-wrap gap-2">
          {PLANNING_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`planning-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`planning-panel-${tab.id}`}
              className={`rounded-full px-3 py-1.5 text-sm transition ${activeTab === tab.id ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]' : 'border text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100">
            <span>{errorMessage(error)}</span>
            <button type="button" className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-rose-100 dark:hover:bg-rose-950/60" onClick={reload}>重试</button>
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
            {tab.id === 'overview' && snapshot ? (
              <TriStateOverview
                snapshot={visibleSnapshot}
                directionId={directionId}
                window={safeWindow}
                onDirectionChange={changeDirection}
                onWindowChange={(nextWindow) => {
                  if (PLANNING_WINDOWS.some((item) => item.id === nextWindow)) setWindow(nextWindow)
                }}
                onEdit={openEdit}
                onCreate={openCreate}
              />
            ) : null}
            {tab.id === 'roadmap' && snapshot ? <PlanningRoadmap snapshot={visibleSnapshot} onEdit={openEdit} /> : null}
            {tab.id === 'tree' && snapshot ? (
              <PlanningTree
                snapshot={visibleSnapshot}
                onEdit={openEdit}
                onArchive={archiveItem}
                onCreate={openCreate}
                onLinkProject={openLinkProject}
                onCreateDependency={openDependency}
              />
            ) : null}
            {tab.id === 'history' && snapshot ? <PlanningHistory snapshot={visibleSnapshot} /> : null}
          </div>
        ))}
          </div>
        </AdminPage>
      </div>

      {importPanel ? (
        <PlanningImportPanel
          backgroundRef={backgroundRef}
          onApplied={reload}
          onClose={() => setImportPanel(false)}
        />
      ) : null}

      {editor?.mode === 'choose' ? (
        <QuickAddChooser backgroundRef={backgroundRef} onChoose={(entity) => openCreate(entity)} onClose={() => setEditor(null)} />
      ) : null}
      {editor?.entity ? (
        <PlanningEditor
          key={`${editor.mode}:${editor.entity}:${editor.initialValue?.id || 'new'}`}
          mode={editor.mode}
          entity={editor.entity}
          initialValue={editor.initialValue}
          context={editor.context}
          snapshot={visibleSnapshot}
          backgroundRef={backgroundRef}
          onSave={saveEditor}
          onClose={() => setEditor(null)}
          onOpenTree={() => {
            setActiveTab('tree')
          }}
        />
      ) : null}
    </>
  )
}
