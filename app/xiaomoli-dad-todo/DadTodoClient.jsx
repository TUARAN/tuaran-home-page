'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  DAD_TODO_SECTIONS,
  DAD_TODO_STORAGE_KEY,
  DAD_TODO_TOTAL,
  isValidDadTodoItemId,
} from '../../lib/dadTodoData'
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

function loadCompleted() {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(DAD_TODO_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    const ids = Array.isArray(parsed?.completed) ? parsed.completed : []
    return new Set(ids.filter((x) => typeof x === 'string' && isValidDadTodoItemId(x)))
  } catch {
    return new Set()
  }
}

function saveCompletedLocal(set) {
  try {
    window.localStorage.setItem(DAD_TODO_STORAGE_KEY, JSON.stringify({ completed: [...set] }))
  } catch {
    /* ignore */
  }
}

function setToArray(set) {
  return [...set].filter((id) => isValidDadTodoItemId(id)).sort()
}

export default function DadTodoClient() {
  const [completed, setCompleted] = useState(() => new Set())
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [useRemote, setUseRemote] = useState(false)
  const [todoRemoteNote, setTodoRemoteNote] = useState('')

  const allowSaveRef = useRef(false)

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
          setCompleted(loadCompleted())
          setUseRemote(false)
          setTodoRemoteNote('')
          setReady(true)
          setTimeout(() => {
            allowSaveRef.current = true
          }, 0)
          return
        }

        const tRes = await fetch('/api/dad-todo', { cache: 'no-store' })
        const tData = await safeJson(tRes)
        if (cancelled) return

        if (tRes.status === 503) {
          setTodoRemoteNote(
            tData?.message || '待办无法同步到服务器（无数据库绑定）。勾选暂仅保存在本机。'
          )
          setCompleted(loadCompleted())
          setUseRemote(false)
          setReady(true)
          setTimeout(() => {
            allowSaveRef.current = true
          }, 0)
          return
        }

        if (tRes.status === 401 || !tRes.ok) {
          setCompleted(loadCompleted())
          setUseRemote(false)
          setTodoRemoteNote('')
          setReady(true)
          setTimeout(() => {
            allowSaveRef.current = true
          }, 0)
          return
        }

        setUseRemote(true)
        setTodoRemoteNote('')

        const fromServer = new Set(
          (Array.isArray(tData?.completed) ? tData.completed : []).filter(
            (x) => typeof x === 'string' && isValidDadTodoItemId(x)
          )
        )
        const local = loadCompleted()

        if (fromServer.size === 0 && local.size > 0) {
          const arr = setToArray(local)
          setCompleted(new Set(arr))
          saveCompletedLocal(new Set(arr))
          await fetch('/api/dad-todo', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: arr }),
            credentials: 'same-origin',
          })
        } else {
          setCompleted(fromServer)
          saveCompletedLocal(fromServer)
        }

        setReady(true)
        setTimeout(() => {
          allowSaveRef.current = true
        }, 0)
      } catch {
        if (!cancelled) {
          setCompleted(loadCompleted())
          setUseRemote(false)
          setReady(true)
          setTimeout(() => {
            allowSaveRef.current = true
          }, 0)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || !allowSaveRef.current) return
    if (!user) {
      saveCompletedLocal(completed)
      return
    }
    if (!useRemote) {
      saveCompletedLocal(completed)
      return
    }
    const arr = setToArray(completed)
    const t = setTimeout(() => {
      fetch('/api/dad-todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: arr }),
        credentials: 'same-origin',
      })
        .then((res) => {
          if (res.status === 503) {
            return res.json().then((d) => {
              setTodoRemoteNote(
                d?.message || '待办无法同步到服务器。已改存本机。'
              )
              setUseRemote(false)
            })
          }
        })
        .catch(() => {})
    }, 450)
    return () => clearTimeout(t)
  }, [completed, user, useRemote, ready])

  const toggle = useCallback((id) => {
    if (!isValidDadTodoItemId(id)) return
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearAll = useCallback(async () => {
    setCompleted(new Set())
    try {
      window.localStorage.removeItem(DAD_TODO_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    if (user && useRemote) {
      try {
        const res = await fetch('/api/dad-todo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: [] }),
          credentials: 'same-origin',
        })
        if (res.status === 503) {
          const d = await safeJson(res)
          setTodoRemoteNote(d?.message || '已清除本机；远程暂不可写。')
          setUseRemote(false)
        }
      } catch {
        /* ignore */
      }
    }
  }, [user, useRemote])

  const doneCount = completed.size

  const persistHint = user
    ? useRemote
      ? '已登录：勾选会同步到账号（数据库），并备份在本浏览器。'
      : '已登录，但当前环境无法连库：勾选先存在本机；上线后可再同步。'
    : '未登录：勾选仅在本机浏览器，换设备不会同步。登录后可写入数据库。'

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
            {user && useRemote
              ? '清除将同时清空本机备份与服务器上的待办勾选（当前账号）。'
              : '未登录或离线时，清除仅影响本机；登录且云端可用时，也会清空服务器记录。'}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-xl border border-[#c9bfb0] bg-white/90 px-4 py-3 text-sm font-medium text-[#5c4f42] transition-colors hover:bg-[#f5f1e8] dark:border-[#3d4a5c] dark:bg-[#121820] dark:text-gray-300 dark:hover:bg-[#1a222c]"
          >
            清除勾选记录
          </button>
        </footer>
      </div>
    </main>
  )
}
