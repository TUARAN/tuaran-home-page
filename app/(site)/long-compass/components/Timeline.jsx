'use client'

import RecordCard from './RecordCard'

function getRecordYear(record) {
  const ts = record.plain?.updatedAt || record.updatedAt
  if (!ts) return null
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? null : d.getFullYear()
}

export default function Timeline({ records, expandedRecordId, onToggleRecord }) {
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
    <div className="relative pl-16 sm:pl-20">
      <div className="space-y-8">
        {groups.map((group, gi) => (
          <div key={`${group.year ?? 'unknown'}-${gi}`} className="relative">
            {/* 年份标签放在卡片左侧，作为各阶段的辨识点。 */}
            <span
              className="absolute -top-1 left-5 z-10 -translate-x-1/2 rounded-full bg-[#2f3027] px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow-sm ring-4 ring-[#f4f5f1] dark:bg-gray-200 dark:text-[#111] dark:ring-[#121821] sm:left-7"
            >
              {group.year ?? '?'}
            </span>
            <div className="space-y-3 pt-2">
              {group.items.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  dense
                  expanded={expandedRecordId === record.id}
                  onToggle={onToggleRecord}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
