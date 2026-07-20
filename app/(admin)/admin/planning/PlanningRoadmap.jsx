'use client'

import { IconAlertTriangle, IconTimelineEvent } from '@tabler/icons-react'

import { AdminButton, EmptyState, StatusPill } from '../../components/ui'
import {
  PLANNING_STATUS_META,
  buildRoadmapModel,
  formatPlanningDate,
} from './planningUi'

function MilestoneCard({ milestone, unscheduled = false, onEdit }) {
  const status = PLANNING_STATUS_META[milestone.status] || { label: milestone.status || '未设置', tone: 'neutral' }
  return (
    <article className={`min-w-[12rem] rounded-xl border bg-[var(--admin-surface)] p-3 ${unscheduled ? 'border-dashed' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-sm font-medium leading-5">{milestone.title}</p>
        <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
      </div>
      <p className="mb-0 mt-2 text-xs text-[var(--admin-muted)]">
        {unscheduled ? '待排期' : `目标 ${formatPlanningDate(milestone.targetAt)}`}
      </p>
      <AdminButton type="button" size="sm" variant="ghost" className="mt-2" onClick={() => onEdit?.({ ...milestone, entityType: 'milestone' })}>
        编辑
      </AdminButton>
    </article>
  )
}

function MilestoneStack({ items, onEdit, empty = '—' }) {
  if (!items.length) return <span className="text-xs text-[var(--admin-muted)]">{empty}</span>
  return (
    <div className="space-y-2">
      {items.map((item) => <MilestoneCard key={item.id} milestone={item} onEdit={onEdit} />)}
    </div>
  )
}

export default function PlanningRoadmap({ snapshot, onEdit }) {
  const model = buildRoadmapModel(snapshot)

  if (!model.rows.length) {
    return (
      <section className="rounded-2xl border bg-[var(--admin-surface)]">
        <EmptyState icon={IconTimelineEvent} title="还没有可比较的项目路线" description="先在规划树中为方向关联项目，再添加里程碑。" />
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-[var(--admin-surface)]" aria-labelledby="planning-roadmap-title">
      <div className="border-b px-4 py-4 sm:px-5">
        <h2 id="planning-roadmap-title" className="m-0 font-serif text-lg font-semibold">项目组合路线图</h2>
        <p className="mb-0 mt-1 text-xs leading-5 text-[var(--admin-muted)]">
          当前季度：{formatPlanningDate(model.quarterStart)} 至 {formatPlanningDate(model.quarterEnd)}。依赖风险按上游阻塞或逾期状态提示。
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[62rem] border-collapse text-left">
          <thead className="bg-[var(--admin-surface-subtle)] text-xs text-[var(--admin-muted)]">
            <tr>
              <th className="w-52 border-b px-4 py-3 font-medium">项目</th>
              <th className="border-b px-4 py-3 font-medium">过去</th>
              <th className="border-b px-4 py-3 font-medium">本季度</th>
              <th className="border-b px-4 py-3 font-medium">未来</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row.id} className="align-top">
                <th scope="row" className="border-b px-4 py-4 font-normal">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold">{row.name || row.projectId}</p>
                      <p className="mb-0 mt-1 text-xs text-[var(--admin-muted)]">活动依赖 {row.activeDependencyCount}</p>
                    </div>
                    {row.hasUpstreamRisk ? (
                      <span title="上游事项受阻或逾期" aria-label="上游事项受阻或逾期" className="shrink-0 text-amber-600">
                        <IconAlertTriangle size={18} aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                </th>
                <td className="border-b px-4 py-4"><MilestoneStack items={row.columns.past} onEdit={onEdit} /></td>
                <td className="border-b px-4 py-4"><MilestoneStack items={row.columns.current} onEdit={onEdit} /></td>
                <td className="border-b px-4 py-4">
                  <MilestoneStack items={row.columns.future} onEdit={onEdit} />
                  {row.columns.unscheduled.length ? (
                    <div className={row.columns.future.length ? 'mt-3 space-y-2' : 'space-y-2'}>
                      {row.columns.unscheduled.map((item) => <MilestoneCard key={item.id} milestone={item} unscheduled onEdit={onEdit} />)}
                    </div>
                  ) : null}
                  {!row.columns.future.length && !row.columns.unscheduled.length ? <span className="text-xs text-[var(--admin-muted)]">—</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
