'use client'

import { useCallback, useEffect, useState } from 'react'

import { encryptPayload } from '../../../../lib/longCompass/crypto'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function formatDate(ts) {
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

function buildShareUrl(slug, password) {
  if (typeof window === 'undefined') return ''
  const base = `${window.location.origin}/share/${slug}`
  if (!password) return base
  return `${base}#${encodeURIComponent(password)}`
}

export default function ShareAdminClient() {
  const [items, setItems] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  // 创建表单
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdSlug, setCreatedSlug] = useState('')
  const [createdPassword, setCreatedPassword] = useState('')

  // 删除中状态
  const [pendingSlug, setPendingSlug] = useState('')

  const refresh = useCallback(async () => {
    setListError('')
    try {
      const res = await fetch('/api/admin/share', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setListError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreate(e) {
    e.preventDefault()
    if (!content.trim() || !password) {
      setCreateError('内容和密码都不能为空')
      return
    }
    if (password.length < 6) {
      setCreateError('密码至少 6 位')
      return
    }
    setSubmitting(true)
    setCreateError('')
    setCreatedSlug('')
    try {
      // 浏览器里加密 → 服务器只收密文
      const envelope = await encryptPayload({ content }, password)
      const days = expiresInDays === '' ? null : Math.max(1, Math.min(3650, parseInt(expiresInDays, 10) || 0))
      const res = await fetch('/api/admin/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          envelope,
          title: title.trim(),
          expiresInDays: days,
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setCreatedSlug(data.slug)
      setCreatedPassword(password)
      setContent('')
      setTitle('')
      setPassword('')
      setExpiresInDays('')
      await refresh()
    } catch (e) {
      setCreateError(e?.message || 'CREATE_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(slug) {
    if (!confirm(`确定删除分享 ${slug}？这是不可逆的。`)) return
    setPendingSlug(slug)
    try {
      const res = await fetch(`/api/admin/share?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      await refresh()
    } catch (e) {
      setListError(e?.message || 'DELETE_FAILED')
    } finally {
      setPendingSlug('')
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-8 md:py-12">
      <header className="mb-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9c8f79] dark:text-[#8e9ab0]">
          Admin · Encrypted Share
        </p>
        <h1 className="mb-2 font-serif text-[1.9rem] font-semibold text-[#221f19] dark:text-gray-100 md:text-[2.2rem]">
          加密分享管理
        </h1>
        <p className="mb-0 max-w-[44rem] text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">
          内容在你的浏览器里用密码 + PBKDF2 派生密钥后用 AES-GCM 加密，<strong>服务器只见到密文信封</strong>。
          访问者凭链接 + 密码即可解锁。把密码加在链接末尾 <code className="rounded bg-[#f4ede0] px-1 py-px font-mono text-[11px] dark:bg-[#19212b]">#密码</code> 可一键打开，
          也可以分两个通道单独发链接和密码。
        </p>
      </header>

      {/* 创建新分享 */}
      <section className="mb-8 rounded-xl border border-[#e5dccd] bg-[#fdfaf3] p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="mb-4 text-base font-semibold text-[#221f19] dark:text-gray-100">新建分享</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#3f392f] dark:text-gray-200">标题（明文，会显示在解锁前的标题位置）</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：2606 榴莲事件 · 夫妻共读复盘"
              className="w-full rounded-lg border border-[#ddd2c0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#3f392f] dark:text-gray-200">内容 markdown（加密）</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="粘贴 markdown 全文…"
              className="w-full rounded-lg border border-[#ddd2c0] bg-white px-3 py-2 font-mono text-xs leading-6 outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#3f392f] dark:text-gray-200">密码（≥6 位）</span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="自定义一个口令，分享给读者"
                className="w-full rounded-lg border border-[#ddd2c0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#3f392f] dark:text-gray-200">有效天数（留空 = 永久）</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="如 30"
                className="w-full rounded-lg border border-[#ddd2c0] bg-white px-3 py-2 text-sm outline-none focus:border-[#a37b3c] dark:border-[#344052] dark:bg-[#0d131b] dark:text-gray-100"
              />
            </label>
          </div>
          {createError ? (
            <p className="text-sm text-[#a34f47] dark:text-[#e6a29b]">{createError}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#8b5a1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#734817] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d7a85c] dark:text-[#1d160d] dark:hover:bg-[#e8bb70]"
          >
            {submitting ? '加密上传中…' : '生成加密链接'}
          </button>
        </form>

        {createdSlug ? (
          <div className="mt-4 rounded-lg border border-[#c7e0d2] bg-[#f1fbf4] p-4 text-sm dark:border-[#1f4533] dark:bg-[#10261c]">
            <p className="mb-2 font-medium text-[#2c5e3f] dark:text-[#9bd4a8]">
              已创建。下面两种链接二选一发给读者：
            </p>
            <div className="space-y-2">
              <Field
                label="基础链接（密码单独发）"
                value={buildShareUrl(createdSlug, '')}
                onCopy={copyText}
              />
              <Field
                label="带密码链接（一键打开）"
                value={buildShareUrl(createdSlug, createdPassword)}
                onCopy={copyText}
              />
              <Field label="密码" value={createdPassword} onCopy={copyText} mono />
            </div>
          </div>
        ) : null}
      </section>

      {/* 列表 */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">已创建的分享</h2>
          <span className="text-[11px] text-[#9c8f79] dark:text-[#8e9ab0]">{items.length} 条</span>
        </div>
        {listError ? (
          <p className="mb-3 text-sm text-[#a34f47] dark:text-[#e6a29b]">{listError}</p>
        ) : null}
        {loadingList ? (
          <p className="text-sm text-[#75695a] dark:text-[#9aa6b6]">加载中…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#75695a] dark:text-[#9aa6b6]">还没有任何分享。</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e5dccd] dark:border-[#252e39]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#f8f3e7] text-[12px] uppercase tracking-[0.12em] text-[#7a6c54] dark:bg-[#151c25] dark:text-[#8e9ab0]">
                <tr>
                  <th className="px-3 py-2">标题 / slug</th>
                  <th className="px-3 py-2">创建</th>
                  <th className="px-3 py-2">到期</th>
                  <th className="px-3 py-2">浏览</th>
                  <th className="px-3 py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.slug} className="border-t border-[#ece5d8] dark:border-[#252e39]">
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-[#221f19] dark:text-gray-100">{item.title || '(无标题)'}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#9c8f79] dark:text-[#8e9ab0]">
                        /share/{item.slug}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#75695a] dark:text-[#9aa6b6]">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#75695a] dark:text-[#9aa6b6]">
                      {item.expires_at ? formatDate(item.expires_at) : '永久'}
                    </td>
                    <td className="px-3 py-3 align-top text-[12px] text-[#75695a] dark:text-[#9aa6b6]">
                      {item.view_count || 0}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(buildShareUrl(item.slug, ''))}
                          className="rounded-lg border border-[#dcd3c0] px-2 py-1 text-xs text-[#75695a] hover:bg-[#f8f3e7] dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                        >
                          复制链接
                        </button>
                        <button
                          type="button"
                          disabled={pendingSlug === item.slug}
                          onClick={() => handleDelete(item.slug)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        >
                          {pendingSlug === item.slug ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

function Field({ label, value, onCopy, mono = false }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[#75695a] dark:text-[#9aa6b6] sm:w-36">
        {label}
      </span>
      <code
        className={`flex-1 break-all rounded bg-white px-2 py-1 ${mono ? 'font-mono' : ''} text-[12px] text-[#221f19] dark:bg-[#0d131b] dark:text-gray-100`}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="rounded border border-[#dcd3c0] px-2 py-1 text-[11px] text-[#75695a] hover:bg-[#f8f3e7] dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
      >
        复制
      </button>
    </div>
  )
}
