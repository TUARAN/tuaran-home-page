'use client'

import { useEffect, useState } from 'react'

const EMPTY = { id: '', title: '', body: '', revision: 0 }

export default function PrivateTextNotes() {
  const [items, setItems] = useState([])
  const [current, setCurrent] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/private-documents/notes', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '读取失败')
        return data.items || []
      })
      .then((loaded) => { setItems(loaded); setCurrent(loaded[0] || EMPTY) })
      .catch((error) => setMessage(`读取失败：${error.message}`))
      .finally(() => setLoading(false))
  }, [])

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/private-documents/notes', {
        method: current.id ? 'PUT' : 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(current),
      })
      const data = await response.json()
      if (!response.ok || !data.item) throw new Error(data.error || `HTTP ${response.status}`)
      setCurrent(data.item)
      setItems((before) => [data.item, ...before.filter((item) => item.id !== data.item.id)])
      setMessage('已保存到私密文档。')
    } catch (error) {
      setMessage(`保存失败：${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-2" aria-label="文字记录列表">
        <button type="button" onClick={() => { setCurrent(EMPTY); setMessage('') }} className="w-full rounded-lg bg-[#15140f] px-4 py-2.5 text-left text-sm font-semibold text-white dark:bg-gray-100 dark:text-[#10161f]">＋ 写一篇记录</button>
        {loading ? <p className="text-sm text-[#67695d]">正在读取文字记录…</p> : null}
        {items.map((item) => <button key={item.id} type="button" onClick={() => { setCurrent(item); setMessage('') }} className={`block w-full rounded-lg border p-3 text-left text-sm dark:border-[#252e39] ${current.id === item.id ? 'border-[#8a7045] bg-[#f7f2e8] dark:bg-[#20251f]' : 'border-[#d5d7cd] bg-white dark:bg-[#10161f]'}`}>
          <span className="block break-words font-medium">{item.title}</span>
          <time className="mt-1 block text-xs text-[#67695d] dark:text-gray-400" dateTime={new Date(item.updatedAt).toISOString()}>{new Date(item.updatedAt).toLocaleString('zh-CN')}</time>
        </button>)}
      </aside>
      <form onSubmit={save} className="min-w-0 space-y-4 rounded-xl border border-[#d5d7cd] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 font-serif text-xl font-semibold">{current.id ? '编辑记录' : '新记录'}</h2><span className="text-xs text-[#67695d] dark:text-gray-400">仅站长后台可见 · 不进入前台</span></div>
        <label className="block text-sm font-medium">标题<input value={current.title} onChange={(event) => setCurrent((before) => ({ ...before, title: event.target.value }))} maxLength={200} required className="mt-2 block w-full rounded-lg border border-[#d5d7cd] px-3 py-2.5 text-base dark:border-[#343d48] dark:bg-[#10161f]" /></label>
        <label className="block text-sm font-medium">正文<textarea value={current.body} onChange={(event) => setCurrent((before) => ({ ...before, body: event.target.value }))} maxLength={50000} required rows={18} className="mt-2 block min-h-[420px] w-full resize-y rounded-lg border border-[#d5d7cd] px-3 py-3 text-base leading-8 dark:border-[#343d48] dark:bg-[#10161f]" placeholder="像写日记一样，记下此刻想保留的事。" /></label>
        <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={saving} className="rounded-lg bg-[#15140f] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]">{saving ? '保存中…' : '保存记录'}</button>{message ? <p role="status" className="m-0 text-sm">{message}</p> : null}</div>
      </form>
    </div>
  )
}
