'use client'

import { useEffect, useState } from 'react'

const MS_PER_DAY = 86_400_000

function dateOnly(iso) {
  return new Date(`${iso}T00:00:00`)
}

function addYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function diffDays(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY)
}

function computeProgress(sinceISO, years) {
  const start = dateOnly(sinceISO)
  const target = addYears(start, years)
  const now = new Date()
  const days = Math.max(diffDays(start, now) + 1, 1)
  const total = diffDays(start, target)
  const pct = Math.min(Math.max((days / total) * 100, 0), 100)
  return { days, total, pct }
}

export default function DaysSince({
  sinceISO = '2019-03-11',
  years = 20,
  href = 'https://juejin.cn/post/6844903794283642887',
  label = '坚持写作',
}) {
  const [state, setState] = useState(() => computeProgress(sinceISO, years))

  useEffect(() => {
    setState(computeProgress(sinceISO, years))
  }, [sinceISO, years])

  const { days, total, pct } = state
  const daysFmt = days.toLocaleString('en-US')
  const totalFmt = total.toLocaleString('en-US')

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={`${label} · 起点 ${sinceISO} · ${years} 年目标 · ${pct.toFixed(1)}%`}
      className="no-external-arrow group block w-full rounded-md px-1.5 py-1 !no-underline transition-colors hover:bg-[#e1e3d7] hover:!no-underline dark:hover:bg-[#1a222c]"
    >
      <div className="flex items-baseline justify-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-[#797b70] dark:text-[#8e9ab0]">
        <span className="font-semibold text-[#5a4725] dark:text-[#c6c9b4]">{daysFmt}</span>
        <span>天</span>
        <span className="text-[#aaac9f] dark:text-[#5a6a7e]">·</span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          since
        </span>
        <span>{sinceISO}</span>
        <span
          aria-hidden="true"
          className="ml-0.5 font-mono text-[10px] text-[#aaac9f] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#5a4725] dark:text-[#5a6a7e] dark:group-hover:text-[#c6c9b4]"
        >
          ↗
        </span>
      </div>
      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#d4d7c7] dark:bg-[#252d36]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c69755] to-[#8a6b2e] transition-all dark:from-[#9aa27a] dark:to-[#c6c9b4]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </a>
  )
}
