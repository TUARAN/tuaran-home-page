'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'article', label: '文章（专栏）' },
  { value: 'research', label: '调研' },
  { value: 'resource', label: '资源' },
]

const RESEARCH_CATEGORIES = ['companies', 'topics', 'people']

const EMPTY_FORM = {
  type: 'article',
  category: '',
  slug: '',
  title: '',
  summary: '',
  href: '',
  date: '',
  tags: '',
}

function deriveContentKey(form) {
  const slug = form.slug.trim()
  if (!slug) return ''
  if (form.type === 'research') {
    const category = RESEARCH_CATEGORIES.includes(form.category) ? form.category : ''
    return category ? `research:${category}:${slug}` : ''
  }
  return `${form.type}:${slug}`
}

export default function ContentIndexConsole() {
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('manual')
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/content-index', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data?.entries)) {
        setEntries(data.entries)
        setStatus('ok')
      } else {
        setStatus('error')
        setMessage(data?.message || data?.error || '读取失败（若迁移 0035 未跑属正常）')
      }
    } catch (err) {
      setStatus('error')
      setMessage(String(err?.message || err))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    if (sourceFilter === 'all') return entries
    return entries.filter((e) => e.source === sourceFilter)
  }, [entries, sourceFilter])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSync() {
    setSyncing(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/content-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'sync' }),
      })
      const data = await res.json()
      if (res.ok && data?.ok) {
        setMessage(`已同步 ${data.count} 条构建期条目进 D1`)
        load()
      } else {
        setMessage(data?.message || data?.error || '同步失败')
      }
    } catch (err) {
      setMessage(String(err?.message || err))
    } finally {
      setSyncing(false)
    }
  }

  async function upsert(entry, successText) {
    const res = await fetch('/api/admin/content-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'upsert', entry }),
    })
    const data = await res.json()
    if (res.ok && data?.ok) {
      if (successText) setMessage(successText)
      load()
      return true
    }
    setMessage(data?.message || data?.error || '保存失败')
    return false
  }

  async function handleAdd(e) {
    e.preventDefault()
    const contentKey = deriveContentKey(form)
    if (!contentKey || !form.title.trim() || !form.href.trim()) {
      setMessage('slug（调研还需分类）、标题、链接必填')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const ok = await upsert(
        {
          contentKey,
          type: form.type,
          category: form.type === 'research' ? form.category : form.type === 'article' ? 'posts' : form.type,
          slug: form.slug.trim(),
          title: form.title.trim(),
          summary: form.summary.trim(),
          href: form.href.trim(),
          date: form.date.trim(),
          tags: form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
          status: 'published',
        },
        '已登记，/articles 索引一分钟内生效'
      )
      if (ok) setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(entry) {
    const next = entry.status === 'published' ? 'retired' : 'published'
    await upsert({ ...entry, status: next }, `已${next === 'published' ? '上线' : '下线'}「${entry.title}」`)
  }

  async function handleDelete(entry) {
    if (!window.confirm(`确认删除「${entry.title}」？（sync 条目下次同步会回来）`)) return
    try {
      const res = await fetch(
        `/api/admin/content-index?contentKey=${encodeURIComponent(entry.contentKey)}`,
        { method: 'DELETE', credentials: 'same-origin' }
      )
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
        <h1 className="text-xl font-semibold text-[#15140f] dark:text-gray-100">内容索引管理台</h1>
        <p className="mt-1 text-sm text-[#67695d] dark:text-gray-400">
          统一内容索引（content_index）。「同步」把构建期注册表（文章 / 调研 / 资源）镜像进
          D1；「手工登记」的条目无需构建即出现在{' '}
          <a href="/articles" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            /articles
          </a>{' '}
          索引。需先在 Cloudflare 跑迁移 0035。
        </p>
      </header>

      {message ? (
        <div className="mb-4 rounded-lg border border-[#dbe4d6] bg-[#f3f8ef] px-4 py-2.5 text-sm text-[#3c5a2f] dark:border-[#2c3d2a] dark:bg-[#15200f] dark:text-[#a9cf92]">
          {message}
        </div>
      ) : null}

      <section className="mb-8 rounded-lg border border-[#dee0db] bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#333] dark:text-gray-200">构建期注册表 → D1</h2>
            <p className="mt-1 text-xs text-[#888] dark:text-gray-500">
              每次部署新内容后点一次，把最新构建期 metadata 镜像进 D1。不影响手工条目；但会把 sync
              条目重置回 published（下线 sync 条目请直接改构建期注册表）。
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-full border border-[#caccc0] bg-white px-4 py-2 text-sm font-medium text-[#4a4c42] transition hover:border-[#9ca08c] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {syncing ? '同步中…' : '一键同步'}
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-[#dee0db] bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <h2 className="text-base font-semibold text-[#333] dark:text-gray-200">手工登记（发布不依赖构建）</h2>
        <form onSubmit={handleAdd} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[#555] dark:text-gray-400">
            类型
            <select
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              className={`mt-1 ${inputClass}`}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {form.type === 'research' ? (
            <label className="text-sm text-[#555] dark:text-gray-400">
              调研分类
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">选择分类</option>
                {RESEARCH_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span aria-hidden="true" />
          )}
          <label className="text-sm text-[#555] dark:text-gray-400">
            slug（生成 key：{deriveContentKey(form) || '待填写'}）
            <input value={form.slug} onChange={(e) => setField('slug', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="my-new-research" />
          </label>
          <label className="text-sm text-[#555] dark:text-gray-400">
            链接 href
            <input value={form.href} onChange={(e) => setField('href', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="/articles/research/topics/my-new-research 或 https://…" />
          </label>
          <label className="text-sm text-[#555] dark:text-gray-400 sm:col-span-2">
            标题
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-sm text-[#555] dark:text-gray-400 sm:col-span-2">
            摘要
            <textarea value={form.summary} onChange={(e) => setField('summary', e.target.value)} rows={2} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="text-sm text-[#555] dark:text-gray-400">
            日期（YYYY-MM-DD）
            <input value={form.date} onChange={(e) => setField('date', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="2026-07-02" />
          </label>
          <label className="text-sm text-[#555] dark:text-gray-400">
            标签（逗号分隔）
            <input value={form.tags} onChange={(e) => setField('tags', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="AI, 前端" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-[#caccc0] bg-white px-4 py-2 text-sm font-medium text-[#4a4c42] transition hover:border-[#9ca08c] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {saving ? '保存中…' : '登记条目'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-[#dee0db] bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#333] dark:text-gray-200">
            已登记条目（{visible.length}）
          </h2>
          <div className="flex gap-1 text-xs">
            {['manual', 'sync', 'all'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSourceFilter(s)}
                className={`rounded-full border px-3 py-1 transition ${
                  sourceFilter === s
                    ? 'border-[#9ca08c] bg-[#f3f2ec] text-[#15140f] dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100'
                    : 'border-[#dcdfe5] text-[#777] dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                {s === 'manual' ? '手工' : s === 'sync' ? '同步' : '全部'}
              </button>
            ))}
          </div>
        </div>

        {status === 'loading' ? (
          <p className="mt-4 text-sm text-[#888] dark:text-gray-500">加载中…</p>
        ) : null}
        {status === 'error' ? (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">{message}</p>
        ) : null}

        <ul className="mt-3 divide-y divide-[#eceee9] dark:divide-gray-800">
          {visible.map((entry) => (
            <li key={entry.contentKey} className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="font-mono text-[11px] text-[#999] dark:text-gray-500">
                {entry.contentKey}
              </span>
              <a
                href={entry.href}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-[#333] underline-offset-4 hover:underline dark:text-gray-200"
              >
                {entry.title}
              </a>
              {entry.date ? (
                <span className="font-mono text-[11px] text-[#999] dark:text-gray-500">{entry.date}</span>
              ) : null}
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] ${
                  entry.status === 'published'
                    ? 'border-[#dbe4d6] bg-[#f3f8ef] text-[#3c5a2f] dark:border-[#2c3d2a] dark:bg-[#15200f] dark:text-[#a9cf92]'
                    : 'border-[#e5dcd6] bg-[#f8f3ef] text-[#8a5a3c] dark:border-[#3d2f2a] dark:bg-[#20150f] dark:text-[#cfa992]'
                }`}
              >
                {entry.status}
              </span>
              <span className="rounded-full border border-[#dcdfe5] px-2 py-0.5 text-[11px] text-[#777] dark:border-gray-700 dark:text-gray-400">
                {entry.source}
              </span>
              <button
                type="button"
                onClick={() => toggleStatus(entry)}
                className="text-xs text-[#666] underline-offset-4 hover:underline dark:text-gray-400"
              >
                {entry.status === 'published' ? '下线' : '上线'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(entry)}
                className="text-xs text-[#a2542f] underline-offset-4 hover:underline dark:text-[#d08c66]"
              >
                删除
              </button>
            </li>
          ))}
          {status === 'ok' && !visible.length ? (
            <li className="py-3 text-sm text-[#888] dark:text-gray-500">暂无条目，先点「一键同步」或手工登记。</li>
          ) : null}
        </ul>
      </section>
    </div>
  )
}
