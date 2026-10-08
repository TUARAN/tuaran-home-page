'use client'

import { useEffect, useRef, useState } from 'react'

function formatAmount(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function pagesAround(current, total) {
  const pages = new Set([1, total])
  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page >= 1 && page <= total) pages.add(page)
  }
  return [...pages].sort((left, right) => left - right)
}

function Pager({ page, totalPages, loading, onPage }) {
  const pages = pagesAround(page, totalPages)
  const idle = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--site-line)] px-2.5 text-[13px] text-[var(--site-ink)] hover:bg-[var(--site-panel)] disabled:cursor-not-allowed disabled:opacity-40'
  const current = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[#7a5b1e] bg-[#7a5b1e] px-2.5 text-[13px] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-[#3a2a0c]'

  return (
    <nav aria-label="转账记录分页" className="flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" className={idle} disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>
        上一页
      </button>
      {pages.map((value, index) => {
        const previous = pages[index - 1]
        return (
          <span key={value} className="contents">
            {previous && value - previous > 1 ? <span className="px-1 text-[12px] text-[var(--site-muted)]">…</span> : null}
            <button
              type="button"
              className={value === page ? current : idle}
              disabled={loading || value === page}
              aria-current={value === page ? 'page' : undefined}
              aria-label={`第 ${value} 页`}
              onClick={() => onPage(value)}
            >
              {value}
            </button>
          </span>
        )
      })}
      <button type="button" className={idle} disabled={loading || page >= totalPages} onClick={() => onPage(page + 1)}>
        下一页
      </button>
    </nav>
  )
}

export default function RanbiLedgerTransfers({ initial }) {
  const [view, setView] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const headingRef = useRef(null)
  const requestRef = useRef(null)
  const totalPagesRef = useRef(initial.totalPages)
  totalPagesRef.current = view.totalPages

  async function loadPage(page, { updateUrl = true, scroll = true } = {}) {
    const nextPage = Math.min(Math.max(Math.trunc(Number(page) || 1), 1), totalPagesRef.current || 1)
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/ranbi/ledger?page=${nextPage}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      const nextView = {
        transfers: payload.transfers || [],
        page: payload.page,
        pageSize: payload.pageSize,
        totalPages: payload.totalPages,
        total: payload.snapshot?.transferCount ?? 0,
      }
      setView(nextView)
      if (updateUrl) {
        const url = new URL(window.location.href)
        url.hash = ''
        url.searchParams.delete('before')
        if (nextView.page === 1) url.searchParams.delete('page')
        else url.searchParams.set('page', String(nextView.page))
        window.history.pushState({ ranbiLedgerPage: nextView.page }, '', `${url.pathname}${url.search}`)
      }
      if (scroll) headingRef.current?.scrollIntoView({ block: 'start' })
    } catch (loadError) {
      if (loadError.name !== 'AbortError') setError('这一页没有加载出来，请重试。')
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    function handlePopState() {
      const page = Number.parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10)
      loadPage(Number.isFinite(page) ? page : 1, { updateUrl: false, scroll: false })
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      requestRef.current?.abort()
    }
    // 页码变化由按钮和浏览器后退处理。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const first = view.total === 0 ? 0 : (view.page - 1) * view.pageSize + 1
  const last = view.total === 0 ? 0 : first + view.transfers.length - 1
  const showPager = view.totalPages > 1

  return (
    <section id="transfers" aria-busy={loading} className="mb-6">
      <div ref={headingRef} />
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-[20px] text-[var(--site-ink)]">转账记录</h2>
        <p className="text-[12px] text-[var(--site-muted)]">
          {view.total === 0 ? '共 0 笔' : `第 ${formatAmount(first)}–${formatAmount(last)} 笔，共 ${formatAmount(view.total)} 笔`}
        </p>
      </div>
      {showPager ? <div className="mb-3"><Pager page={view.page} totalPages={view.totalPages} loading={loading} onPage={loadPage} /></div> : null}
      <p className="mb-3 text-center text-[12px] text-[var(--site-muted)]">第 {view.page} / {view.totalPages} 页</p>
      <div className={loading ? 'opacity-55 transition-opacity' : 'transition-opacity'}>
        <div className="overflow-x-auto rounded-2xl border border-[var(--site-line)]">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="bg-[#b98928]/[0.08] text-[11px] uppercase tracking-[0.08em] text-[var(--site-muted)]">
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">转出</th>
                <th className="px-4 py-3">转入</th>
                <th className="px-4 py-3 text-right">数量</th>
                <th className="px-4 py-3">事由</th>
              </tr>
            </thead>
            <tbody>
              {view.transfers.length ? view.transfers.map((transfer) => (
                <tr key={transfer.id} className="border-t border-[var(--site-line)]">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[var(--site-muted)]">{formatTime(transfer.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="block text-[var(--site-ink)]">{transfer.from.label}</span>
                    <span className="font-mono text-[11px] text-[var(--site-muted)]">{transfer.from.ref}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-[var(--site-ink)]">{transfer.to.label}</span>
                    <span className="font-mono text-[11px] text-[var(--site-muted)]">{transfer.to.ref}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAmount(transfer.amount)}</td>
                  <td className="px-4 py-3 text-[var(--site-muted)]">
                    <span className="text-[var(--site-ink)]">{transfer.reasonLabel}</span>
                    {transfer.detail ? <span className="mt-0.5 block font-mono text-[11px]">{transfer.detail}</span> : null}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--site-muted)]">还没有可公开的转账。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-center text-[13px] text-red-700 dark:text-red-300">
          {error}{' '}
          <button type="button" className="underline" onClick={() => loadPage(view.page)}>重试</button>
        </p>
      ) : null}
      {showPager ? <div className="mt-4"><Pager page={view.page} totalPages={view.totalPages} loading={loading} onPage={loadPage} /></div> : null}
    </section>
  )
}
