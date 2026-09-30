'use client'

import { useEffect, useRef, useState } from 'react'

import { OriginalPreviewDialog, THUMB_GRID_CLASS, ThumbTile } from './XImageThumbs'
import { AdminButton } from '../../components/ui'

const TYPES = [['', '全部类型'], ['greeting', '问候'], ['community-image', '朋友交流'], ['culture-story', '文化短故事'], ['crypto-insight', '加密观点'], ['us-english', '美区英文']]
const selectClass = 'rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-xs dark:border-[#2d3744] dark:bg-[#10161f]'

async function readPoolPayload(response) {
  const contentType = response.headers.get('content-type')?.toLowerCase() || ''
  if (!contentType.includes('application/json')) {
    await response.text().catch(() => '')
    throw new Error(`图片资源池接口返回异常（HTTP ${response.status}），请刷新页面；如仍失败请重新登录。`)
  }
  const payload = await response.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    throw new Error(`图片资源池响应无法解析（HTTP ${response.status}），请稍后重试。`)
  }
  return payload
}

export default function XImagePool() {
  const [data, setData] = useState(null)
  const [type, setType] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const requestVersion = useRef(0)

  async function load(version = ++requestVersion.current) {
    setBusy(true)
    setError('')
    try {
      const query = new URLSearchParams({ scope: 'pool', type })
      const response = await fetch(`/api/admin/morning-greeting/assets?${query}`, { cache: 'no-store', credentials: 'same-origin' })
      const payload = await readPoolPayload(response)
      if (!response.ok) {
        const message = payload.error === 'NOT_AUTHENTICATED'
          ? '登录状态已失效，请重新登录。'
          : payload.error === 'NOT_OWNER'
            ? '当前账号没有权限读取图片资源池。'
            : payload.error || `图片资源池读取失败（HTTP ${response.status}）`
        throw new Error(message)
      }
      if (version !== requestVersion.current) return
      setData(payload)
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
  }, [type, revision]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="m-0 text-[11px] leading-6 text-[#77796e] dark:text-gray-400">固定模板：R2 / tuaran-media / images/x-posts/pool/ · 记录：D1。列表懒加载配图预览，点查看原图打开大图。</p>
        <AdminButton size="sm" onClick={() => setRevision((value) => value + 1)} disabled={busy}>{busy ? '读取中…' : '刷新素材'}</AdminButton>
      </div>
      {data?.config && !data.config.storageConfigured ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">当前环境缺少 MEDIA 绑定；请同时核对公开站发布环境的绑定。固定模板不可用时会停止该次图文发布；随机选中的纯文本任务不依赖此绑定。</p> : null}
      {data?.available === false ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{data.error}</p> : null}
      <div className="my-3 flex flex-wrap gap-2">
        <select aria-label="素材类型" className={selectClass} value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : null}
      {busy && !data ? <p className="text-sm text-gray-500" role="status">正在读取图片资源池…</p> : null}
      {data?.available && !(data.pool || []).length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">当前筛选下暂无素材。固定模板池由批量上传登记；每次发推的选图保留在发布记录中。</p> : null}

      <div className={THUMB_GRID_CLASS}>
        {(data?.pool || []).map((item) => (
          <ThumbTile
            key={item.id}
            item={{
              id: item.id,
              label: item.label || `${item.date} · ${item.slot}`,
              thumb: item.thumbUrl,
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
      <OriginalPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
