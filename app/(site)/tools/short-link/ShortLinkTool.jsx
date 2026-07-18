'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconCopy, IconLink, IconRefresh, IconTrash } from '@tabler/icons-react'

import { useSessionAccount } from '../../components/SessionProvider'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 160) }
  }
}

function displayError(error) {
  if (error === 'EXTERNAL_URL_REQUIRES_OWNER' || error === 'NOT_OWNER') return '外部链接转短目前只对站长开放'
  if (error === 'INVALID_URL') return '请输入合法 URL'
  if (error === 'INVALID_URL_PROTOCOL') return '仅支持 http(s) URL'
  if (error === 'URL_HOST_NOT_ALLOWED') return '该地址不能转短'
  if (error === 'RATE_LIMITED') return '请求太频繁，请稍后再试'
  if (error === 'DB_UNAVAILABLE') return '短链数据库暂不可用'
  return error || '操作失败'
}

export default function ShortLinkTool() {
  const { user, isOwner, loading: userLoading } = useSessionAccount()
  const [input, setInput] = useState('')
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState('')

  const isAuthed = !!user
  const canManage = isAuthed && isOwner

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  }, [records])

  const refresh = useCallback(async () => {
    if (!canManage) {
      setRecords([])
      setStats(null)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/short', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setRecords(Array.isArray(data?.items) ? data.items : [])
      setStats(data?.stats || null)
    } catch (err) {
      setError(displayError(err?.message))
    } finally {
      setLoading(false)
    }
  }, [canManage])

  useEffect(() => {
    if (!userLoading) refresh()
  }, [refresh, userLoading])

  function login() {
    window.location.href = `/login?returnTo=${encodeURIComponent('/tools/short-link')}`
  }

  function logout() {
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent('/tools/short-link')}`
  }

  async function copyText(key, text) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setError('复制失败')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const url = input.trim()
    if (!url) return
    try {
      const parsed = new URL(url)
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('protocol')
    } catch {
      setError('请输入合法的 http(s) URL')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ url, mode: 'manual' }),
      })
      const data = await safeJson(res)
      if (!res.ok || !data?.item) throw new Error(data?.error || `HTTP_${res.status}`)
      setInput('')
      setNotice(data.reused ? '已复用现有短链' : '已生成短链')
      setRecords((list) => [data.item, ...list.filter((item) => item.id !== data.item.id)])
      await copyText(`short:${data.item.id}`, data.item.short)
      if (canManage) refresh()
    } catch (err) {
      setError(displayError(err?.message))
    } finally {
      setSubmitting(false)
    }
  }

  async function removeRecord(id) {
    if (!id || deletingId) return
    setDeletingId(id)
    setError('')
    try {
      const res = await fetch(`/api/short?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setRecords((list) => list.filter((item) => item.id !== id))
    } catch (err) {
      setError(displayError(err?.message))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1180px] px-4 pb-4 pt-9 sm:px-6 lg:px-8">
        <div className="grid gap-4 border-b border-[#d8d1c4] pb-5 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
              Site Tool
            </p>
            <h1 className="mb-3 font-serif text-[36px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[46px]">
              站内转短
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              把链接转换成 2aran.com 短链。站内分享会自动转短，外部链接手动转短由站长维护。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stats ? (
              <span className="inline-flex h-10 items-center rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100">
                {stats.total || records.length} 条短链
              </span>
            ) : null}
            {userLoading ? null : isAuthed ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-10 items-center rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
              >
                退出
              </button>
            ) : (
              <button
                type="button"
                onClick={login}
                className="inline-flex h-10 items-center rounded-md bg-[#25221b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-[#ded8ca] bg-white/[0.68] p-4 dark:border-[#252e38] dark:bg-[#101720]/[0.78]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="mb-0 text-[15px] font-bold">转短</h2>
              <span className="text-[12px] text-[#797469] dark:text-[#9da7b5]">2aran.com/xxxxxxx</span>
            </div>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#68645a] dark:text-[#aab4c2]">
                原始链接
              </span>
              <input
                type="url"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="https://example.com/very/long/url"
                className="h-11 w-full rounded-md border border-[#d8d1c4] bg-white px-3 text-[14px] text-[#25221b] outline-none focus:border-[#b89143] dark:border-[#2b3643] dark:bg-[#0b1118] dark:text-[#dbe4f0]"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#8a6422] px-4 text-[14px] font-bold text-white transition hover:bg-[#6f5019] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d4ae66] dark:text-[#14100a]"
            >
              <IconLink size={18} />
              {submitting ? '转换中…' : '生成短链'}
            </button>
          </form>

          {!userLoading && !isAuthed ? (
            <p className="rounded-md border border-[#ded8ca] bg-white/[0.68] px-3 py-2 text-[12px] text-[#68645a] dark:border-[#252e38] dark:bg-[#101720]/[0.78] dark:text-[#aab4c2]">
              登录后可使用站长权限维护外部链接短链。
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}
        </aside>

        <div className="min-h-[560px] rounded-lg border border-[#ded8ca] bg-white/[0.68] dark:border-[#252e38] dark:bg-[#101720]/[0.78]">
          <div className="flex h-12 items-center justify-between border-b border-[#e7dfd1] px-4 dark:border-[#252e38]">
            <h2 className="mb-0 text-[15px] font-bold">短链记录</h2>
            {canManage ? (
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d8d1c4] bg-white/70 px-2.5 text-[12px] font-semibold text-[#28241d] transition hover:bg-white disabled:opacity-60 dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
              >
                <IconRefresh size={15} />
                刷新
              </button>
            ) : null}
          </div>

          {!canManage && !userLoading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <IconLink size={42} className="mb-3 text-[#8a6422] dark:text-[#d4ae66]" />
              <p className="mb-1 text-[15px] font-semibold text-[#28241d] dark:text-gray-100">
                外部链接转短由站长维护
              </p>
              <p className="mb-0 max-w-md text-[13px] leading-6 text-[#68645a] dark:text-[#aab4c2]">
                站内页面的分享按钮会自动生成短链；手动管理记录需要站长权限。
              </p>
            </div>
          ) : loading ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#7a766b] dark:text-[#9da7b5]">
              正在加载…
            </p>
          ) : sortedRecords.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#7a766b] dark:text-[#9da7b5]">
              还没有短链记录。
            </p>
          ) : (
            <div className="divide-y divide-[#e7dfd1] dark:divide-[#252e38]">
              {sortedRecords.map((record) => (
                <article key={record.id} className="p-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <a
                      href={record.short}
                      target="_blank"
                      rel="noreferrer"
                      className="no-external-arrow break-all font-mono text-[13px] font-semibold text-[#8a6422] underline underline-offset-4 hover:text-[#3a2c14] dark:text-[#d4ae66] dark:hover:text-[#f2d8a5]"
                    >
                      {record.short}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyText(`short:${record.id}`, record.short)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d8d1c4] bg-white/70 px-2.5 text-[12px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
                    >
                      <IconCopy size={15} />
                      {copied === `short:${record.id}` ? '已复制' : '复制'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecord(record.id)}
                      disabled={deletingId === record.id}
                      className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-[12px] font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-300 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/30"
                    >
                      <IconTrash size={15} />
                      {deletingId === record.id ? '删除中' : '删除'}
                    </button>
                  </div>
                  <p className="mb-0 mt-2 break-all text-[12px] leading-5 text-[#7a766b] dark:text-[#9da7b5]">
                    {record.original}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
