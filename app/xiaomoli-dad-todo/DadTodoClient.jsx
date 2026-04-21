'use client'

import { useCallback, useEffect, useState } from 'react'

import DadCheckinCalendar from './DadCheckinCalendar'

const STORAGE_KEY = 'xiaomoli-dad-todo-v1'

const SECTIONS = [
  {
    id: 'focus',
    title: '当前重点',
    dateNote: '2026-04-20',
    description: '用日常节奏把吃饭这件事前置，少临时起意。',
    items: [
      { id: 'focus:breakfast', label: '早餐备餐' },
      { id: 'focus:lunch', label: '午餐备餐' },
      { id: 'focus:usual-prep', label: '平常备菜' },
      { id: 'focus:parents-eat', label: '父母跟着宝宝吃' },
    ],
  },
  {
    id: 'habits',
    title: '习惯动线',
    dateNote: '自 2026-03-03 起，至少验证 1 个月',
    description: '增强动线，让琐碎生活少点折磨。',
    items: [
      { id: 'habit:shower-clothes', label: '洗完澡，衣服不妨卫生间，内裤顺手洗' },
      { id: 'habit:trash-bag', label: '垃圾袋拿去丢的时候，先套袋，不要专门等时间来套' },
      { id: 'habit:milk-water', label: '冲奶接水，冲完的时候就观察水还多不多' },
      { id: 'habit:rice-pot', label: '盛饭完成就接水泡锅，多的米倒掉，吃完就洗' },
      {
        id: 'habit:sort-wash',
        label: '衣服归类放；宝宝衣服每天换完及时洗，当天洗',
      },
    ],
  },
]

const TOTAL = SECTIONS.reduce((n, s) => n + s.items.length, 0)

function loadCompleted() {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    const ids = Array.isArray(parsed?.completed) ? parsed.completed : []
    return new Set(ids.filter((x) => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function saveCompleted(set) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: [...set] }))
  } catch {
    /* ignore quota / private mode */
  }
}

export default function DadTodoClient() {
  const [completed, setCompleted] = useState(() => new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setCompleted(loadCompleted())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveCompleted(completed)
  }, [completed, ready])

  const toggle = useCallback((id) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setCompleted(new Set())
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const doneCount = completed.size

  return (
    <main className="min-h-[100dvh] bg-[#f5f1e8] px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] dark:bg-[#0b1016]">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
        <header className="pt-6 pb-5">
          <h1 className="mb-2 text-[1.35rem] font-semibold leading-snug tracking-tight text-[#221f19] dark:text-gray-100">
            小茉莉的爸爸带娃清单
          </h1>
          <p className="mb-4 text-[0.95rem] leading-relaxed text-[#5c5348] dark:text-gray-400">
            好习惯，增强动线，让琐碎生活少点折磨。
          </p>
          <div className="rounded-xl border border-[#ddd3c4] bg-white/80 px-4 py-3 dark:border-[#2a3440] dark:bg-[#121820]/90">
            <p className="text-xs font-medium tracking-wide text-[#8a7f6f] dark:text-gray-500">今日进度</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[#2d261d] dark:text-gray-100">
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500">已勾选</span>{' '}
              {doneCount}
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500"> 条</span>
              <span className="mx-1.5 text-[#c4b8a8] dark:text-gray-600">/</span>
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500">共</span> {TOTAL}
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500"> 条</span>
            </p>
          </div>
        </header>

        <div className="mb-6">
          <DadCheckinCalendar />
        </div>

        <div className="flex flex-1 flex-col gap-6">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-[#e5ddd0] bg-white/90 p-4 shadow-sm dark:border-[#2a3440] dark:bg-[#121820]/95"
            >
              <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-base font-semibold text-[#2d261d] dark:text-gray-100">
                  {section.title}
                </h2>
                <span className="text-xs text-[#8a7f6f] dark:text-gray-500">（{section.dateNote}）</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[#5c5348] dark:text-gray-400">
                {section.description}
              </p>
              <ul className="space-y-3">
                {section.items.map((item) => {
                  const isDone = completed.has(item.id)
                  return (
                    <li key={item.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-[#f5f1e8]/80 dark:hover:bg-[#1a222c] ${
                          isDone ? 'opacity-60' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggle(item.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-[#c4b8a8] text-[#4a6fa5] focus:ring-[#4a6fa5] dark:border-[#4a5568] dark:bg-[#1a222c]"
                        />
                        <span
                          className={`text-[0.95rem] leading-relaxed text-[#333] dark:text-gray-200 ${
                            isDone ? 'line-through decoration-[#9a8f82]' : ''
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-10 border-t border-[#e5ddd0] pt-6 dark:border-[#2a3440]">
          <p className="mb-3 text-xs leading-relaxed text-[#8a7f6f] dark:text-gray-500">
            勾选仅保存在本机浏览器，不会同步到其他设备；换浏览器或清除站点数据后会丢失。
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-xl border border-[#c9bfb0] bg-white/90 px-4 py-3 text-sm font-medium text-[#5c4f42] transition-colors hover:bg-[#f5f1e8] dark:border-[#3d4a5c] dark:bg-[#121820] dark:text-gray-300 dark:hover:bg-[#1a222c]"
          >
            清除本地勾选记录
          </button>
        </footer>
      </div>
    </main>
  )
}
