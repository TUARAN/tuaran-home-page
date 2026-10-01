'use client'

import { useEffect, useRef, useState } from 'react'

import { OriginalPreviewDialog } from './XImageThumbs'
import { AdminButton, Section } from '../../components/ui'

const TYPES = [['', '全部类型'], ['joke-text', '纯文字段子'], ['greeting', '问候'], ['community-image', '朋友交流'], ['culture-story', '文化短故事'], ['crypto-insight', '加密观点'], ['us-english', '美区英文'], ['controversy-text', '话题帖']]
const STATES = { pending: '待生成', generating: '生成中', ready: '待发布', failed: '失败待重试', publishing: '发布中 / 待核对', 'publish-unknown': '结果待核对', published: '已发布' }
const fieldClass = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-3 text-xs text-[#45473f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'
const EMPTY_FILTERS = { keyword: '', from: '', to: '', type: '', status: '' }

async function readPayload(response) {
  const contentType = response.headers.get('content-type')?.toLowerCase() || ''
  if (!contentType.includes('application/json')) {
    await response.text().catch(() => '')
    throw new Error(`发布记录接口返回异常（HTTP ${response.status}），请刷新页面；如仍失败请重新登录。`)
  }
  const payload = await response.json().catch(() => null)
  if (!payload || typeof payload !== 'object') throw new Error('发布记录响应无法解析，请稍后重试。')
  return payload
}

function typeLabel(value) {
  return TYPES.find(([id]) => id === value)?.[1] || value || '—'
}

function sourceLabel(item) {
  if (item.source === 'text') return '纯文本'
  if (item.source === 'pool') return '固定模板'
  return item.imageUrl ? '历史生成图' : '无配图'
}

function statusTone(status) {
  if (status === 'published') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
  if (status === 'failed') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
}

export default function XPublicationRecords() {
  const [draft, setDraft] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [preview, setPreview] = useState(null)
  const requestVersion = useRef(0)

  async function load(before = '', version = ++requestVersion.current) {
    setBusy(true)
    setError('')
    try {
      const query = new URLSearchParams({ scope: 'runs', ...filters, before })
      const response = await fetch(`/api/admin/morning-greeting/assets?${query}`, { cache: 'no-store', credentials: 'same-origin' })
      const payload = await readPayload(response)
      if (!response.ok) {
        const message = payload.error === 'NOT_AUTHENTICATED'
          ? '登录状态已失效，请重新登录。'
          : payload.error === 'NOT_OWNER'
            ? '当前账号没有权限读取发布记录。'
            : payload.error || `发布记录读取失败（HTTP ${response.status}）`
        throw new Error(message)
      }
      if (version !== requestVersion.current) return
      setData((old) => ({ ...payload, items: before ? [...(old?.items || []), ...payload.items] : payload.items }))
    } catch (failure) {
      if (version === requestVersion.current) setError(failure.message || '发布记录读取失败')
    } finally {
      if (version === requestVersion.current) setBusy(false)
    }
  }

  useEffect(() => {
    setData(null)
    load()
    return () => { requestVersion.current += 1 }
  }, [filters, revision]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    setFilters({ ...draft, keyword: draft.keyword.trim() })
  }

  function reset() {
    setDraft(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
  }

  return (
    <Section
      title="发布记录"
      description="按时间倒序查看每次 X 发布任务的文案、配图、状态与原帖；筛选由 D1 查询全部历史记录。"
      className="mb-4"
      actions={<AdminButton size="sm" onClick={() => setRevision((value) => value + 1)} disabled={busy}>{busy ? '读取中…' : '刷新记录'}</AdminButton>}
    >
      <form onSubmit={submit} className="mb-4 grid gap-2 lg:grid-cols-[minmax(180px,1fr)_150px_150px_150px_170px_auto]" aria-label="发布记录筛选">
        <input
          type="search"
          aria-label="按关键词搜索"
          placeholder="搜索文案、提示词、时段或错误"
          className={fieldClass}
          value={draft.keyword}
          onChange={(event) => updateDraft('keyword', event.target.value)}
          maxLength={100}
        />
        <input type="date" aria-label="开始日期" className={fieldClass} value={draft.from} max={draft.to || undefined} onChange={(event) => updateDraft('from', event.target.value)} />
        <input type="date" aria-label="结束日期" className={fieldClass} value={draft.to} min={draft.from || undefined} onChange={(event) => updateDraft('to', event.target.value)} />
        <select aria-label="发布类型" className={fieldClass} value={draft.type} onChange={(event) => updateDraft('type', event.target.value)}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="发布状态" className={fieldClass} value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}><option value="">全部状态</option>{Object.entries(STATES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <div className="flex gap-2">
          <AdminButton type="submit" size="sm" disabled={busy}>查询</AdminButton>
          <AdminButton type="button" size="sm" variant="ghost" onClick={reset} disabled={busy}>清空</AdminButton>
        </div>
      </form>

      {error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : null}
      {busy && !data ? <p className="text-sm text-gray-500" role="status">正在读取发布记录…</p> : null}
      {data?.available && !(data.items || []).length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">当前筛选下没有发布记录。</p> : null}

      {(data?.items || []).length ? (
        <div className="overflow-x-auto rounded-xl border border-[#e2e4da] dark:border-[#293545]">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="bg-[#f7f8f2] text-[11px] text-[#686a60] dark:bg-[#0d131b] dark:text-gray-400">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">日期 / 时段</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">类型</th>
                <th className="min-w-[320px] px-3 py-2.5 font-medium">发布文案</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">形式</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">状态</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceee5] bg-white dark:divide-[#202b39] dark:bg-[#10161f]">
              {data.items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-[#fbfbf8] dark:hover:bg-[#121a24]">
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                    <div className="font-medium">{item.date || '—'}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{item.slot || '—'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{typeLabel(item.contentType)}</td>
                  <td className="px-3 py-3">
                    <p className="m-0 line-clamp-3 whitespace-pre-wrap leading-5">{item.text || '等待生成文案'}</p>
                    {item.error ? <p className="m-0 mt-1 break-words text-[11px] text-rose-600">{item.error}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{sourceLabel(item)}</td>
                  <td className="whitespace-nowrap px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] ${statusTone(item.status)}`}>{STATES[item.status] || item.status || '—'}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-[145px] flex-wrap gap-x-3 gap-y-1 text-sky-700 dark:text-sky-300">
                      {item.imageUrl ? <button type="button" onClick={() => setPreview(item)}>查看原图</button> : null}
                      {item.imageUrl ? <a href={`${item.imageUrl}${item.imageUrl.includes('?') ? '&' : '?'}download=1`}>下载</a> : null}
                      {item.postUrl ? <a href={item.postUrl} target="_blank" rel="noreferrer">查看 X ↗</a> : null}
                      {!item.imageUrl && !item.postUrl ? <span className="text-gray-400">—</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data?.nextCursor ? <div className="mt-3 text-center"><AdminButton disabled={busy} onClick={() => load(data.nextCursor)}>{busy ? '读取中…' : '加载更多'}</AdminButton></div> : null}
      <OriginalPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </Section>
  )
}
