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
    <div className="space-y-8">
      {groups.map((group, gi) => (
        <section key={`${group.year ?? 'unknown'}-${gi}`}>
          {/* 年份与卡片共用左边界，避免时间轴留白让内容向右偏。 */}
          <span className="mb-2 inline-flex rounded-full bg-[#2f3027] px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow-sm dark:bg-gray-200 dark:text-[#111]">
            {group.year ?? '?'}
          </span>
          <div className="space-y-3">
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
        </section>
      ))}
    </div>
  )
}
