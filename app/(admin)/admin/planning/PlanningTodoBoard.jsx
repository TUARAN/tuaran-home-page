'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconCheck,
  IconCircleCheck,
  IconGripVertical,
  IconPlus,
  IconSearch,
} from '@tabler/icons-react'

import { AdminButton, EmptyState, StatusPill } from '../../components/ui'
import { buildTodoBoardModel, formatPlanningDate } from './planningUi'

const COLUMNS = [
  { id: 'planned', label: '待办', empty: '暂无待办', tone: 'neutral' },
  { id: 'doing', label: '进行中', empty: '暂无进行中的任务', tone: 'info' },
  { id: 'done', label: '已完成', empty: '完成后的任务会放在这里', tone: 'success' },
]

const PRIORITY_META = {
  critical: { label: '关键', tone: 'danger' },
  high: { label: '高', tone: 'warning' },
}

function TodoCard({ item, moving, onEdit, onMove, onDragStart, onDragEnd }) {
  const completed = item.status === 'done'
  const priority = PRIORITY_META[item.priority]

  return (
    <article
      draggable={!moving}
      onDragStart={(event) => onDragStart(event, item)}
      onDragEnd={onDragEnd}
      className={`group rounded-xl border bg-[var(--admin-surface)] p-3 shadow-sm transition ${moving ? 'opacity-55' : 'hover:border-[var(--admin-focus)]'}`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          disabled={moving}
          onClick={() => onMove(item, completed ? 'planned' : 'done')}
          aria-label={completed ? `重新打开：${item.title}` : `完成：${item.title}`}
          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${completed ? 'border-emerald-600 bg-emerald-600 text-white' : 'text-transparent hover:border-emerald-600 hover:text-emerald-600'}`}
        >
          <IconCheck size={13} stroke={2.5} aria-hidden="true" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onEdit?.(item)}>
          <span className={`block text-sm font-medium leading-5 ${completed ? 'text-[var(--admin-muted)] line-through' : 'text-[var(--admin-ink)]'}`}>{item.title}</span>
          <span className="mt-1 block truncate text-[11px] text-[var(--admin-muted)]">
            {item.projectName || '未关联项目'} · {item.milestoneName}
          </span>
        </button>
        <span className="cursor-grab text-[var(--admin-muted)] opacity-45 group-hover:opacity-100" title="拖动切换状态">
          <IconGripVertical size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
        {priority ? <StatusPill tone={priority.tone} size="sm" icon={false}>{priority.label}</StatusPill> : null}
        {item.status === 'blocked' ? <StatusPill tone="danger" size="sm" icon={false}>受阻</StatusPill> : null}
        {item.targetAt ? <span className="text-[11px] text-[var(--admin-muted)]">截止 {formatPlanningDate(item.targetAt)}</span> : null}
        {!completed && item.status !== 'doing' ? (
          <button type="button" disabled={moving} onClick={() => onMove(item, 'doing')} className="text-[11px] font-medium text-[var(--admin-muted)] hover:text-[var(--admin-ink)]">
            {item.status === 'blocked' ? '继续' : '开始'}
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default function PlanningTodoBoard({ snapshot, onCreateTask, onEdit, onStatusChange }) {
  const availableMilestones = useMemo(() => (snapshot.milestones || []).filter((item) => (
    !['completed', 'cancelled', 'archived'].includes(item.status)
  )), [snapshot.milestones])
  const [milestoneId, setMilestoneId] = useState(availableMilestones[0]?.id || '')
  const [title, setTitle] = useState('')
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('all')
  const [includeCompleted, setIncludeCompleted] = useState(true)
  const [creating, setCreating] = useState(false)
  const [draggingId, setDraggingId] = useState('')
  const [dropTarget, setDropTarget] = useState('')
  const [pendingMoves, setPendingMoves] = useState({})

  useEffect(() => {
    if (!availableMilestones.some((item) => item.id === milestoneId)) {
      setMilestoneId(availableMilestones[0]?.id || '')
    }
  }, [availableMilestones, milestoneId])

  const effectiveSnapshot = useMemo(() => ({
    ...snapshot,
    tasks: (snapshot.tasks || []).map((item) => pendingMoves[item.id] ? { ...item, status: pendingMoves[item.id] } : item),
  }), [pendingMoves, snapshot])
  const board = useMemo(() => buildTodoBoardModel(effectiveSnapshot, {
    query,
    projectId,
    includeCompleted,
  }), [effectiveSnapshot, includeCompleted, projectId, query])

  async function submitQuickTask(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle || !milestoneId || creating) return
    setCreating(true)
    try {
      const saved = await onCreateTask?.({ title: cleanTitle, milestoneId })
      if (saved !== false) setTitle('')
    } finally {
      setCreating(false)
    }
  }

  async function moveTask(item, status) {
    if (item.status === status || pendingMoves[item.id]) return
    setPendingMoves((current) => ({ ...current, [item.id]: status }))
    try {
      await onStatusChange?.(item, status)
    } finally {
      setPendingMoves((current) => {
        const next = { ...current }
        delete next[item.id]
        return next
      })
    }
  }

  function dragStart(event, item) {
    setDraggingId(item.id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
  }

  function drop(event, status) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggingId
    const item = (effectiveSnapshot.tasks || []).find((task) => task.id === taskId)
    setDraggingId('')
    setDropTarget('')
    if (item) moveTask({ ...item, entityType: 'task' }, status)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-[var(--admin-surface)] p-4">
        <form onSubmit={submitQuickTask} className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_minmax(220px,320px)_auto]">
          <label className="relative block">
            <span className="sr-only">新待办</span>
            <IconPlus size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="记一件要做的事…"
              className="w-full rounded-lg border bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--admin-focus)]"
            />
          </label>
          <select aria-label="待办所属里程碑" value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)} className="rounded-lg border bg-transparent px-3 py-2.5 text-sm">
            {!availableMilestones.length ? <option value="">请先在规划树中创建里程碑</option> : null}
            {availableMilestones.map((milestone) => {
              const project = (snapshot.projects || []).find((item) => item.projectId === milestone.projectId)
              return <option key={milestone.id} value={milestone.id}>{project?.name || milestone.projectId} · {milestone.title}</option>
            })}
          </select>
          <AdminButton type="submit" variant="primary" disabled={!title.trim() || !milestoneId || creating}>
            {creating ? '添加中…' : '添加待办'}
          </AdminButton>
        </form>
        <p className="mb-0 mt-2 text-xs text-[var(--admin-muted)]">记录会直接进入规划任务，无需再到其他地方同步。</p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border bg-[var(--admin-surface)] p-3 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">搜索待办</span>
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索待办" className="w-full rounded-lg border bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--admin-focus)]" />
        </label>
        <select aria-label="按项目筛选待办" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="rounded-lg border bg-transparent px-3 py-2 text-sm md:w-56">
          <option value="all">全部项目</option>
          {board.projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.name || project.projectId}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 px-1 text-sm text-[var(--admin-muted)]">
          <input type="checkbox" checked={includeCompleted} onChange={(event) => setIncludeCompleted(event.target.checked)} className="h-4 w-4 rounded border" />
          显示已完成
        </label>
      </section>

      <div className="grid gap-4 xl:grid-cols-3" aria-label="待办看板">
        {COLUMNS.filter((column) => includeCompleted || column.id !== 'done').map((column) => (
          <section
            key={column.id}
            aria-label={column.label}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTarget(column.id) }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget('') }}
            onDrop={(event) => drop(event, column.id)}
            className={`min-h-48 rounded-2xl border bg-[var(--admin-surface-subtle)] p-3 transition ${dropTarget === column.id ? 'border-[var(--admin-focus)] ring-2 ring-[var(--admin-focus)]/15' : ''}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="m-0 font-serif text-base font-semibold">{column.label}</h2>
              <StatusPill tone={column.tone} size="sm" icon={false}>{board.groups[column.id].length}</StatusPill>
            </div>
            <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {board.groups[column.id].map((item) => (
                <TodoCard
                  key={item.id}
                  item={item}
                  moving={Boolean(pendingMoves[item.id])}
                  onEdit={onEdit}
                  onMove={moveTask}
                  onDragStart={dragStart}
                  onDragEnd={() => { setDraggingId(''); setDropTarget('') }}
                />
              ))}
              {!board.groups[column.id].length ? (
                <div className="rounded-xl border border-dashed px-3 py-8 text-center text-xs text-[var(--admin-muted)]">{column.empty}</div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {!board.counts.open && !board.counts.done ? (
        <EmptyState icon={IconCircleCheck} title="还没有待办" description="在上方输入一件事，从最小的下一步开始。" />
      ) : null}
    </div>
  )
}
