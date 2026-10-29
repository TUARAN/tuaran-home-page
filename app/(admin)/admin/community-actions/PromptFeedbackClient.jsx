'use client'

import { useCallback, useEffect, useState } from 'react'

import { PROMPT_FEEDBACK_TYPES, promptFeedbackMarkdown } from '../../../../lib/community/xExtensionPromptFeedback'
import { AdminButton, Section } from '../../components/ui'

const API = '/api/admin/x-extension-prompt-feedback'
const TYPES = Object.entries(PROMPT_FEEDBACK_TYPES)
const EMPTY = { kind: 'bad', promptKey: 'replyTimelinePrompt', content: '', assessment: '', expected: '', context: '', sourceUrl: '' }
const FIELD = 'w-full rounded-lg border border-[#cfd8d3] bg-white px-3 py-2 text-[13px] text-[#18241f] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 dark:border-[#3b5146] dark:bg-[#102019] dark:text-gray-100'

function downloadMarkdown(rows) {
  const blob = new Blob([promptFeedbackMarkdown(rows)], { type: 'text/markdown;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = `x-extension-prompt-feedback-${new Date().toISOString().slice(0, 10)}.md`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

export default function PromptFeedbackClient() {
  const [form, setForm] = useState(EMPTY)
  const [entries, setEntries] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API}?status=${filter}`, { credentials: 'same-origin', cache: 'no-store' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || '反馈读取失败。')
      setEntries(data.entries || [])
      setNotice('')
    } catch (error) {
      setNotice(error.message || '反馈读取失败。')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { void refresh() }, [refresh])

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch(API, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || '保存失败。')
      setForm({ ...EMPTY, kind: form.kind, promptKey: form.promptKey })
      if (filter === 'pending') await refresh()
      else setFilter('pending')
      setNotice('已存入站内反馈台账。默认提示词没有变化。')
    } catch (error) {
      setNotice(error.message || '保存失败。')
    } finally {
      setBusy(false)
    }
  }

  async function setReviewed(entry) {
    if (busy) return
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch(API, {
        method: 'PATCH', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: entry.id, status: entry.status === 'pending' ? 'reviewed' : 'pending' }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || '状态保存失败。')
      await refresh()
      setNotice(entry.status === 'pending' ? '已标记为已汇总。提示词仍需单独审阅后修改。' : '已重新放回待汇总。')
    } catch (error) {
      setNotice(error.message || '状态保存失败。')
    } finally {
      setBusy(false)
    }
  }

  async function syncToRepository() {
    if (syncBusy) return
    setSyncBusy(true)
    setNotice('')
    try {
      const response = await fetch(`${API}/sync`, { method: 'POST', credentials: 'same-origin' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || '仓库同步失败。')
      await refresh()
      setNotice(data.synced ? `已将 ${data.synced} 条反馈同步到仓库规范。默认提示词没有变化。${data.remaining ? '还有下一批可继续同步。' : ''}` : '没有待同步的反馈。')
    } catch (error) {
      setNotice(error.message || '仓库同步失败；站内记录仍保留。')
    } finally {
      setSyncBusy(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      <Section title="录入正反例" description="记录具体原文和判断。单条反馈只保存，不自动修改插件或站内的四份提示词。">
        <form className="grid gap-3" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[12px] font-semibold">反馈方向
              <select className={FIELD} value={form.kind} onChange={(event) => setField('kind', event.target.value)}>
                <option value="bad">反例 · 哪里不对</option><option value="good">正例 · 哪句写得好</option>
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-semibold">对应提示词
              <select className={FIELD} value={form.promptKey} onChange={(event) => setField('promptKey', event.target.value)}>
                {TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-[12px] font-semibold">发出的原文
            <textarea className={FIELD} rows={4} maxLength={5000} required value={form.content} onChange={(event) => setField('content', event.target.value)} placeholder="贴出完整帖子或回复，保留原来的换行。" />
          </label>
          <label className="grid gap-1 text-[12px] font-semibold">{form.kind === 'good' ? '哪一句立住了，为什么？' : '哪里不像人话、哪里假或油？'}
            <textarea className={FIELD} rows={3} maxLength={2000} required value={form.assessment} onChange={(event) => setField('assessment', event.target.value)} placeholder={form.kind === 'good' ? '说清具体句子或写法。' : '指出具体句子和问题，便于以后归纳。'} />
          </label>
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="grid gap-1 text-[12px] font-semibold">原帖语境（可选）
              <textarea className={FIELD} rows={2} maxLength={3000} value={form.context} onChange={(event) => setField('context', event.target.value)} />
            </label>
            <label className="grid gap-1 text-[12px] font-semibold">期望写法（可选）
              <textarea className={FIELD} rows={2} maxLength={2000} value={form.expected} onChange={(event) => setField('expected', event.target.value)} />
            </label>
          </div>
          <label className="grid gap-1 text-[12px] font-semibold">X 来源链接（可选）
            <input className={FIELD} type="url" maxLength={500} value={form.sourceUrl} onChange={(event) => setField('sourceUrl', event.target.value)} placeholder="https://x.com/.../status/..." />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <AdminButton type="submit" variant="primary" disabled={busy}>{busy ? '保存中…' : '保存反馈'}</AdminButton>
            <span className="text-[12px] text-[#5f6156] dark:text-gray-300">只入库，汇总后才调整默认文案。</span>
          </div>
        </form>
      </Section>

      <Section title="反馈台账" description="按待汇总 / 已汇总查看。可下载 Markdown 批量复盘，也可把未同步条目写入仓库规范。">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select className={`${FIELD} max-w-40`} aria-label="筛选反馈状态" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">待汇总</option><option value="reviewed">已汇总</option><option value="all">全部</option>
          </select>
          <AdminButton type="button" size="sm" onClick={refresh} disabled={loading}>刷新</AdminButton>
          <AdminButton type="button" size="sm" onClick={() => downloadMarkdown(entries)} disabled={loading || !entries.length}>下载当前列表 Markdown</AdminButton>
          <AdminButton type="button" size="sm" onClick={syncToRepository} disabled={syncBusy}>{syncBusy ? '同步中…' : '同步未归档反馈到仓库'}</AdminButton>
          <span className="text-[12px] text-[#5f6156] dark:text-gray-300">当前 {entries.length} 条，最多显示 200 条</span>
        </div>
        <p className="mb-3 text-[12px] leading-5 text-[#5f6156] dark:text-gray-300">仓库同步会把原文和评价提交到公开的 <code>docs/specs/x-extension-prompt-feedback.md</code>；需要后台配置 GITHUB_SYNC_TOKEN。它不会修改默认提示词。</p>
        {loading ? <p role="status" className="text-[13px]">正在读取反馈…</p> : null}
        {!loading && !entries.length ? <p className="text-[13px] text-[#5f6156] dark:text-gray-300">当前没有反馈。</p> : null}
        <ul className="grid gap-3 p-0">
          {entries.map((entry) => (
            <li key={entry.id} className="list-none rounded-xl border border-[#dbe3dd] bg-white/75 p-4 dark:border-[#244238] dark:bg-[#10251f]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[13px]">{entry.kind === 'good' ? '正例' : '反例'} · {PROMPT_FEEDBACK_TYPES[entry.promptKey]}</strong>
                <span className="text-[11px] text-[#66766d] dark:text-gray-400">{new Date(entry.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} · {entry.status === 'pending' ? '待汇总' : '已汇总'} · {entry.syncedAt ? '已入仓库' : '仅站内'}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6">{entry.content}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-5 text-[#5f6156] dark:text-gray-300"><b>{entry.kind === 'good' ? '好在哪' : '问题'}：</b>{entry.assessment}</p>
              {entry.expected ? <p className="mt-1 whitespace-pre-wrap break-words text-[12px]">期望：{entry.expected}</p> : null}
              {entry.context ? <p className="mt-1 whitespace-pre-wrap break-words text-[12px]">语境：{entry.context}</p> : null}
              {entry.sourceUrl ? <a className="mt-1 inline-block break-all text-[12px] text-sky-700 underline dark:text-sky-300" href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">查看来源</a> : null}
              <div className="mt-3"><AdminButton type="button" size="sm" onClick={() => setReviewed(entry)} disabled={busy}>{entry.status === 'pending' ? '标记已汇总' : '放回待汇总'}</AdminButton></div>
            </li>
          ))}
        </ul>
      </Section>
      {notice ? <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{notice}</p> : null}
    </div>
  )
}
