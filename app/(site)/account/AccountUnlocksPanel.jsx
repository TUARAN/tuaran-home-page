'use client'

import Link from 'next/link'

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

export default function AccountUnlocksPanel({ loaded, data }) {
  if (!loaded) {
    return (
      <section className="mb-10 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">我已解锁</h2>
        <p className="mt-2 text-[13px] text-[var(--site-muted)]">正在读取解锁记录…</p>
      </section>
    )
  }

  if (!data?.authed || data.dbUnavailable) {
    return (
      <section className="mb-10 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">我已解锁</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--site-muted)]">
          暂时无法读取解锁和领取记录，请稍后刷新重试。
        </p>
      </section>
    )
  }

  const unlocks = Array.isArray(data.unlocks) ? data.unlocks : []
  const resourceEvents = Array.isArray(data.resourceEvents) ? data.resourceEvents : []
  return (
    <section className="mb-10 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">我已解锁</h2>
        <span className="rounded-full bg-[#fbf3df] px-2.5 py-1 text-xs font-medium text-[#7a5b1e] dark:bg-amber-950/30 dark:text-amber-200">
          {unlocks.length} 项
        </span>
      </div>
      {unlocks.length ? (
        <ul
          aria-label="已解锁内容列表"
          className="mt-4 max-h-[30rem] divide-y divide-[var(--site-line)] overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]"
        >
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
      <div className="mt-5 border-t border-[var(--site-line)] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-[var(--site-ink)]">我的领取记录</h3>
          <span className="text-xs text-[var(--site-muted)]">{resourceEvents.length} 次</span>
        </div>
        {resourceEvents.length ? (
          <ul className="mt-2 divide-y divide-[var(--site-line)]">
            {resourceEvents.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--site-ink)]">
                      {item.href ? <Link href={item.href} className="no-underline hover:underline">{item.title}</Link> : item.title}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-[var(--site-muted)]">{item.userDescription}</p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] leading-5 text-[var(--site-muted)]">
                    <p>{item.eventLabel}</p>
                    <p>{formatTime(item.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] leading-6 text-[var(--site-muted)]">壁纸、工具包和外部作品的领取/打开记录会显示在这里。</p>
        )}
      </div>
    </section>
  )
}
