'use client'

import { useEffect, useState } from 'react'

import { useSessionAccount } from './SessionProvider'

const SEED_URL = 'http://112.124.37.151:48575/#/register?code=TYbpJVsl'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

export default function SiteToolsPanel() {
  const { user, loading: userLoading } = useSessionAccount()
  const [records, setRecords] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [error, setError] = useState('')

  const isAuthed = !!user

  useEffect(() => {
    if (!isAuthed) {
      setRecords([])
      return
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed])

  // 列表为空时把种子链接预填到输入框，方便一键添加。
  useEffect(() => {
    if (isAuthed && !listLoading && records.length === 0 && !input) {
      setInput(SEED_URL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, listLoading, records.length])

  async function refresh() {
    setListLoading(true)
    setError('')
    try {
      const res = await fetch('/api/short', { cache: 'no-store' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setRecords(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setListLoading(false)
    }
  }

  function login() {
    const returnTo = window.location.pathname || '/'
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
  }

  function logout() {
    const returnTo = window.location.pathname || '/'
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`
  }

  async function handleAdd(e) {
    e.preventDefault()
    const url = input.trim()
    if (!url) return
    try {
      const u = new URL(url)
      if (!/^https?:$/.test(u.protocol)) throw new Error('protocol')
    } catch {
      setError('请输入合法的 http(s) URL')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await safeJson(res)
      if (!res.ok || !data?.item) throw new Error(data?.error || `HTTP_${res.status}`)
      setRecords((prev) => [data.item, ...prev])
      setInput('')
    } catch (e) {
      setError(e?.message === 'UPSTREAM_FAILED' ? '上游服务未返回结果，请稍后重试' : '转短失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id) {
    setPendingId(id)
    setError('')
    try {
      const res = await fetch(`/api/short?id=${id}`, { method: 'DELETE' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(e?.message || '删除失败')
    } finally {
      setPendingId(null)
    }
  }

  async function handleCopy(text) {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  return (
    <section id="site-tools" className="scroll-mt-24 mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">站内工具</h2>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">个人常用小工具</span>
      </div>

      <article className="mt-4 border-l-2 border-sky-500 py-2 pl-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">转短</h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">长链接 → 2aran.com/xxxxxxx</span>
          <div className="ml-auto flex items-center gap-2">
            {userLoading ? (
              <span className="text-[11px] text-slate-400">…</span>
            ) : isAuthed ? (
              <>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.name || user?.login || '已登录'}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  退出
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={login}
                className="rounded bg-sky-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-sky-700"
              >
                GitHub 登录
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
          自建短链：随机生成 7 位 code，命中 D1 后 302 直跳原链接；会拦截本地 / 私网目标并限制创建频率。记录按账号写入 Cloudflare D1，需先登录。
        </p>

        {!userLoading && !isAuthed ? (
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            点右上角「GitHub 登录」后即可记录与查看历史。
          </p>
        ) : null}

        {isAuthed ? (
          <>
            <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://example.com/very/long/url"
                className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={submitting || !input.trim()}
                className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? '转换中…' : '转短'}
              </button>
            </form>

            {error ? <p className="mt-2 text-[11px] text-rose-500">{error}</p> : null}

            <div className="mt-3">
              {listLoading && records.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">加载中…</p>
              ) : records.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">还没有记录，先来转一条吧。</p>
              ) : (
                <ul className="space-y-2">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={r.short}
                          target="_blank"
                          rel="noreferrer"
                          className="no-external-arrow font-medium text-sky-600 hover:opacity-80 dark:text-sky-400"
                        >
                          {r.short}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(r.short)}
                          className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          复制
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(r.id)}
                          disabled={pendingId === r.id}
                          className="ml-auto text-[11px] text-slate-400 hover:text-rose-500 disabled:opacity-60"
                        >
                          {pendingId === r.id ? '删除中…' : '删除'}
                        </button>
                      </div>
                      <p className="mt-1 break-all text-[11px] text-slate-500 dark:text-slate-400">
                        {r.original}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </article>
    </section>
  )
}
