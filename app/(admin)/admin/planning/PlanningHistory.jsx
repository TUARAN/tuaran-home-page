'use client'

import { useMemo, useState } from 'react'
import { IconHistory } from '@tabler/icons-react'

import { EmptyState, StatusPill } from '../../components/ui'
import {
  PLANNING_STATUS_META,
  buildPlanningHistory,
  buildPlanningHistoryFilterOptions,
  formatPlanningDate,
} from './planningUi'

const TYPE_OPTIONS = [
  ['', '全部类型'], ['event', '全部事件'], ['decision', '决策'], ['created', '创建'],
  ['started', '开始'], ['blocked', '阻塞'], ['completed', '完成'], ['cancelled', '取消'],
  ['review', '复盘'], ['note', '备注'], ['imported', '导入'], ['corrected', '更正'],
]

const EVENT_LABELS = Object.fromEntries(TYPE_OPTIONS)

function fieldClass() {
  return 'rounded-lg border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-ink)] outline-none focus:border-[var(--admin-focus)]'
}

function DecisionCard({ item }) {
  const status = PLANNING_STATUS_META[item.status] || { label: item.status || '未设置', tone: 'neutral' }
  return (
    <article id={`planning-history-${item.id}`} className="rounded-xl border bg-[var(--admin-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">决策</p>
          <h3 className="mb-0 mt-1 text-base font-semibold">{item.title}</h3>
        </div>
        <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
      </div>
      <dl className="mb-0 mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-[var(--admin-muted)]">背景</dt><dd className="m-0 mt-1 whitespace-pre-wrap leading-6">{item.context || '—'}</dd></div>
        <div><dt className="text-xs text-[var(--admin-muted)]">结论</dt><dd className="m-0 mt-1 whitespace-pre-wrap leading-6">{item.conclusion || '尚未决策'}</dd></div>
        <div><dt className="text-xs text-[var(--admin-muted)]">理由</dt><dd className="m-0 mt-1 whitespace-pre-wrap leading-6">{item.rationale || '—'}</dd></div>
        <div><dt className="text-xs text-[var(--admin-muted)]">影响</dt><dd className="m-0 mt-1 whitespace-pre-wrap leading-6">{item.impact || '—'}</dd></div>
      </dl>
      <p className="mb-0 mt-4 text-xs text-[var(--admin-muted)]">{formatPlanningDate(item.timelineAt)}{item.projectName ? ` · ${item.projectName}` : ''}</p>
    </article>
  )
}

function EventCard({ item }) {
  return (
    <article id={`planning-history-${item.id}`} className="rounded-xl border bg-[var(--admin-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">{EVENT_LABELS[item.eventType] || item.eventType || '事件'}</p>
          <h3 className="mb-0 mt-1 text-base font-semibold">{item.title}</h3>
        </div>
        <span className="text-xs text-[var(--admin-muted)]">{formatPlanningDate(item.timelineAt)}</span>
      </div>
      {item.description ? <p className="mb-0 mt-3 whitespace-pre-wrap text-sm leading-6">{item.description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--admin-muted)]">
        <span>来源：{item.source || 'manual'}</span>
        {item.projectName ? <span>项目：{item.projectName}</span> : null}
        {item.correctionTargetId ? <a className="underline" href={`#planning-history-${item.correctionTargetId}`}>查看原事件</a> : null}
        {item.correctionIds.map((correctionId) => <a key={correctionId} className="underline" href={`#planning-history-${correctionId}`}>查看更正</a>)}
      </div>
    </article>
  )
}

export default function PlanningHistory({ snapshot }) {
  const [filters, setFilters] = useState({ directionId: '', projectId: '', type: '', from: '', to: '' })
  const timeline = useMemo(() => buildPlanningHistory(snapshot, filters), [filters, snapshot])
  const filterOptions = useMemo(() => buildPlanningHistoryFilterOptions(snapshot), [snapshot])
  const projects = useMemo(
    () => filterOptions.projects.filter((item) => !filters.directionId || item.directionId === filters.directionId),
    [filterOptions.projects, filters.directionId],
  )

  function change(event) {
    const { name, value } = event.target
    setFilters((current) => name === 'directionId'
      ? { ...current, directionId: value, projectId: '' }
      : { ...current, [name]: value })
  }

  return (
    <section className="rounded-2xl border bg-[var(--admin-surface)] p-4 sm:p-5" aria-labelledby="planning-history-title">
      <div>
        <h2 id="planning-history-title" className="m-0 font-serif text-lg font-semibold">历史与决策时间线</h2>
        <p className="mb-0 mt-1 text-xs leading-5 text-[var(--admin-muted)]">事件只追加不删除；错误记录通过更正事件保持完整追溯。</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" aria-label="历史筛选">
        <label className="grid gap-1 text-xs text-[var(--admin-muted)]">
          方向
          <select name="directionId" value={filters.directionId} className={fieldClass()} onChange={change}>
            <option value="">全部方向</option>
            {filterOptions.directions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[var(--admin-muted)]">
          项目
          <select name="projectId" value={filters.projectId} className={fieldClass()} onChange={change}>
            <option value="">全部项目</option>
            {projects.map((item) => <option key={item.id} value={item.projectId}>{item.name || item.projectId}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[var(--admin-muted)]">
          类型
          <select name="type" value={filters.type} className={fieldClass()} onChange={change}>
            {TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[var(--admin-muted)]">
          开始日期
          <input name="from" type="date" value={filters.from} className={fieldClass()} onChange={change} />
        </label>
        <label className="grid gap-1 text-xs text-[var(--admin-muted)]">
          结束日期
          <input name="to" type="date" value={filters.to} className={fieldClass()} onChange={change} />
        </label>
      </div>

      {timeline.length ? (
        <ol className="mt-5 space-y-3">
          {timeline.map((item) => (
            <li key={`${item.kind}:${item.id}`}>
              {item.kind === 'decision'
                ? <DecisionCard item={item} />
                : <EventCard item={item} />}
            </li>
          ))}
        </ol>
      ) : <EmptyState icon={IconHistory} title="没有符合条件的历史" description="调整筛选范围，或补录一条历史事件或决策。" />}
    </section>
  )
}
