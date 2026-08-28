'use client'

import { useEffect, useRef, useState } from 'react'
import { AdminButton } from '../../components/ui'

const TYPES = [['', '全部类型'], ['greeting', '问候'], ['community-image', '朋友图文'], ['culture-story', '文化短故事'], ['crypto-insight', '加密观点'], ['us-english', '美区英文']]
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
  const dialog = useRef(null)
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

  useEffect(() => {
    if (preview) dialog.current?.showModal()
    else dialog.current?.close()
  }, [preview])

  return (
    <section aria-labelledby="x-image-pool-title" className="rounded-xl border border-[#e2e4da] bg-[#fbfbf8] p-4 dark:border-[#243041] dark:bg-[#0f141d]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="x-image-pool-title" className="m-0 text-sm font-semibold">图片资源池</h3>
          <p className="mb-0 mt-1 text-xs leading-6 text-[#77796e] dark:text-gray-400">每条新配图随机二选一（各 50%）：生成优先、素材兜底；或直接取同主题备用素材。生图随机使用动漫、日式浮世绘、赛博朋克、抽象、现代主义、水彩、剪纸或黑白摄影。上传失败重试复用原图和文案。</p>
          <p className="m-0 text-[11px] leading-6 text-[#77796e] dark:text-gray-400">新图：R2 / tuaran-media / images/x-posts/ · 记录：D1 · 在线生成：FLUX.1 schnell · 备用素材：本地批量生成后上传</p>
        </div>
        <AdminButton size="sm" onClick={() => setRevision((value) => value + 1)} disabled={busy}>{busy ? '读取中…' : '刷新素材'}</AdminButton>
      </div>
      {data?.config && (!data.config.aiConfigured || !data.config.storageConfigured) ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">当前环境缺少 {!data.config.aiConfigured ? 'AI ' : ''}{!data.config.storageConfigured ? 'MEDIA ' : ''}绑定；请同时核对公开站发布环境的绑定。生图不可用时尝试素材池；图片均不可用时不会发送纯文字。</p> : null}
      {data?.available === false ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{data.error}</p> : null}
      <div className="my-3 flex flex-wrap gap-2">
        <AdminButton size="sm" variant={view === 'pool' ? 'primary' : 'ghost'} onClick={() => setView('pool')}>备用素材池（{data?.pool?.length || 0}）</AdminButton>
        <AdminButton size="sm" variant={view === 'runs' ? 'primary' : 'ghost'} onClick={() => setView('runs')}>生成与发布记录</AdminButton>
        <select aria-label="素材类型" className={selectClass} value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        {view === 'runs' ? <select aria-label="素材状态" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">全部状态</option>{Object.entries(STATES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : null}
      </div>
      {error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : null}
      {busy && !data ? <p className="text-sm text-gray-500" role="status">正在读取图片资源池…</p> : null}
      {data?.available && !(view === 'pool' ? data.pool : data.items).length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">当前筛选下暂无素材。备用池由批量上传登记；每次发推的图片保留在生成与发布记录中。</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {((view === 'pool' ? data?.pool : data?.items) || []).map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-[#e2e4da] bg-white dark:border-[#293545] dark:bg-[#10161f]">
          {item.imageUrl ? <button type="button" className="block w-full" onClick={() => setPreview(item)} aria-label={`预览 ${item.date} ${item.slot} 配图`}><img src={item.imageUrl} alt={`${TYPES.find(([value]) => value === item.contentType)?.[1] || '推文'}配图`} loading="lazy" className="aspect-[4/3] w-full object-cover" /></button> : <div className="flex aspect-[4/3] items-center justify-center bg-[#f0f1eb] text-sm text-gray-500 dark:bg-[#192332]">{STATES[item.status] || item.status}</div>}
          <div className="space-y-2 p-3">
            <div className="flex justify-between gap-2 text-xs"><span>{TYPES.find(([value]) => value === item.contentType)?.[1]}</span><span className={item.status === 'published' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>{item.status ? STATES[item.status] || item.status : '备用素材'}</span></div>
            <p className="m-0 text-[11px] text-gray-500">{item.label || `${item.date} · ${item.slot}`}</p>
            <p className="m-0 line-clamp-3 whitespace-pre-wrap text-xs leading-5">{item.text || item.label || '等待生成文案'}</p>
            {item.status && item.imageUrl ? <p className="m-0 text-[11px] text-gray-500">{item.source === 'pool' ? (item.fallbackError ? '配图来源：生成失败，同主题素材兜底' : '配图来源：直接随机选用备用素材') : '配图来源：本次生成'}</p> : null}
            {item.error ? <p className="m-0 break-words text-xs text-rose-600">{item.error}</p> : null}
            {['publishing', 'publish-unknown'].includes(item.status) ? <p className="m-0 text-xs text-amber-700 dark:text-amber-300">请到 X 核对是否发布成功；为避免重复发帖，已停止本时段自动重试。</p> : null}
            <div className="flex flex-wrap gap-3 text-xs text-sky-700 dark:text-sky-300">
              {item.imageUrl ? <><button type="button" onClick={() => setPreview(item)}>预览详情</button><a href={`${item.imageUrl}${item.imageUrl.includes('?') ? '&' : '?'}download=1`}>下载原图</a></> : null}
              {item.postUrl ? <a href={item.postUrl} target="_blank" rel="noreferrer">查看 X ↗</a> : null}
            </div>
          </div>
        </article>)}
      </div>
      {view === 'runs' && data?.nextCursor ? <div className="mt-3 text-center"><AdminButton disabled={busy} onClick={() => load(data.nextCursor)}>{busy ? '读取中…' : '加载更多'}</AdminButton></div> : null}
      <details className="mt-4 border-t border-[#e2e4da] pt-3 dark:border-[#293545]">
        <summary className="cursor-pointer text-xs font-medium">历史固定素材 · {data?.legacy?.length || 10} 张 · 存放在仓库，未迁入 R2</summary>
        <p className="text-xs text-gray-500">保留旧图供查看；新任务随机选择在线生成或 R2 备用素材，不使用这些历史固定素材。</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{(data?.legacy || []).map((item) => <button key={item.id} type="button" className="overflow-hidden rounded-lg border text-left dark:border-[#293545]" onClick={() => setPreview(item)}><img src={item.imageUrl} alt={item.label} loading="lazy" className="aspect-square w-full object-cover" /><span className="block p-2 text-xs">{item.label}</span></button>)}</div>
      </details>
      <dialog ref={dialog} onClose={() => setPreview(null)} className="max-h-[90vh] w-[min(900px,92vw)] overflow-y-auto rounded-2xl bg-white p-4 text-[#34352f] backdrop:bg-black/60 dark:bg-[#10161f] dark:text-gray-100" aria-label="配图详情">
        {preview ? <><div className="mb-3 flex justify-between gap-3"><strong>{preview.label || `${preview.date} · ${preview.slot}`}</strong><button type="button" onClick={() => setPreview(null)} className="rounded border px-3 py-1 text-sm">关闭</button></div><img src={preview.imageUrl} alt={preview.label || '推文生成配图'} className="max-h-[60vh] w-full object-contain" /><p className="whitespace-pre-wrap text-sm">{preview.text}</p><p className="break-all text-xs text-gray-500">{preview.storage} {preview.objectKey || ''}</p>{preview.model ? <p className="text-xs">{preview.model} · {(preview.sizeBytes / 1024).toFixed(0)} KB</p> : null}{preview.prompt ? <details><summary className="cursor-pointer text-xs">生成提示词</summary><p className="text-xs leading-6">{preview.prompt}</p></details> : null}</> : null}
      </dialog>
    </section>
  )
}
