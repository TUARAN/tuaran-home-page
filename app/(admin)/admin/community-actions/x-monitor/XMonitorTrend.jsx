'use client'

import { useState } from 'react'
import { EmptyState } from '../../../components/ui'

const RESULTS = [
  { key: 'success', label: '成功', color: 'bg-emerald-500' },
  { key: 'failed', label: '失败', color: 'bg-rose-500' },
  { key: 'limited', label: '受限', color: 'bg-amber-500' },
  { key: 'skipped', label: '跳过', color: 'bg-slate-400' },
]

export default function XMonitorTrend({ days = [], tasks = [], selectedDate, onDateChange }) {
  const [selectedTask, setSelectedTask] = useState('all')
  const task = selectedTask === 'all' || tasks.some((item) => item.task === selectedTask) ? selectedTask : 'all'
  const rows = days.map((day) => ({
    date: day.date,
    counts: task === 'all' ? day : day.tasks?.[task] || {},
  }))
  const total = rows.reduce((sum, row) => sum + RESULTS.reduce((count, result) => count + (Number(row.counts[result.key]) || 0), 0), 0)
  const max = Math.max(1, ...rows.map((row) => RESULTS.reduce((sum, result) => sum + (Number(row.counts[result.key]) || 0), 0)))

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="m-0 text-[12px] tabular-nums text-[#697268] dark:text-gray-400">{days.length ? `${days[0].date} 至 ${days.at(-1).date}` : '最近 14 天'}</p>
      <span className="text-[12px] tabular-nums text-[#697268] dark:text-gray-400">期间共 {total} 条</span>
    </div>
    <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="选择任务走势">
      {[{ task: 'all', label: '全部任务' }, ...tasks].map((item) => <button key={item.task} type="button" onClick={() => setSelectedTask(item.task)} aria-pressed={task === item.task} className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition ${task === item.task ? 'border-[#37624b] bg-[#37624b] text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-[#101820]' : 'border-[#d7dfd5] text-[#4e5b50] hover:border-[#77977e] dark:border-[#354438] dark:text-gray-300'}`}>{item.label}</button>)}
    </div>
    {total ? <>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#697268] dark:text-gray-400">{RESULTS.map((result) => <span key={result.key} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${result.color}`} />{result.label}</span>)}</div>
      <div className="mt-3 overflow-x-auto pb-1">
        <div className="flex h-[198px] min-w-[560px] items-end gap-2 border-b border-[#dfe5dc] dark:border-[#354438]">
          {rows.map((row) => {
            const count = RESULTS.reduce((sum, result) => sum + (Number(row.counts[result.key]) || 0), 0)
            const detail = RESULTS.map((result) => `${result.label} ${Number(row.counts[result.key]) || 0}`).join('，')
            const selected = row.date === selectedDate
            return <button key={row.date} type="button" onClick={() => onDateChange(row.date)} title={`${row.date}：${detail}`} aria-label={`${row.date}，${detail}，查看当天明细${selected ? '，当前已选中' : ''}`} aria-current={selected ? 'date' : undefined} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 text-center">
              <span className="h-4 text-[10px] tabular-nums text-[#697268] dark:text-gray-400">{count || ''}</span>
              <span className={`flex h-[152px] w-full max-w-9 flex-col-reverse overflow-hidden rounded-t-sm bg-[#f1f3ef] transition group-hover:ring-2 group-hover:ring-[#77977e] dark:bg-[#1b2530] ${selected ? 'ring-2 ring-[#37624b] dark:ring-emerald-300' : ''}`} aria-hidden="true">{RESULTS.map((result) => {
                const value = Number(row.counts[result.key]) || 0
                return value ? <span key={result.key} className={`${result.color} w-full shrink-0`} style={{ height: `${value / max * 152}px` }} /> : null
              })}</span>
              <span className={`h-4 whitespace-nowrap font-mono text-[10px] ${selected ? 'font-semibold text-[#37624b] dark:text-emerald-300' : 'text-[#7a8479] dark:text-gray-400'}`}>{row.date.slice(5)}</span>
            </button>
          })}
        </div>
      </div>
    </> : <div className="mt-4"><EmptyState title="这段时间没有确认动作" description="切换任务或日期查看其他走势。" /></div>}
  </div>
}
