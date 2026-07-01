'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function RanbiUnlocksPanel() {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('/api/points/me', { cache: 'no-store', credentials: 'same-origin' })
        const data = await safeJson(res)
        if (!alive) return
        setState({ status: res.ok ? 'ok' : 'error', data })
      } catch (error) {
        if (alive) setState({ status: 'error', data: { message: String(error?.message || error) } })
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <section className="mb-10 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">我已解锁</h2>
        <p className="mt-2 text-[13px] text-[var(--site-muted)]">正在读取解锁记录…</p>
      </section>
    )
  }

  const data = state.data || {}
  if (!data.authed) {
    return (
      <section className="mb-10 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">我已解锁</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--site-muted)]">
          登录后可以在这里查看自己已经解锁过的页面和资源；游客解锁记录会在绑定登录时迁移到正式账号。
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex rounded-full border border-[#caa86a] px-3 py-1.5 text-xs font-medium text-[#7a5b1e] no-underline hover:bg-[#fbf3df] dark:border-amber-800 dark:text-amber-200"
        >
          登录 / 注册
        </Link>
      </section>
    )
  }

  const unlocks = Array.isArray(data.unlocks) ? data.unlocks : []
  return (
    <section className="mb-10 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">我已解锁</h2>
        <span className="rounded-full bg-[#fbf3df] px-2.5 py-1 text-xs font-medium text-[#7a5b1e] dark:bg-amber-950/30 dark:text-amber-200">
          {unlocks.length} 项
        </span>
      </div>
      {unlocks.length ? (
        <ul className="mt-4 divide-y divide-[var(--site-line)]">
          {unlocks.map((item) => (
            <li key={`${item.resourceKey}:${item.unlockedAt}`} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--site-ink)]">
                    {item.href ? (
                      <Link href={item.href} className="no-underline hover:underline">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--site-muted)]">{item.resourceKey}</p>
                </div>
                <div className="shrink-0 text-right text-[11px] leading-5 text-[var(--site-muted)]">
                  <p>{item.typeLabel}</p>
                  <p>{formatTime(item.unlockedAt)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] leading-6 text-[var(--site-muted)]">
          这个账号还没有解锁记录。打开带燃币权益的调研或资源后，会自动出现在这里。
        </p>
      )}
    </section>
  )
}
