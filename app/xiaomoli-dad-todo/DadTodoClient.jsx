'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'xiaomoli-dad-todo-v1'

const SECTIONS = [
  {
    id: 'focus',
    title: '当前重点',
    dateLabel: '2026-04-20',
    note: '用日常节奏把吃饭这件事前置，少临时起意。',
    items: [
      { id: 'f1', text: '早餐备餐' },
      { id: 'f2', text: '午餐备餐' },
      { id: 'f3', text: '平常备菜' },
      { id: 'f4', text: '父母跟着宝宝吃' },
    ],
  },
  {
    id: 'habits',
    title: '习惯动线',
    dateLabel: '自 2026-03-03 起 · 至少验证 1 个月',
    note: '增强动线，让琐碎生活少点折磨。',
    items: [
      { id: 'h1', text: '洗完澡，衣服不妨卫生间，内裤顺手洗' },
      { id: 'h2', text: '垃圾袋拿去丢的时候，先套袋，不要专门等时间来套' },
      { id: 'h3', text: '冲奶接水，冲完的时候就观察水还多不多' },
      { id: 'h4', text: '盛饭完成就接水泡锅，多的米倒掉，吃完就洗' },
      { id: 'h5', text: '衣服归类放；宝宝衣服每天换完及时洗，当天洗' },
    ],
  },
]

function loadChecked() {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x) => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function saveChecked(set) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore quota */
  }
}

export default function DadTodoClient() {
  const [checked, setChecked] = useState(() => new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setChecked(loadChecked())
    setReady(true)
  }, [])

  const toggle = useCallback((id) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveChecked(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setChecked(new Set())
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const allIds = SECTIONS.flatMap((s) => s.items.map((i) => i.id))
  const doneCount = allIds.filter((id) => checked.has(id)).length
  const total = allIds.length

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 pb-16 pt-6 sm:px-6 md:mx-auto md:max-w-lg">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#8a7f72] dark:text-[#9aa5b1]">
          家庭 · 待办
        </p>
        <h1 className="slogan-serif text-[1.65rem] font-semibold leading-snug text-[#221f19] dark:text-gray-100 sm:text-2xl">
          小茉莉的爸爸带娃清单
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5c534a] dark:text-gray-400">
          好习惯，增强动线，让琐碎生活少点折磨。
        </p>
        {ready ? (
          <p className="mt-4 text-xs text-[#8a7f72] dark:text-[#7d8a99]">
            今日进度 {doneCount} / {total}
          </p>
        ) : null}
      </header>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-[#e5ddd0] bg-white/80 p-5 shadow-sm dark:border-[#2a3440] dark:bg-[#121820]/90"
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#221f19] dark:text-gray-100">{section.title}</h2>
              <span className="text-xs text-[#8a7f72] dark:text-[#9aa5b1]">{section.dateLabel}</span>
            </div>
            <p className="mb-4 text-sm text-[#5c534a] dark:text-gray-400">{section.note}</p>
            <ul className="space-y-3">
              {section.items.map((item) => {
                const isDone = checked.has(item.id)
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-1 py-0.5 transition-colors hover:border-[#e5ddd0] hover:bg-[#faf8f4] dark:hover:border-[#2a3440] dark:hover:bg-[#1a222c]">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[#c4b8a8] text-[#2d6a4f] focus:ring-[#2d6a4f] dark:border-[#4a5568]"
                        checked={isDone}
                        onChange={() => toggle(item.id)}
                      />
                      <span
                        className={`text-[15px] leading-snug ${
                          isDone
                            ? 'text-[#8a7f72] line-through dark:text-[#6b7280]'
                            : 'text-[#333] dark:text-gray-200'
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-10 text-center">
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-[#8a7f72] underline decoration-[#c4b8a8] underline-offset-2 hover:text-[#5c534a] dark:text-[#9aa5b1] dark:hover:text-gray-300"
        >
          清除本地勾选记录
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-[#a39a8f] dark:text-[#6b7280]">
          勾选状态只保存在本机浏览器，换设备不会同步。
        </p>
      </footer>
    </div>
  )
}
