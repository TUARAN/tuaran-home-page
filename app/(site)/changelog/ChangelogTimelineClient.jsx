'use client'

import { useMemo, useState } from 'react'

import { buildChangelogPeriods, CHANGELOG_PERIOD_VIEWS } from '../../../lib/changelogPeriods'

function ChangelogItemList({ items, markerClass }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[13px] leading-6 text-[var(--site-muted)]">
          <span className={`mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full ${markerClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChangelogSections({ entry }) {
  const usesSplitFormat = 'planned' in entry || 'done' in entry
  const doneItems = entry.done ?? entry.items ?? []
  const plannedItems = entry.planned ?? []

  if (!usesSplitFormat) {
    return <ChangelogItemList items={doneItems} markerClass="bg-[#aaae9c] dark:bg-[#536071]" />
  }

  return (
    <div className="mt-3 grid gap-4 xl:grid-cols-2">
      <section>
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-accent)]">
          已做
        </h4>
        {doneItems.length > 0 ? (
          <ChangelogItemList items={doneItems} markerClass="bg-emerald-500/80 dark:bg-emerald-400/80" />
        ) : (
          <p className="text-[13px] leading-6 text-[var(--site-faint)]">（本周期尚未交付）</p>
        )}
      </section>
      <section>
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-faint)]">
          计划
        </h4>
        {plannedItems.length > 0 ? (
          <ChangelogItemList items={plannedItems} markerClass="bg-[#c8cabb] dark:bg-[#4a5568]" />
        ) : (
          <p className="text-[13px] leading-6 text-[var(--site-faint)]">（暂无后续计划）</p>
        )}
      </section>
    </div>
  )
}

export default function ChangelogTimelineClient({ entries }) {
  const [view, setView] = useState('week')
  const periods = useMemo(() => buildChangelogPeriods(entries, view), [entries, view])
  const activeView = CHANGELOG_PERIOD_VIEWS.find((option) => option.id === view) || CHANGELOG_PERIOD_VIEWS[0]

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 border-b border-[var(--site-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--site-faint)]">
            Timeline View · 时间维度
          </p>
          <p className="mt-1 text-[13px] text-[var(--site-muted)]">
            共 {periods.length} {activeView.unit}，同一周期内的多次更新已经合并。
          </p>
        </div>
        <div
          role="tablist"
          aria-label="更新记录时间维度"
          className="inline-flex w-fit rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] p-1"
        >
          {CHANGELOG_PERIOD_VIEWS.map((option) => {
            const selected = option.id === view
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setView(option.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  selected
                    ? 'bg-[var(--site-ink)] text-[var(--site-panel)] shadow-sm'
                    : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {periods.map((period) => (
          <li
            key={period.key}
            className="grid gap-4 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 md:grid-cols-[168px_1fr] md:p-5"
          >
            <div>
              <h2 className="font-serif text-[17px] font-semibold text-[var(--site-ink)]">
                {period.label}
              </h2>
              <p className="mt-1 text-[12px] text-[var(--site-muted)]">{period.range}</p>
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--site-faint)]">
                {period.commits > 0 ? `${period.commits} commits` : '提交待归纳'}
              </p>
              {period.entries.length > 1 ? (
                <p className="mt-1 text-[11px] text-[var(--site-faint)]">{period.entries.length} 次更新</p>
              ) : null}
            </div>

            <div className="divide-y divide-[var(--site-line)]">
              {period.entries.map((entry) => (
                <article key={entry.version} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-serif text-[18px] font-semibold text-[var(--site-ink)]">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-6 text-[var(--site-muted)]">{entry.summary}</p>
                  <ChangelogSections entry={entry} />
                </article>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
