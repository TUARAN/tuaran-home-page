'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconCheck, IconEdit, IconPlus, IconRefresh, IconSearch, IconSparkles, IconTrash, IconX } from '@tabler/icons-react'

import { AdminButton, AdminPage } from '../../components/ui'

const EMPTY_FORM = {
  id: '', text: '', author: '', source: '', sourceUrl: '', enabled: true, sortOrder: 0,
}

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

export default function QuotesConsole() {
  const [quotes, setQuotes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [direction, setDirection] = useState('')
  const [candidates, setCandidates] = useState([])
  const [generationMeta, setGenerationMeta] = useState(null)
  const [persistent, setPersistent] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/quotes', { cache: 'no-store', credentials: 'same-origin' })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.message || data?.error || `HTTP_${response.status}`)
      setQuotes(Array.isArray(data?.quotes) ? data.quotes : [])
      setPersistent(data?.persistent !== false)
    } catch (reason) {
      setError(reason?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return quotes
    return quotes.filter((item) =>
      `${item.text} ${item.author} ${item.source}`.toLowerCase().includes(keyword))
  }, [query, quotes])

  const enabledCount = quotes.filter((item) => item.enabled).length

  async function generate() {
    setGenerating(true)
    setCandidates([])
    setGenerationMeta(null)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'generate', direction }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.detail || data?.error || `HTTP_${response.status}`)
      setCandidates(Array.isArray(data?.quotes) ? data.quotes : [])
      setGenerationMeta(data)
    } catch (reason) {
      setError(reason?.message || 'QUOTE_GENERATION_FAILED')
    } finally {
      setGenerating(false)
    }
  }

  function chooseCandidate(candidate) {
    setForm({ ...EMPTY_FORM, ...candidate, id: '' })
    setMessage('候选已载入编辑区，确认后再保存。')
    setError('')
  }

  function edit(item) {
    setForm({ ...EMPTY_FORM, ...item })
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save(event) {
    event.preventDefault()
    if (!form.text.trim() || !form.author.trim()) {
      setError('名言和作者不能为空。')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/quotes', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setForm(EMPTY_FORM)
      setMessage(form.id ? '名言已更新。' : '名言已添加。')
      await load()
    } catch (reason) {
      setError(reason?.message || 'SAVE_FAILED')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(item) {
    setError('')
    const response = await fetch('/api/admin/quotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ ...item, enabled: !item.enabled }),
    })
    const data = await readJson(response)
    if (!response.ok) {
      setError(data?.error || `HTTP_${response.status}`)
      return
    }
    setQuotes((current) => current.map((quote) =>
      quote.id === item.id ? { ...quote, enabled: !quote.enabled } : quote))
  }

  async function remove(item) {
    if (!window.confirm(`确定删除“${item.text}”吗？`)) return
    setError('')
    const response = await fetch(`/api/admin/quotes?id=${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await readJson(response)
    if (!response.ok) {
      setError(data?.error || `HTTP_${response.status}`)
      return
    }
    setQuotes((current) => current.filter((quote) => quote.id !== item.id))
    if (form.id === item.id) setForm(EMPTY_FORM)
    setMessage('名言已删除。')
  }

  return (
    <AdminPage
      title="名言管理"
      description={`管理目录页随机短句。共 ${quotes.length} 条，启用 ${enabledCount} 条；模型只生成候选，确认保存后才会公开展示。`}
      actions={<AdminButton onClick={load} disabled={loading || saving}><IconRefresh size={15} />重新读取</AdminButton>}
    >
      {!persistent ? <Notice tone="warning">当前为本地预览数据；部署并应用 D1 迁移后才能保存修改。</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="self-start rounded-xl border border-[#d9dbd0] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f] xl:sticky xl:top-5">
          <div>
            <div className="flex items-center gap-2">
              <IconSparkles size={17} className="text-violet-600 dark:text-violet-300" />
              <h2 className="text-base font-semibold text-[#20211c] dark:text-gray-100">生成原创候选</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#77796e] dark:text-gray-400">
              每次最多依次调用 Qwen3.8 27B、Qwen3.5 9B、DeepSeek 各一次，成功后立即停止。
            </p>
            <Field label="可选写作方向">
              <input maxLength={240} value={direction} onChange={(event) => setDirection(event.target.value)} className={inputClass} placeholder="例如：长期学习中的耐心" />
            </Field>
            <AdminButton type="button" variant="primary" onClick={generate} disabled={generating || !persistent} className="mt-3">
              <IconSparkles size={15} />{generating ? '生成中…' : '生成 3 条候选'}
            </AdminButton>
            {generationMeta ? (
              <p className="mt-2 text-xs text-[#77796e] dark:text-gray-400">
                本次使用 {generationMeta.providerName || generationMeta.provider} · {generationMeta.model}，共尝试 {generationMeta.attempts?.length || 1} 次。
              </p>
            ) : null}
            {candidates.length ? (
              <div className="mt-3 space-y-2">
                {candidates.map((candidate) => (
                  <button key={candidate.text} type="button" onClick={() => chooseCandidate(candidate)} className="block w-full rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2 text-left font-serif text-sm leading-6 text-[#292a24] transition hover:border-violet-300 dark:border-violet-950 dark:bg-violet-950/20 dark:text-gray-100 dark:hover:border-violet-700">
                    “{candidate.text}”
                    <span className="mt-1 block font-sans text-[11px] text-violet-700 dark:text-violet-300">载入编辑区</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="my-5 border-t border-[#e7e4da] dark:border-[#27313d]" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#20211c] dark:text-gray-100">{form.id ? '编辑名言' : '新增名言'}</h2>
            {form.id ? <button type="button" onClick={() => setForm(EMPTY_FORM)} className="text-[#858779] hover:text-[#25251f] dark:hover:text-white" aria-label="取消编辑"><IconX size={18} /></button> : null}
          </div>
          <form onSubmit={save} className="mt-4 space-y-4">
            <Field label="名言">
              <textarea required maxLength={80} rows={3} value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} className={`${inputClass} h-auto resize-y py-2`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="作者"><input required maxLength={40} value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} className={inputClass} /></Field>
              <Field label="排序"><input type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} className={inputClass} /></Field>
            </div>
            <Field label="出处"><input maxLength={80} value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className={inputClass} placeholder="例如：《论语》" /></Field>
            <Field label="来源链接"><input type="url" maxLength={500} value={form.sourceUrl} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} className={inputClass} placeholder="https://…" /></Field>
            <label className="flex items-center gap-2 text-sm text-[#55574e] dark:text-gray-300">
              <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 accent-[#15140f]" />
              启用
            </label>
            <AdminButton type="submit" variant="primary" disabled={saving || !persistent}>
              {form.id ? <IconCheck size={15} /> : <IconPlus size={15} />}{saving ? '保存中…' : form.id ? '保存修改' : '添加名言'}
            </AdminButton>
          </form>
        </section>

        <section className="rounded-xl border border-[#d9dbd0] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
          <label className="relative block">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929487]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名言、作者或出处" className={`${inputClass} pl-9`} />
          </label>
          <div className="mt-4 divide-y divide-[#e7e4da] dark:divide-[#27313d]">
            {filtered.map((item) => (
              <article key={item.id} className={`grid gap-3 py-4 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center ${item.enabled ? '' : 'opacity-55'}`}>
                <div className="min-w-0">
                  <p className="font-serif text-[15px] leading-7 text-[#292a24] dark:text-gray-100">“{item.text}”</p>
                  <p className="mt-1 text-xs text-[#858779] dark:text-gray-500">
                    {item.author}{item.source ? ` · ${item.source}` : ''}
                    {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">核验来源</a> : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggle(item)} disabled={!persistent} className={`rounded-full px-3 py-1.5 text-xs font-medium ${item.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-[#efeee8] text-[#77786d] dark:bg-[#202934] dark:text-gray-400'}`}>{item.enabled ? '已启用' : '已停用'}</button>
                  <button type="button" onClick={() => edit(item)} className={iconButtonClass} aria-label="编辑"><IconEdit size={16} /></button>
                  <button type="button" onClick={() => remove(item)} disabled={!persistent} className={`${iconButtonClass} hover:text-rose-600`} aria-label="删除"><IconTrash size={16} /></button>
                </div>
              </article>
            ))}
            {!loading && !filtered.length ? <p className="py-10 text-center text-sm text-[#858779]">没有匹配的名言</p> : null}
          </div>
        </section>
      </div>
    </AdminPage>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-[#d7d8ce] bg-white px-3 text-sm text-[#292a24] outline-none transition focus:border-[#818472] dark:border-[#34404d] dark:bg-[#0c1118] dark:text-gray-100'
const iconButtonClass = 'rounded-lg border border-[#dedfd5] p-2 text-[#77786d] transition hover:border-[#aaac9e] hover:text-[#25251f] disabled:opacity-40 dark:border-[#303b47] dark:text-gray-400 dark:hover:text-white'

function Field({ label, children }) {
  return <label className="block text-xs font-medium text-[#55574e] dark:text-gray-300">{label}<span className="mt-1 block">{children}</span></label>
}

function Notice({ tone, children }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  }
  return <div className={`mb-5 rounded-lg border px-3 py-2 text-sm ${styles[tone]}`}>{children}</div>
}
