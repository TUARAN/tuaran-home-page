'use client'

import { useCallback, useEffect, useState } from 'react'

import { DAD_TODO_SECTIONS, DAD_TODO_TOTAL, isValidDadTodoItemId } from '../../lib/dadTodoData'
import DadCheckinCalendar from './DadCheckinCalendar'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON' }
  }
}

const LEGACY_TODO_KEY = 'xiaomoli-dad-todo-v1'

export default function DadTodoClient() {
  const [completed, setCompleted] = useState(() => new Set())
  const [user, setUser] = useState(null)
  const [useRemote, setUseRemote] = useState(false)
  const [todoRemoteNote, setTodoRemoteNote] = useState('')
  const [pendingId, setPendingId] = useState(null)

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_TODO_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const meRes = await fetch('/api/me', { cache: 'no-store' })
        const me = await safeJson(meRes)
        if (cancelled) return
        const u = me?.user || null
        setUser(u)

        if (!u) {
          setCompleted(new Set())
          setUseRemote(false)
          setTodoRemoteNote('')
          return
        }

        const tRes = await fetch('/api/dad-todo', { cache: 'no-store' })
        const tData = await safeJson(tRes)
        if (cancelled) return

        if (tRes.status === 503) {
          setTodoRemoteNote(
            tData?.message || '待办需数据库。当前环境不可用，请稍后在已部署站点使用。'
          )
          setCompleted(new Set())
          setUseRemote(false)
          return
        }

        if (tRes.status === 401 || !tRes.ok) {
          setCompleted(new Set())
          setUseRemote(false)
          setTodoRemoteNote('')
          return
        }

        setUseRemote(true)
        setTodoRemoteNote('')

        const fromServer = new Set(
          (Array.isArray(tData?.completed) ? tData.completed : []).filter(
            (x) => typeof x === 'string' && isValidDadTodoItemId(x)
          )
        )
        setCompleted(fromServer)
      } catch {
        if (!cancelled) {
          setCompleted(new Set())
          setUseRemote(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback(
    async (id) => {
      if (!isValidDadTodoItemId(id) || !user || !useRemote || pendingId) return
      const wasDone = completed.has(id)
      setPendingId(id)

      setCompleted((prev) => {
        const next = new Set(prev)
        if (wasDone) next.delete(id)
        else next.add(id)
        return next
      })

      try {
        const res = wasDone
          ? await fetch(`/api/dad-todo?itemId=${encodeURIComponent(id)}`, {
              method: 'DELETE',
              credentials: 'same-origin',
            })
          : await fetch('/api/dad-todo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId: id }),
              credentials: 'same-origin',
            })

        if (res.status === 503) {
          const d = await safeJson(res)
          setTodoRemoteNote(d?.message || '数据库不可用，已恢复勾选状态。')
          setUseRemote(false)
          setCompleted((prev) => {
            const next = new Set(prev)
            if (wasDone) next.add(id)
            else next.delete(id)
            return next
          })
          return
        }

        if (!res.ok) {
          setCompleted((prev) => {
            const next = new Set(prev)
            if (wasDone) next.add(id)
            else next.delete(id)
            return next
          })
        }
      } catch {
        setCompleted((prev) => {
          const next = new Set(prev)
          if (wasDone) next.add(id)
          else next.delete(id)
          return next
        })
      } finally {
        setPendingId(null)
      }
    },
    [user, useRemote, completed, pendingId]
  )

  const doneCount = completed.size
  const canCheck = user && useRemote
  const persistHint = !user
    ? '请先通过上方「GitHub 登录」后勾选；每条会即时写入服务器。'
    : !useRemote
      ? '当前无法连接待办数据库，请稍后再试或检查是否已部署 D1。'
      : '每条勾选/取消会立即提交到当前账号，仅保存在服务器。'

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
          {todoRemoteNote ? (
            <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              {todoRemoteNote}
            </p>
          ) : null}
          <div className="rounded-xl border border-[#ddd3c4] bg-white/80 px-4 py-3 dark:border-[#2a3440] dark:bg-[#121820]/90">
            <p className="text-xs font-medium tracking-wide text-[#8a7f6f] dark:text-gray-500">今日进度</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[#2d261d] dark:text-gray-100">
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500">已勾选</span>{' '}
              {doneCount}
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500"> 条</span>
              <span className="mx-1.5 text-[#c4b8a8] dark:text-gray-600">/</span>
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500">共</span> {DAD_TODO_TOTAL}
              <span className="text-sm font-normal text-[#8a7f6f] dark:text-gray-500"> 条</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#8a7f6f] dark:text-gray-500">{persistHint}</p>
          </div>
        </header>

        <div className="mb-6">
          <DadCheckinCalendar />
        </div>

        <div className="flex flex-1 flex-col gap-6">
          {DAD_TODO_SECTIONS.map((section) => (
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
                  const isBusy = pendingId === item.id
                  return (
                    <li key={item.id}>
                      <label
                        className={`flex items-start gap-3 rounded-lg px-1 py-1 transition-colors ${
                          canCheck ? 'cursor-pointer hover:bg-[#f5f1e8]/80 dark:hover:bg-[#1a222c]' : 'cursor-not-allowed opacity-60'
                        } ${isDone ? 'opacity-60' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={!canCheck || isBusy}
                          onChange={() => toggle(item.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-[#c4b8a8] text-[#4a6fa5] focus:ring-[#4a6fa5] disabled:cursor-not-allowed dark:border-[#4a5568] dark:bg-[#1a222c]"
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
      </div>
    </main>
  )
}
