'use client'

import { useCallback, useEffect, useState } from 'react'

const EMPTY_FORM = {
  siteName: '',
  rssUrl: '',
  siteUrl: '',
  category: '',
  description: '',
  sortOrder: '',
}

export default function RssFeedConsole() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (data?.status === 'ok') {
        setItems(Array.isArray(data.feeds) ? data.feeds : [])
        setStatus('ok')
      } else if (data?.status === 'unavailable') {
        setStatus('unavailable')
        setMessage(data.message || '存储未就绪')
      } else {
        setStatus('error')
        setMessage(data?.message || data?.error || '读取失败')
      }
    } catch (err) {
      setStatus('error')
      setMessage(String(err?.message || err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.siteName.trim() || !form.rssUrl.trim()) {
      setMessage('「站点名称」和「RSS 链接」必填')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          siteName: form.siteName,
          rssUrl: form.rssUrl,
          siteUrl: form.siteUrl,
          category: form.category,
          description: form.description,
          sortOrder: form.sortOrder === '' ? 0 : Number(form.sortOrder),
        }),
      })
      const data = await res.json()
      if (res.ok && data?.ok) {
        setForm(EMPTY_FORM)
        setMessage('已添加')
        load()
      } else {
        setMessage(data?.error || '添加失败')
      }
    } catch (err) {
      setMessage(String(err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(item) {
    try {
      const res = await fetch('/api/admin/rss-feeds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: item.id, published: item.published ? 0 : 1 }),
      })
      if (res.ok) load()
      else setMessage('更新失败')
    } catch (err) {
      setMessage(String(err?.message || err))
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`确认删除「${item.siteName}」？`)) return
    try {
      const res = await fetch(`/api/admin/rss-feeds?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) load()
      else setMessage('删除失败')
    } catch (err) {
      setMessage(String(err?.message || err))
    }
  }

  const inputClass =
    'w-full rounded-md border border-[#dcdfe5] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#9aa0aa] dark:border-[#2a3440] dark:bg-[#0f151d] dark:text-gray-100'

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-[#15140f] dark:text-gray-100">RSS 订阅管理台</h1>
        <p className="mt-1 text-sm text-[#67695d] dark:text-gray-400">
          这里增删的订阅会展示在公开页{' '}
          <a href="/resources/rss" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            /resources/rss
          </a>
          。需先在 Cloudflare 跑迁移 0031 并绑定 D1。
        </p>
      </header>

      {status === 'unavailable' ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          {message || 'D1 未绑定，管理台只读不可用。本地预览无 D1 属正常。'}
        </div>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-[#e2e3da] bg-white p-4 dark:border-[#1e2733] dark:bg-[#10161f] sm:grid-cols-2"
      >
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">站点名称 *</span>
          <input
            className={inputClass}
            value={form.siteName}
            onChange={(e) => setField('siteName', e.target.value)}
            placeholder="阮一峰的网络日志"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">RSS 链接 *</span>
          <input
            className={inputClass}
            value={form.rssUrl}
            onChange={(e) => setField('rssUrl', e.target.value)}
            placeholder="https://www.ruanyifeng.com/blog/atom.xml"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">主页链接</span>
          <input
            className={inputClass}
            value={form.siteUrl}
            onChange={(e) => setField('siteUrl', e.target.value)}
            placeholder="https://www.ruanyifeng.com/blog/"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">分类标签</span>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            placeholder="技术 / 周刊"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">简介</span>
          <textarea
            className={`${inputClass} min-h-[64px]`}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="一句话介绍这个订阅源"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[#67695d] dark:text-gray-400">排序权重（大的靠前）</span>
          <input
            className={inputClass}
            type="number"
            value={form.sortOrder}
            onChange={(e) => setField('sortOrder', e.target.value)}
            placeholder="0"
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full border border-[#caa86a] bg-[#7a5b1e] px-5 py-2 text-sm font-medium text-white hover:bg-[#6a4f19] disabled:opacity-50"
          >
            {saving ? '添加中…' : '添加订阅'}
          </button>
          {message ? (
            <span className="text-xs text-[#82847a] dark:text-gray-500">{message}</span>
          ) : null}
        </div>
      </form>

      <div className="rounded-xl border border-[#e2e3da] bg-white dark:border-[#1e2733] dark:bg-[#10161f]">
        {status === 'loading' ? (
          <p className="p-4 text-sm text-[#82847a] dark:text-gray-500">加载中…</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-[#82847a] dark:text-gray-500">
            {status === 'ok' ? '还没有订阅，先在上面添加一条。' : message || '暂不可用'}
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f2ec] dark:divide-[#161e29]">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-[#15140f] dark:text-gray-100">
                    {item.siteName}
                    {item.category ? (
                      <span className="rounded-full border border-[#e2e3da] px-1.5 py-0.5 text-[10px] text-[#82847a] dark:border-[#2a3440] dark:text-gray-500">
                        {item.category}
                      </span>
                    ) : null}
                    {!item.published ? (
                      <span className="rounded-full bg-[#f3f4ee] px-1.5 py-0.5 text-[10px] text-[#9a9c90] dark:bg-[#1a212b] dark:text-gray-500">
                        已下架
                      </span>
                    ) : null}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-5 text-[#67695d] dark:text-gray-400">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-1 break-all font-mono text-[11px] text-[#aaa] dark:text-gray-500">
                    {item.rssUrl}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-[#b6b8ab] dark:text-gray-600">#{item.sortOrder}</span>
                  <button
                    type="button"
                    onClick={() => togglePublished(item)}
                    className="rounded-md border border-[#dcdfe5] px-2.5 py-1 text-xs text-[#555] hover:border-[#b9bbad] dark:border-[#2a3440] dark:text-gray-300"
                  >
                    {item.published ? '下架' : '上架'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-md border border-[#e6c9c9] px-2.5 py-1 text-xs text-[#a85a5a] hover:border-[#d99] dark:border-[#3a2626] dark:text-[#d08a8a]"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
