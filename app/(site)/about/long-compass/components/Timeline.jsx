'use client'

import RecordCard from './RecordCard'

function getRecordYear(record) {
  const ts = record.plain?.updatedAt || record.updatedAt
  if (!ts) return null
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? null : d.getFullYear()
}

export default function Timeline({ records }) {
  // 按年份升序（旧 → 新）
  const sorted = [...records].sort((a, b) => {
    const ya = getRecordYear(a) || 0
    const yb = getRecordYear(b) || 0
    if (ya !== yb) return ya - yb
    return (a.plain?.updatedAt || 0) - (b.plain?.updatedAt || 0)
  })

  // 按年分组
  const groups = []
  let currentYear = null
  for (const r of sorted) {
    const y = getRecordYear(r)
    if (y !== currentYear) {
      groups.push({ year: y, items: [r] })
      currentYear = y
    } else {
      groups[groups.length - 1].items.push(r)
    }
  }

  return (
    <div className="relative pl-12 sm:pl-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-3 bottom-2 top-2 w-px bg-gradient-to-b from-[#d8cdbb] via-[#c5b89c] to-[#d8cdbb] dark:from-[#2d3440] dark:via-[#475061] dark:to-[#2d3440] sm:left-5"
      />
      <div className="space-y-8">
        {groups.map((group, gi) => (
          <div key={`${group.year ?? 'unknown'}-${gi}`} className="relative">
            <div className="absolute -left-12 top-1 flex w-10 flex-col items-center sm:-left-16 sm:w-12">
              <span className="rounded-full bg-[#3f3527] px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow-sm dark:bg-gray-200 dark:text-[#111]">
                {group.year ?? '?'}
              </span>
            </div>
            <span
              aria-hidden="true"
              className="absolute -left-[26px] top-[10px] h-2 w-2 rounded-full bg-[#8b5a1f] ring-2 ring-[#faf7f1] dark:bg-[#e0b572] dark:ring-[#121821] sm:-left-[34px]"
            />
            <div className="space-y-3">
              {group.items.map((record) => (
                <RecordCard key={record.id} record={record} dense />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
