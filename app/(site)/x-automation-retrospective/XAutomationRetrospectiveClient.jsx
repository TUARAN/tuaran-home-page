'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import {
  X_AUTOMATION_ARCHITECTURE,
  X_AUTOMATION_DAILY_POSTS,
  X_AUTOMATION_PHASES,
  X_AUTOMATION_SCALE_MILESTONES,
  X_AUTOMATION_SCHEDULE_SNAPSHOTS,
  X_AUTOMATION_STATUS,
  X_AUTOMATION_SUMMARY,
  X_AUTOMATION_VIEWS,
  maxDailyPosts,
  phaseToneColor,
  sumDailyPosts,
} from '../../../lib/xAutomationRetrospective'

const STATS_BAR_DEFAULT = '#8a8f7a'
const STATS_BAR_ACTIVE = '#3f6a8a'
const STATS_BAR_HOVER = '#059669'
const STATUS_PANEL_BORDER = '#fecdd3'
const STATUS_PANEL_BG = '#fff1f2'
const STATUS_PANEL_TEXT = '#be123c'
const SLOT_ACTIVE_BG = '#d1fae5'
const SLOT_ACTIVE_TEXT = '#065f46'

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_72%,transparent)] px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[var(--site-ink)]">{value}</p>
      {sub ? <p className="mt-1 text-[12px] leading-5 text-[var(--site-muted)]">{sub}</p> : null}
    </div>
  )
}

function PhaseBar({ milestones, onSelectPhase }) {
  const maxPosts = Math.max(...milestones.map((item) => item.postsPerDay), 1)

  return (
    <div className="space-y-2">
      {milestones.map((item) => {
        const widthPct = item.postsPerDay
          ? Math.max((item.postsPerDay / maxPosts) * 100, 6)
          : 0
        return (
          <button
            key={item.phaseId}
            type="button"
            className="group grid w-full grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_28px] items-center gap-3 text-left sm:grid-cols-[112px_minmax(0,1fr)_36px]"
            onClick={() => onSelectPhase(item.phaseId)}
          >
            <span className="min-w-0">
              <span className="block font-mono text-[10px] text-[var(--site-faint)]">{item.date.slice(5)}</span>
              <span className="block truncate text-[12px] text-[var(--site-muted)] group-hover:text-[var(--site-ink)]">{item.label}</span>
            </span>
            <span className="relative h-3 min-w-0 overflow-hidden rounded-full bg-[var(--site-line)]" aria-hidden="true">
              {widthPct > 0 ? (
                <span
                  className="absolute inset-y-0 left-0 block rounded-full transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: phaseToneColor(item.tone) }}
                />
              ) : (
                <span
                  className="absolute inset-y-0 left-0 block w-[6%] rounded-full opacity-40"
                  style={{ backgroundColor: phaseToneColor(item.tone) }}
                />
              )}
            </span>
            <span className="text-right font-mono text-[11px] tabular-nums text-[var(--site-muted)]">{item.postsPerDay || '—'}</span>
          </button>
        )
      })}
    </div>
  )
}

function OverviewPanel({ onSelectPhase }) {
  return (
    <div className="space-y-6">
      <article
        className="rounded-xl border p-4 dark:border-rose-900/40 dark:bg-rose-950/20"
        style={{ borderColor: STATUS_PANEL_BORDER, backgroundColor: STATUS_PANEL_BG }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: STATUS_PANEL_TEXT }}>
          Current Status · 当前状态
        </p>
        <h2 className="mt-2 font-serif text-[20px] font-semibold text-[var(--site-ink)]">已暂停（{X_AUTOMATION_STATUS.pausedAt}）</h2>
        <p className="mt-2 text-[13.5px] leading-7 text-[var(--site-muted)]">{X_AUTOMATION_STATUS.pausedReason}</p>
        <p className="mt-2 text-[13px] leading-6 text-[var(--site-muted)]">
          最后一条：
          <a href={X_AUTOMATION_STATUS.lastPostUrl} target="_blank" rel="noreferrer" className="ml-1 text-[var(--site-accent)] no-underline hover:underline">
            {X_AUTOMATION_STATUS.lastPostDate} {X_AUTOMATION_STATUS.lastPostSlot}
          </a>
        </p>
      </article>

      <section>
        <h2 className="font-serif text-[18px] font-semibold text-[var(--site-ink)]">规模变化</h2>
        <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">
          从 8/4 的单条早安，到 8 月底的十条矩阵，再到 9/9 收束为五条。8/23–8/28 为类型扩张过渡期，完整阶段见「时间线」。
        </p>
        <div className="mt-4 rounded-xl border border-[var(--site-line)] p-4">
          <PhaseBar milestones={X_AUTOMATION_SCALE_MILESTONES} onSelectPhase={onSelectPhase} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">
            仅展示档位变化节点 · 柱长为每日活跃槽位数 · 点击跳转时间线
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[18px] font-semibold text-[var(--site-ink)]">发布链路</h2>
        <ol className="mt-3 space-y-2">
          {X_AUTOMATION_ARCHITECTURE.map((item) => (
            <li key={item.step} className="rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-accent)]">{item.step} · {item.title}</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--site-muted)]">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_65%,transparent)] p-4">
        <h2 className="font-serif text-[18px] font-semibold text-[var(--site-ink)]">相关入口</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-[13px]">
          <li><Link href="/admin/morning-greeting" className="rounded-full border border-[var(--site-line)] px-3 py-1 no-underline text-[var(--site-muted)] hover:text-[var(--site-ink)]">X 发布任务后台</Link></li>
          <li><a href="https://github.com/TUARAN/tuaran-home-page/actions/workflows/morning-greeting.yml" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--site-line)] px-3 py-1 no-underline text-[var(--site-muted)] hover:text-[var(--site-ink)]">GitHub Actions</a></li>
          <li><Link href="/resources/x-article-autopublisher-extension" className="rounded-full border border-[var(--site-line)] px-3 py-1 no-underline text-[var(--site-muted)] hover:text-[var(--site-ink)]">X Article 自动发布</Link></li>
        </ul>
      </section>
    </div>
  )
}

function TimelinePanel({ activeId, onSelectPhase }) {
  const active = X_AUTOMATION_PHASES.find((phase) => phase.id === activeId) || X_AUTOMATION_PHASES[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-1">
        {X_AUTOMATION_PHASES.map((phase) => {
          const selected = phase.id === activeId
          return (
            <button
              key={phase.id}
              id={`phase-${phase.id}`}
              type="button"
              onClick={() => onSelectPhase(phase.id)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                selected
                  ? 'border-[var(--site-accent)] bg-[var(--site-panel)] text-[var(--site-ink)]'
                  : 'border-transparent text-[var(--site-muted)] hover:border-[var(--site-line)] hover:bg-[var(--site-panel)]'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: phaseToneColor(phase.tone) }} />
              <span className="min-w-0">
                <span className="block font-mono text-[10px] text-[var(--site-faint)]">{phase.date}</span>
                <span className="block text-[13px] font-medium">{phase.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      <article className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 md:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-accent)]">{active.date}</p>
        <h2 className="mt-2 font-serif text-[22px] font-semibold text-[var(--site-ink)]">{active.label}</h2>
        <p className="mt-2 text-[14px] leading-7 text-[var(--site-muted)]">{active.summary}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--site-line)] px-3 py-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--site-faint)]">活跃槽位</dt>
            <dd className="mt-1 text-[15px] font-semibold text-[var(--site-ink)]">{active.postsPerDay || '暂停'}</dd>
          </div>
          {active.commit ? (
            <div className="rounded-lg border border-[var(--site-line)] px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--site-faint)]">关键 commit</dt>
              <dd className="mt-1 font-mono text-[13px] text-[var(--site-ink)]">
                <a
                  href={`https://github.com/TUARAN/tuaran-home-page/commit/${active.commit}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--site-accent)] no-underline hover:underline"
                >
                  {active.commit}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        <ul className="mt-4 space-y-1.5">
          {active.highlights.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] leading-6 text-[var(--site-muted)]">
              <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--site-accent)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}

function SchedulePanel() {
  const [snapshotId, setSnapshotId] = useState(X_AUTOMATION_SCHEDULE_SNAPSHOTS.at(-1).phaseId)
  const snapshot = X_AUTOMATION_SCHEDULE_SNAPSHOTS.find((item) => item.phaseId === snapshotId)
    || X_AUTOMATION_SCHEDULE_SNAPSHOTS[0]

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {X_AUTOMATION_SCHEDULE_SNAPSHOTS.map((item) => (
          <button
            key={item.phaseId}
            type="button"
            onClick={() => setSnapshotId(item.phaseId)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
              snapshotId === item.phaseId
                ? 'border-[var(--site-accent)] bg-[var(--site-panel)] text-[var(--site-ink)]'
                : 'border-[var(--site-line)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--site-line)]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="bg-[color-mix(in_srgb,var(--site-panel-strong)_80%,transparent)] font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">
            <tr>
              <th className="px-3 py-2">时段</th>
              <th className="px-3 py-2">基准时间（北京）</th>
              <th className="px-3 py-2">类型</th>
              <th className="px-3 py-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.slots.map((slot) => (
              <tr key={slot.id} className="border-t border-[var(--site-line)]">
                <td className="px-3 py-2 font-medium text-[var(--site-ink)]">{slot.id}</td>
                <td className="px-3 py-2 text-[var(--site-muted)]">{slot.time}</td>
                <td className="px-3 py-2 text-[var(--site-muted)]">{slot.type}</td>
                <td className="px-3 py-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={slot.active
                      ? { backgroundColor: SLOT_ACTIVE_BG, color: SLOT_ACTIVE_TEXT }
                      : { backgroundColor: 'var(--site-line)', color: 'var(--site-faint)' }}
                  >
                    {slot.active ? '活跃' : '停用'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {snapshot.paused?.length ? (
        <p className="mt-3 text-[13px] leading-6 text-[var(--site-muted)]">
          代码层暂停：<span className="font-mono text-[12px]">{snapshot.paused.join('、')}</span>。手动与旧 cron 请求返回 slot_paused。
        </p>
      ) : null}

      <p className="mt-3 text-[12.5px] leading-6 text-[var(--site-faint)]">
        基准时间来自 lib/xPostingSchedule.js 与各时段定义；各时段 ±30 分钟随机浮动，到期后最多补跑 1 小时。
      </p>
    </div>
  )
}

function StatsPanel() {
  const [selectedDate, setSelectedDate] = useState('')
  const peak = maxDailyPosts()
  const selected = X_AUTOMATION_DAILY_POSTS.find((day) => day.date === selectedDate)
  const trackedTotal = sumDailyPosts()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="有成本记录" value={`${trackedTotal} 条`} sub={`与 D1 汇总 ${X_AUTOMATION_SUMMARY.trackedPosts} 条一致 · 自 ${X_AUTOMATION_SUMMARY.costTrackingSince}`} />
        <StatCard label="估算总量" value={X_AUTOMATION_SUMMARY.estimatedTotalPosts} sub="含 8/4–8/25 未计成本段" />
        <StatCard label="追踪 API 成本" value={`$${X_AUTOMATION_SUMMARY.trackedCostUsd.toFixed(2)}`} sub={`估算全周期 ${X_AUTOMATION_SUMMARY.estimatedTotalCostUsd} USD`} />
        <StatCard label="Actions 运行" value={`${X_AUTOMATION_SUMMARY.workflowRuns}+`} sub={`素材记录 ${X_AUTOMATION_SUMMARY.assetRecords} 条`} />
      </div>

      <section>
        <h2 className="font-serif text-[18px] font-semibold text-[var(--site-ink)]">每日发帖量（有 API 成本记录）</h2>
        <p className="mt-1 text-[13px] text-[var(--site-muted)]">
          点击柱子查看当日备注。8/4–8/25 尚未计入成本表；9/2 无记录（该日未产生计费帖）。
        </p>
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-[720px] items-end gap-1.5">
            {X_AUTOMATION_DAILY_POSTS.map((day) => {
              const height = Math.max((day.posts / peak) * 120, day.posts ? 12 : 4)
              const active = selectedDate === day.date
              return (
                <button
                  key={day.date}
                  type="button"
                  title={`${day.date}: ${day.posts} 条${day.note ? ` · ${day.note}` : ''}`}
                  onClick={() => setSelectedDate((current) => (current === day.date ? '' : day.date))}
                  className="group flex min-w-[22px] flex-1 flex-col items-center gap-1"
                >
                  <span
                    className="block w-full max-w-[20px] rounded-t-sm transition"
                    style={{
                      height,
                      backgroundColor: active ? STATS_BAR_ACTIVE : STATS_BAR_DEFAULT,
                    }}
                    onMouseEnter={(event) => {
                      if (!active) event.currentTarget.style.backgroundColor = STATS_BAR_HOVER
                    }}
                    onMouseLeave={(event) => {
                      if (!active) event.currentTarget.style.backgroundColor = STATS_BAR_DEFAULT
                    }}
                  />
                  <span className="font-mono text-[9px] leading-none text-[var(--site-faint)]">{day.date.slice(5)}</span>
                </button>
              )
            })}
          </div>
        </div>
        {selected ? (
          <p className="mt-2 rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-2 text-[13px] text-[var(--site-muted)]">
            <span className="font-semibold text-[var(--site-ink)]">{selected.date}</span>
            {' '}· {selected.posts} 条
            {selected.note ? ` · ${selected.note}` : ''}
          </p>
        ) : null}
      </section>
    </div>
  )
}

export default function XAutomationRetrospectiveClient() {
  const [view, setView] = useState('overview')
  const [activePhaseId, setActivePhaseId] = useState(X_AUTOMATION_PHASES[0].id)
  const [pendingScrollPhaseId, setPendingScrollPhaseId] = useState('')
  const activeView = X_AUTOMATION_VIEWS.find((item) => item.id === view) || X_AUTOMATION_VIEWS[0]

  const selectPhase = (phaseId) => {
    setActivePhaseId(phaseId)
    setView('timeline')
    setPendingScrollPhaseId(phaseId)
  }

  useEffect(() => {
    if (view !== 'timeline' || !pendingScrollPhaseId) return
    const el = document.getElementById(`phase-${pendingScrollPhaseId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setPendingScrollPhaseId('')
  }, [view, pendingScrollPhaseId])

  const panel = useMemo(() => {
    if (view === 'timeline') return <TimelinePanel activeId={activePhaseId} onSelectPhase={setActivePhaseId} />
    if (view === 'schedule') return <SchedulePanel />
    if (view === 'stats') return <StatsPanel />
    return <OverviewPanel onSelectPhase={selectPhase} />
  }, [view, activePhaseId])

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 border-b border-[var(--site-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--site-faint)]">Interactive Retrospective</p>
          <h2 className="mt-1 font-serif text-[20px] font-semibold text-[var(--site-ink)]">{activeView.label}</h2>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="回溯视图">
          {X_AUTOMATION_VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              aria-controls="x-automation-retrospective-panel"
              onClick={() => setView(item.id)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                view === item.id
                  ? 'border-[var(--site-accent)] bg-[var(--site-panel)] text-[var(--site-ink)]'
                  : 'border-[var(--site-line)] text-[var(--site-muted)] hover:text-[var(--site-ink)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div id="x-automation-retrospective-panel" className="mt-6" role="tabpanel">
        {panel}
      </div>
    </section>
  )
}
