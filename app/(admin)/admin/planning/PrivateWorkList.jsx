'use client'

import { useCallback, useEffect, useState } from 'react'

const STATUS_LABELS = { planned: '待办', doing: '进行中', waiting: '待补材料', done: '已完成' }

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

async function request(url, options) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || '请求失败')
  return body
}

const inputClass = 'w-full rounded-lg border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-ink)]'

export default function PrivateWorkList() {
  const [date, setDate] = useState(todayInShanghai)
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState({ title: '', details: '' })
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await request(`/api/admin/planning/work-items?date=${encodeURIComponent(date)}`)
      setItems(data.items || [])
    } catch (caught) {
      setError(caught.message === 'MIGRATION_REQUIRED' ? '工作清单数据表尚未部署。' : caught.message)
    } finally { setLoading(false) }
  }, [date])

  useEffect(() => { reload() }, [reload])

  async function add(event) {
    event.preventDefault()
    if (!draft.title.trim() || busy) return
    setBusy(true); setError('')
    try {
      await request('/api/admin/planning/work-items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workDate: date, ...draft }),
      })
      setDraft({ title: '', details: '' })
      await reload()
    } catch (caught) { setError(caught.message) }
    finally { setBusy(false) }
  }

  async function update(id, changes) {
    if (busy) return
    setBusy(true); setError('')
    try {
      await request('/api/admin/planning/work-items', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      })
      setEditing(null)
      await reload()
    } catch (caught) { setError(caught.message) }
    finally { setBusy(false) }
  }

  return (
    <section className="space-y-4" aria-label="私有工作清单">
      <div className="rounded-2xl border bg-[var(--admin-surface)] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 font-serif text-lg font-semibold">工作清单</h2>
            <p className="mb-0 mt-1 text-xs text-[var(--admin-muted)]">仅站长可见；与网站项目组合分开保存。</p>
          </div>
          <label className="text-sm">工作日期
            <input aria-label="工作日期" className={`${inputClass} mt-1`} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>
      </div>

      {error ? <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {loading ? <p className="text-sm text-[var(--admin-muted)]">正在加载工作清单…</p> : null}

      {!loading ? <ol className="space-y-3">
        {items.map((item) => <li key={item.id} className="rounded-xl border bg-[var(--admin-surface)] p-4">
          {editing?.id === item.id ? (
            <form onSubmit={(event) => { event.preventDefault(); update(item.id, editing) }} className="space-y-2">
              <input aria-label="事项标题" className={inputClass} value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} required />
              <textarea aria-label="事项说明" className={inputClass} rows={3} value={editing.details} onChange={(event) => setEditing({ ...editing, details: event.target.value })} />
              <div className="flex gap-2">
                <button className="rounded-lg border px-3 py-1.5 text-sm" type="submit" disabled={busy}>保存</button>
                <button className="rounded-lg border px-3 py-1.5 text-sm" type="button" onClick={() => setEditing(null)}>取消</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-sm font-semibold">{item.title}</h3>
                {item.details ? <p className="mb-0 mt-1 whitespace-pre-wrap text-sm text-[var(--admin-muted)]">{item.details}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <select aria-label={`状态：${item.title}`} className="rounded-lg border bg-[var(--admin-surface)] px-2 py-1.5 text-xs" value={item.status} disabled={busy} onChange={(event) => update(item.id, { status: event.target.value })}>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="button" className="rounded-lg border px-2 py-1.5 text-xs" onClick={() => setEditing({ id: item.id, title: item.title, details: item.details })}>编辑</button>
              </div>
            </div>
          )}
        </li>)}
      </ol> : null}
      {!loading && !items.length ? <p className="text-sm text-[var(--admin-muted)]">这一天还没有记录。</p> : null}

      <form onSubmit={add} className="space-y-2 rounded-2xl border bg-[var(--admin-surface)] p-4">
        <h3 className="m-0 text-sm font-semibold">添加工作事项</h3>
        <input aria-label="新事项标题" className={inputClass} placeholder="事项标题" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
        <textarea aria-label="新事项说明" className={inputClass} placeholder="说明或等待的材料" rows={2} value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} />
        <button type="submit" className="rounded-lg bg-[var(--admin-ink)] px-4 py-2 text-sm text-[var(--admin-surface)]" disabled={busy || !draft.title.trim()}>添加</button>
      </form>
    </section>
  )
}
