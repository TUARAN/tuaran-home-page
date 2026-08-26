'use client'

import { useMemo, useState } from 'react'
import { IconChecklist, IconSearch } from '@tabler/icons-react'

import { AdminButton, EmptyState, StatCard, StatusPill } from '../../components/ui'
import {
  PLANNING_STATUS_META,
  buildExecutionBoardModel,
  buildOverviewModel,
  formatPlanningDate,
} from './planningUi'

const PRIORITY_META = {
  critical: { label: '关键', tone: 'danger' },
  high: { label: '高优先级', tone: 'danger' },
  normal: { label: '普通', tone: 'neutral' },
  low: { label: '低优先级', tone: 'neutral' },
}

const STAGES = [
  { id: 'running', label: '执行中', tone: 'info' },
  { id: 'pending', label: '待执行', tone: 'neutral' },
  { id: 'blocked', label: '受阻', tone: 'danger' },
  { id: 'completed', label: '已完成', tone: 'success' },
  { id: 'all', label: '全部', tone: 'neutral' },
]

const GROUP_META = {
  pending: { label: '待执行', tone: 'neutral' },
  running: { label: '执行中', tone: 'info' },
  blocked: { label: '受阻', tone: 'danger' },
  completed: { label: '已完成', tone: 'success' },
  other: { label: '暂停或取消', tone: 'neutral' },
}

function statusMeta(status) {
  return PLANNING_STATUS_META[status] || { label: status || '未设置', tone: 'neutral' }
}

function nextAction(item) {
  if (item.status === 'planned') {
    return { label: '开始执行', status: item.entityType === 'task' ? 'doing' : 'active' }
  }
  if (item.status === 'blocked') {
    return { label: '恢复执行', status: item.entityType === 'task' ? 'doing' : 'active' }
  }
  if (item.status === 'doing' || item.status === 'active') {
    return { label: '标记完成', status: item.entityType === 'task' ? 'done' : 'completed' }
  }
  return null
}

function WorkItemCard({ item, onEdit, onCreate, onStatusChange }) {
  const status = statusMeta(item.status)
  const priority = PRIORITY_META[item.priority] || { label: item.priority || '普通', tone: 'neutral' }
  const action = nextAction(item)
  const canAddTask = item.entityType === 'milestone' && !['completed', 'cancelled'].includes(item.status)

  return (
    <article className="rounded-xl border bg-[var(--admin-surface)] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium leading-6 text-[var(--admin-ink)]">{item.title}</p>
          <p className="m-0 mt-0.5 truncate text-xs text-[var(--admin-muted)]">
            {item.projectName || '未关联项目'} · {item.entityType === 'task' ? '任务' : '里程碑'}
          </p>
        </div>
        <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusPill tone={priority.tone} size="sm" icon={false}>{priority.label}</StatusPill>
        <span className="text-xs text-[var(--admin-muted)]">目标 {formatPlanningDate(item.targetAt)}</span>
      </div>
      {item.status === 'blocked' && item.blockedReason ? (
        <p className="mb-0 mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs leading-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {item.blockedReason}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {action ? <AdminButton type="button" size="sm" onClick={() => onStatusChange?.(item, action.status)}>{action.label}</AdminButton> : null}
        <AdminButton type="button" size="sm" variant="ghost" onClick={() => onEdit?.(item)}>编辑</AdminButton>
        {canAddTask ? (
          <AdminButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onCreate?.('task', {
              directionId: item.directionId,
              projectId: item.projectId,
              milestoneId: item.id,
            })}
          >
            添加任务
          </AdminButton>
        ) : null}
      </div>
    </article>
  )
}

export default function TriStateOverview({
  snapshot,
  directionId,
  onDirectionChange,
  onEdit,
  onCreate,
  onStatusChange,
}) {
  const [stage, setStage] = useState('running')
  const [projectId, setProjectId] = useState('all')
  const [entityType, setEntityType] = useState('all')
  const [query, setQuery] = useState('')
  const overview = buildOverviewModel(snapshot, directionId)
  const board = useMemo(() => buildExecutionBoardModel(snapshot, {
    directionId,
    projectId,
    entityType,
    query,
    stage,
  }), [directionId, entityType, projectId, query, snapshot, stage])
  const visibleStages = stage === 'all' ? ['running', 'pending', 'blocked', 'completed', 'other'] : [stage]
  const visibleCount = visibleStages.reduce((total, id) => total + board.groups[id].length, 0)
  const selectedDirection = (snapshot.directions || []).find((item) => item.id === directionId)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-[var(--admin-surface)] p-4 sm:p-5" aria-labelledby="planning-strategy-title">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-2xl">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">当前北极星</p>
            <h2 id="planning-strategy-title" className="mb-0 mt-2 font-serif text-xl font-semibold text-[var(--admin-ink)]">
              {overview.northStar || '为这个方向补充本期北极星。'}
            </h2>
            {selectedDirection ? <AdminButton type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onEdit?.({ ...selectedDirection, entityType: 'direction' })}>编辑方向</AdminButton> : null}
          </div>
          <div className="flex max-w-3xl flex-wrap gap-2" aria-label="方向筛选">
            <button type="button" aria-pressed={!directionId} className={`rounded-full border px-3 py-1.5 text-sm transition ${!directionId ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`} onClick={() => { onDirectionChange(''); setProjectId('all') }}>全部方向</button>
            {(snapshot.directions || []).map((direction) => (
              <button key={direction.id} type="button" aria-pressed={directionId === direction.id} className={`rounded-full border px-3 py-1.5 text-sm transition ${directionId === direction.id ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`} onClick={() => { onDirectionChange(direction.id); setProjectId('all') }}>{direction.title}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="已完成" value={overview.stats.completed} tone="success" />
          <StatCard label="当前焦点" value={overview.stats.focus} tone="info" />
          <StatCard label="受阻 / 逾期" value={`${overview.stats.blocked} / ${overview.stats.overdue}`} tone="danger" />
          <StatCard label="待决策" value={overview.stats.decisions} tone="warning" />
        </div>
      </section>

      <section className="rounded-2xl border bg-[var(--admin-surface)] p-4">
        <div className="flex flex-wrap gap-2" aria-label="执行状态筛选">
          {STAGES.map((item) => (
            <button key={item.id} type="button" aria-pressed={stage === item.id} onClick={() => setStage(item.id)} className={`rounded-full border px-3 py-1.5 text-sm transition ${stage === item.id ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`}>
              {item.label} {board.counts[item.id]}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_150px]">
          <label className="relative block">
            <span className="sr-only">搜索规划事项</span>
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索事项或项目" className="w-full rounded-lg border bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--admin-focus)]" />
          </label>
          <select aria-label="按项目筛选" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="rounded-lg border bg-transparent px-3 py-2 text-sm">
            <option value="all">全部项目</option>
            {board.projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.name || project.projectId}</option>)}
          </select>
          <select aria-label="按事项类型筛选" value={entityType} onChange={(event) => setEntityType(event.target.value)} className="rounded-lg border bg-transparent px-3 py-2 text-sm">
            <option value="all">全部类型</option>
            <option value="milestone">里程碑</option>
            <option value="task">任务</option>
          </select>
        </div>
      </section>

      {visibleCount ? (
        <div className={`grid gap-4 ${stage === 'all' ? 'xl:grid-cols-3' : ''}`}>
          {visibleStages.map((stageId) => board.groups[stageId].length ? (
            <section key={stageId} className="rounded-2xl border bg-[var(--admin-surface)] p-4" aria-label={GROUP_META[stageId].label}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="m-0 font-serif text-lg font-semibold">{GROUP_META[stageId].label}</h2>
                <StatusPill tone={GROUP_META[stageId].tone} size="sm" icon={false}>{board.groups[stageId].length}</StatusPill>
              </div>
              <div className={stage === 'all' ? 'space-y-3' : 'grid gap-3 md:grid-cols-2 2xl:grid-cols-3'}>
                {board.groups[stageId].map((item) => <WorkItemCard key={`${item.entityType}:${item.id}`} item={item} onEdit={onEdit} onCreate={onCreate} onStatusChange={onStatusChange} />)}
              </div>
            </section>
          ) : null)}
        </div>
      ) : (
        <EmptyState icon={IconChecklist} title="没有符合条件的事项" description="调整执行状态、项目、类型或关键词筛选。" />
      )}
    </div>
  )
}
