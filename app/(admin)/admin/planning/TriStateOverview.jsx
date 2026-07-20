import { IconHistory, IconTargetArrow, IconTimelineEvent } from '@tabler/icons-react'

import { AdminButton, EmptyState, StatCard, StatusPill } from '../../components/ui'
import {
  PLANNING_STATUS_META,
  PLANNING_WINDOWS,
  buildOverviewModel,
  formatPlanningDate,
} from './planningUi'

const PRIORITY_META = {
  high: { label: '高优先级', tone: 'danger' },
  normal: { label: '普通', tone: 'neutral' },
  low: { label: '低优先级', tone: 'neutral' },
}

function statusMeta(status) {
  return PLANNING_STATUS_META[status] || { label: status || '未设置', tone: 'neutral' }
}

function WorkItemCard({ item, onEdit, onCreate }) {
  const status = statusMeta(item.status)
  const priority = PRIORITY_META[item.priority] || { label: item.priority || '普通', tone: 'neutral' }
  const canAddTask = item.entityType === 'milestone' && item.status !== 'completed' && item.status !== 'cancelled'

  return (
    <article className="rounded-xl border bg-[var(--admin-surface)] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium leading-6 text-[var(--admin-ink)]">{item.title}</p>
          {item.projectName ? <p className="m-0 mt-0.5 truncate text-xs text-[var(--admin-muted)]">{item.projectName}</p> : null}
        </div>
        <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill tone={priority.tone} size="sm" icon={false}>{priority.label}</StatusPill>
        <span className="text-xs text-[var(--admin-muted)]">目标 {formatPlanningDate(item.targetAt)}</span>
      </div>
      {item.status === 'blocked' && item.blockedReason ? (
        <p className="mb-0 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs leading-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          阻塞原因：{item.blockedReason}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
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

function FutureGroup({ title, items, onEdit, onCreate }) {
  if (!items.length) return null
  return (
    <section aria-label={title}>
      <h3 className="mb-2 mt-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => <WorkItemCard key={`${item.entityType}:${item.id}`} item={item} onEdit={onEdit} onCreate={onCreate} />)}
      </div>
    </section>
  )
}

export default function TriStateOverview({
  snapshot,
  directionId,
  window,
  onDirectionChange,
  onWindowChange,
  onEdit,
  onCreate,
}) {
  const model = buildOverviewModel(snapshot, directionId)
  const futureCount = Object.values(model.future).reduce((total, items) => total + items.length, 0)
  const selectedDirection = (snapshot.directions || []).find((item) => item.id === directionId)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-[var(--admin-surface)] p-4 sm:p-5" aria-labelledby="planning-strategy-title">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-2xl">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">当前北极星</p>
            <h2 id="planning-strategy-title" className="mb-0 mt-2 font-serif text-xl font-semibold text-[var(--admin-ink)]">
              {model.northStar || '为这个方向补充本期北极星。'}
            </h2>
            {selectedDirection ? (
              <AdminButton type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onEdit?.({ ...selectedDirection, entityType: 'direction' })}>
                编辑方向
              </AdminButton>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="方向筛选">
            <button
              type="button"
              aria-pressed={!directionId}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${!directionId ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`}
              onClick={() => onDirectionChange('')}
            >
              全部方向
            </button>
            {(snapshot.directions || []).map((direction) => (
              <button
                key={direction.id}
                type="button"
                aria-pressed={directionId === direction.id}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${directionId === direction.id ? 'bg-[var(--admin-ink)] text-[var(--admin-surface)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-ink)]'}`}
                onClick={() => onDirectionChange(direction.id)}
              >
                {direction.title}
              </button>
            ))}
            <label className="sr-only" htmlFor="planning-window">时间窗口</label>
            <select id="planning-window" value={window} className="rounded-full border bg-transparent px-3 py-1.5 text-sm" onChange={(event) => onWindowChange(event.target.value)}>
              {PLANNING_WINDOWS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="本期完成" value={model.stats.completed} tone="success" />
          <StatCard label="当前焦点" value={model.stats.focus} tone="info" />
          <StatCard label="受阻 / 逾期" value={`${model.stats.blocked} / ${model.stats.overdue}`} tone="danger" />
          <StatCard label="待决策" value={model.stats.decisions} tone="warning" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border bg-[var(--admin-surface)] p-4" aria-labelledby="planning-past-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="planning-past-title" className="m-0 font-serif text-lg font-semibold">过去</h2>
            <StatusPill tone="success" size="sm" icon={false}>{model.past.length}</StatusPill>
          </div>
          {model.past.length ? (
            <div className="space-y-3">
              {model.past.map((item) => (
                <article key={item.id} className="rounded-xl border p-3">
                  <div className="flex items-start gap-2">
                    <IconHistory size={17} className="mt-0.5 shrink-0 text-[var(--admin-muted)]" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium leading-6">{item.title}</p>
                      <p className="m-0 mt-1 text-xs text-[var(--admin-muted)]">
                        {formatPlanningDate(item.occurredAt)}{item.projectName ? ` · ${item.projectName}` : ''}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={IconHistory} title="过去会在推进中沉淀" description="完成任务或补录历史后，这里会形成时间线。" />
          )}
        </section>

        <section className="rounded-2xl border bg-[var(--admin-surface)] p-4" aria-labelledby="planning-present-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="planning-present-title" className="m-0 font-serif text-lg font-semibold">现在</h2>
            <StatusPill tone="info" size="sm" icon={false}>{model.present.length}</StatusPill>
          </div>
          {model.present.length ? (
            <div className="space-y-3">
              {model.present.map((item) => <WorkItemCard key={`${item.entityType}:${item.id}`} item={item} onEdit={onEdit} onCreate={onCreate} />)}
            </div>
          ) : (
            <EmptyState icon={IconTargetArrow} title="当前没有正在推进的事项" description="还没有当前焦点；开始一个计划，或添加进行中的任务。" />
          )}
        </section>

        <section className="rounded-2xl border bg-[var(--admin-surface)] p-4" aria-labelledby="planning-future-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="planning-future-title" className="m-0 font-serif text-lg font-semibold">未来</h2>
            <StatusPill tone="neutral" size="sm" icon={false}>{futureCount}</StatusPill>
          </div>
          {futureCount ? (
            <div className="space-y-5">
              <FutureGroup title="近期 · 30 天内" items={model.future.near} onEdit={onEdit} onCreate={onCreate} />
              <FutureGroup title="中期 · 31–90 天" items={model.future.mid} onEdit={onEdit} onCreate={onCreate} />
              <FutureGroup title="长期 · 90 天后" items={model.future.long} onEdit={onEdit} onCreate={onCreate} />
              <FutureGroup title="待排期" items={model.future.unscheduled} onEdit={onEdit} onCreate={onCreate} />
            </div>
          ) : (
            <EmptyState icon={IconTimelineEvent} title="未来还没有清晰落点" description="还没有未来计划；创建里程碑来明确下一步。" />
          )}
        </section>
      </div>
    </div>
  )
}
