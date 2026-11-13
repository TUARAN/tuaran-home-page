'use client'

import { useMemo, useState } from 'react'

import {
  X_EXTENSION_TASK_GROUPS,
  X_EXTENSION_TASK_SHELF,
  deriveTaskBundle,
} from '../../../../../lib/community/xExtensionTaskShelf'

export default function TaskShelf() {
  const [selected, setSelected] = useState(() => X_EXTENSION_TASK_SHELF.filter((task) => task.queueDefault).map((task) => task.id))
  const [notice, setNotice] = useState('')
  const grouped = useMemo(() => X_EXTENSION_TASK_GROUPS.map((group) => ({
    ...group,
    tasks: X_EXTENSION_TASK_SHELF.filter((task) => task.group === group.id),
  })), [])

  function toggle(id) {
    const task = X_EXTENSION_TASK_SHELF.find((item) => item.id === id)
    if (!task || task.shelf !== 'listed') return
    setNotice('')
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function downloadBundle() {
    const derived = deriveTaskBundle(selected)
    if (!derived.ok) {
      setNotice('先选至少一项在架任务。下架的任务不能进派生清单。')
      return
    }
    const blob = new Blob([JSON.stringify(derived.bundle, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'x-extension-task-bundle.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice(`已下载 ${derived.bundle.tasks.length} 项任务的派生清单。`)
  }

  return (
    <div className="space-y-4" data-xrc-task-shelf>
      {grouped.map((group) => (
        <section key={group.id} className="rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
          <h3 className="m-0 text-[14px] font-semibold text-[var(--site-ink)]">{group.label}</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {group.tasks.map((task) => {
              const listed = task.shelf === 'listed'
              const checked = selected.includes(task.id)
              return (
                <li key={task.id}>
                  <label className={`flex h-full cursor-pointer gap-3 rounded-xl border p-3 ${listed ? 'border-[var(--site-line)] bg-[var(--site-panel-strong)]' : 'cursor-not-allowed border-dashed border-[var(--site-line)] opacity-70'}`}>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={listed && checked}
                      disabled={!listed}
                      onChange={() => toggle(task.id)}
                    />
                    <span className="grid gap-1">
                      <span className="font-semibold text-[var(--site-ink)]">
                        {task.label}
                        <small className="ml-2 font-medium text-[var(--site-faint)]">{listed ? '在架' : '已下架'}</small>
                      </span>
                      <span className="text-[12px] leading-5 text-[var(--site-muted)]">{task.summary}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-full bg-[var(--site-ink)] px-4 py-2 text-[13px] font-semibold text-[var(--site-bg)]" onClick={downloadBundle}>
          下载派生清单
        </button>
        <span className="text-[12px] leading-5 text-[var(--site-muted)]">已选 {selected.length} 项。清单带上这些任务的脚本，以及共用的队列、页面和回执。</span>
      </div>
      {notice ? <p className="m-0 text-[13px] text-[var(--site-ink)]">{notice}</p> : null}
    </div>
  )
}
