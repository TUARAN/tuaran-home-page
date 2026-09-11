'use client'

import { useEffect, useRef, useState } from 'react'

import { OriginalPreviewDialog, THUMB_GRID_CLASS, ThumbTile } from './XImageThumbs'
import { AdminButton } from '../../components/ui'

const TYPES = [['', '全部类型'], ['greeting', '问候'], ['community-image', '朋友交流'], ['culture-story', '文化短故事'], ['crypto-insight', '加密观点'], ['us-english', '美区英文']]
const STATES = { pending: '待生成', generating: '生成中', ready: '待发布', failed: '失败待重试', publishing: '发布中 / 待核对', 'publish-unknown': '结果待核对', published: '已发布' }
const selectClass = 'rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-xs dark:border-[#2d3744] dark:bg-[#10161f]'

export default function XImagePool() {
  const [data, setData] = useState(null)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState('pool')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const requestVersion = useRef(0)

  async function load(before = '', version = ++requestVersion.current) {
    setBusy(true)
    setError('')
    try {
      const query = new URLSearchParams({ type, status, before })
      const response = await fetch(`/api/admin/morning-greeting/assets?${query}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || '图片资源池读取失败')
      if (version !== requestVersion.current) return
      setData((old) => ({ ...payload, items: before ? [...(old?.items || []), ...payload.items] : payload.items }))
    } catch (failure) {
      if (version === requestVersion.current) setError(failure.message || '图片资源池读取失败')
    } finally {
      if (version === requestVersion.current) setBusy(false)
    }
  }

  useEffect(() => {
    setData(null)
    load()
    return () => { requestVersion.current += 1 }
  }, [type, status, revision]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="m-0 text-[11px] leading-6 text-[#77796e] dark:text-gray-400">固定模板：R2 / tuaran-media / images/x-posts/pool/ · 记录：D1。列表只显示占位，点查看原图才加载原图。</p>
        <AdminButton size="sm" onClick={() => setRevision((value) => value + 1)} disabled={busy}>{busy ? '读取中…' : '刷新素材'}</AdminButton>
      </div>
      {data?.config && !data.config.storageConfigured ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">当前环境缺少 MEDIA 绑定；请同时核对公开站发布环境的绑定。固定模板不可用时会停止该次图文发布；随机选中的纯文本任务不依赖此绑定。</p> : null}
      {data?.available === false ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{data.error}</p> : null}
      <div className="my-3 flex flex-wrap gap-2">
        <AdminButton size="sm" variant={view === 'pool' ? 'primary' : 'ghost'} onClick={() => setView('pool')}>固定模板池（{data?.pool?.length || 0}）</AdminButton>
        <AdminButton size="sm" variant={view === 'runs' ? 'primary' : 'ghost'} onClick={() => setView('runs')}>选图与发布记录</AdminButton>
        <select aria-label="素材类型" className={selectClass} value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        {view === 'runs' ? <select aria-label="素材状态" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">全部状态</option>{Object.entries(STATES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : null}
      </div>
      {error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : null}
      {busy && !data ? <p className="text-sm text-gray-500" role="status">正在读取图片资源池…</p> : null}
      {data?.available && !(view === 'pool' ? data.pool : data.items).length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">当前筛选下暂无素材。固定模板池由批量上传登记；每次发推的选图保留在发布记录中。</p> : null}

      {view === 'pool' ? (
        <div className={THUMB_GRID_CLASS}>
          {(data?.pool || []).map((item) => (
            <ThumbTile
              key={item.id}
              item={{
                id: item.id,
                label: item.label || `${item.date} · ${item.slot}`,
                thumb: '',
                original: item.imageUrl,
                placeholder: TYPES.find(([value]) => value === item.contentType)?.[1] || '配图',
                text: item.text,
                storage: item.storage,
                objectKey: item.objectKey,
                model: item.model,
                sizeBytes: item.sizeBytes,
                prompt: item.prompt,
              }}
              onViewOriginal={setPreview}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(data?.items || []).map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-[#e2e4da] bg-white p-3 dark:border-[#293545] dark:bg-[#10161f]">
              <div className="flex justify-between gap-2 text-xs">
                <span>{TYPES.find(([value]) => value === item.contentType)?.[1]}</span>
                <span className={item.status === 'published' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>{item.status ? STATES[item.status] || item.status : '备用素材'}</span>
              </div>
              <p className="mb-0 mt-2 text-[11px] text-gray-500">{item.label || `${item.date} · ${item.slot}`}</p>
              <p className="m-0 line-clamp-3 whitespace-pre-wrap text-xs leading-5">{item.text || item.label || '等待生成文案'}</p>
              {item.status && item.imageUrl ? <p className="m-0 mt-1 text-[11px] text-gray-500">{item.source === 'pool' ? '配图来源：同主题固定模板池' : '配图来源：历史生成图'}</p> : null}
              {item.error ? <p className="m-0 mt-1 break-words text-xs text-rose-600">{item.error}</p> : null}
              {['publishing', 'publish-unknown'].includes(item.status) ? <p className="m-0 mt-1 text-xs text-amber-700 dark:text-amber-300">请到 X 核对是否发布成功；为避免重复发帖，已停止本时段自动重试。</p> : null}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-sky-700 dark:text-sky-300">
                {item.imageUrl ? (
                  <>
                    <button type="button" onClick={() => setPreview(item)}>查看原图</button>
                    <a href={`${item.imageUrl}${item.imageUrl.includes('?') ? '&' : '?'}download=1`}>下载原图</a>
                  </>
                ) : <span className="text-gray-500">{item.source === 'text' ? '纯文本' : STATES[item.status] || item.status}</span>}
                {item.postUrl ? <a href={item.postUrl} target="_blank" rel="noreferrer">查看 X ↗</a> : null}
              </div>
            </article>
          ))}
        </div>
      )}
      {view === 'runs' && data?.nextCursor ? <div className="mt-3 text-center"><AdminButton disabled={busy} onClick={() => load(data.nextCursor)}>{busy ? '读取中…' : '加载更多'}</AdminButton></div> : null}
      <OriginalPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
