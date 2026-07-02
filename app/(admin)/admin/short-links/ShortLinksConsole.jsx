'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminPage } from '../../components/ui'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ShortLinksConsole() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  const fetchData = useCallback(async (q = search) => {
    setError('')
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
      const res = await fetch(`/api/admin/short-links${params}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems(Array.isArray(data?.items) ? data.items : [])
      setStats(data?.stats || null)
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchData('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => items, [items])

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    await fetchData(search)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!url.trim()) return
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/admin/short-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ url: url.trim(), title: title.trim() }),
      })
      const data = await safeJson(res)
      if (!res.ok || !data?.item) throw new Error(data?.error || `HTTP_${res.status}`)
      setNotice(data.reused ? '已存在同 URL 短链，已复用。' : '短链已创建。')
      setUrl('')
      setTitle('')
      await fetchData(search)
    } catch (e) {
      setError(e?.message || 'CREATE_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除这条短链？删除后该短链会 404。')) return
    setPendingId(id)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/admin/short-links?id=${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setNotice('短链已删除。')
    } catch (e) {
      setError(e?.message || 'DELETE_FAILED')
    } finally {
      setPendingId(null)
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
      setNotice('已复制。')
    } catch {
      setError('复制失败，请手动复制。')
    }
  }

  return (
    <AdminPage
      title="短链管理"
      maxWidth="1180px"
      description="全站短链映射表。同一个原始 URL 只复用一条短链；公开分享只允许站内链接自动转短，站长可在这里手动登记外部链接。"
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
          {notice}
        </div>
      ) : null}

      <section className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="短链数" value={formatNumber(stats?.total)} />
        <Stat label="总点击" value={formatNumber(stats?.clicks)} />
        <Stat label="最近创建" value={formatTime(stats?.latestCreatedAt)} compact />
        <Stat label="最近访问" value={formatTime(stats?.latestClickedAt)} compact />
      </section>

      <form onSubmit={handleCreate} className="mb-5 rounded-xl border border-[#d5d7cd] bg-white/70 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="mb-3 text-sm font-semibold text-[#15140f] dark:text-gray-100">手动登记</h2>
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题，可选"
            className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={submitting || !url.trim()}
            className="rounded-lg bg-[#15140f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#323029] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f] dark:hover:bg-white"
          >
            {submitting ? '登记中…' : '生成短链'}
          </button>
        </div>
      </form>

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索短链 / 原链接 / code / 标题 / 来源…"
          className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100 sm:w-96"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm font-medium text-[#53554d] hover:bg-[#edefe7] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:bg-[#151c25]"
          >
            搜索
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setLoading(true)
              fetchData('')
            }}
            className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm font-medium text-[#53554d] hover:bg-[#edefe7] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:bg-[#151c25]"
          >
            重置
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-[#d5d7cd] dark:border-[#252e39]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#edefe7] text-[12px] uppercase tracking-[0.12em] text-[#616454] dark:bg-[#151c25] dark:text-[#8e9ab0]">
            <tr>
              <th className="px-3 py-2">短链</th>
              <th className="px-3 py-2">原链接</th>
              <th className="px-3 py-2">数据</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                  加载中…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-[#858779] dark:text-[#8e9ab0]">
                  没有短链记录
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t border-[#dfe0d8] dark:border-[#252e39]">
                  <td className="px-3 py-3 align-top">
                    <a href={item.short} target="_blank" rel="noreferrer" className="no-external-arrow font-mono text-sm font-semibold text-sky-700 hover:opacity-80 dark:text-sky-300">
                      {item.short}
                    </a>
                    <div className="mt-1 font-mono text-[11px] text-[#858779] dark:text-[#8e9ab0]">code: {item.code}</div>
                    <div className="mt-1">
                      <span className="rounded bg-[#e8ece4] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#485a3b] dark:bg-[#1a1f17] dark:text-[#93a984]">
                        {item.source || 'manual'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    {item.title ? <div className="mb-1 font-medium text-[#15140f] dark:text-gray-100">{item.title}</div> : null}
                    <a href={item.original} target="_blank" rel="noreferrer" className="break-all text-[12px] leading-5 text-[#63645a] hover:text-[#15140f] dark:text-[#9aa6b6] dark:hover:text-gray-100">
                      {item.original}
                    </a>
                  </td>
                  <td className="px-3 py-3 align-top text-[12px] text-[#63645a] dark:text-[#9aa6b6]">
                    <div>点击 {formatNumber(item.click_count)}</div>
                    <div>创建 {formatTime(item.created_at)}</div>
                    <div>最近访问 {formatTime(item.last_clicked_at)}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(item.short)}
                        className="rounded-lg border border-[#caccc0] px-2 py-1 text-xs text-[#63645a] hover:bg-[#edefe7] dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                      >
                        复制
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={pendingId === item.id}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        {pendingId === item.id ? '删除中…' : '删除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}

function Stat({ label, value, compact }) {
  return (
    <div className="rounded-xl border border-[#d5d7cd] bg-white/70 px-4 py-3 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">
        {label}
      </div>
      <div className={`${compact ? 'text-sm' : 'text-2xl'} mt-1 font-semibold text-[#15140f] dark:text-gray-100`}>
        {value || '—'}
      </div>
    </div>
  )
}
