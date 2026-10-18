'use client'

import { useEffect, useRef, useState } from 'react'
import AdminPage from '../../../components/ui/AdminPage'
import PrivateTextNotes from './PrivateTextNotes'

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
}

export default function PrivateDocumentsConsole() {
  const [view, setView] = useState('notes')
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [recordId, setRecordId] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const initialRecordId = new URLSearchParams(window.location.search).get('recordId') || ''
    setRecordId(initialRecordId)
    const url = initialRecordId ? `/api/admin/private-documents?recordId=${encodeURIComponent(initialRecordId)}` : '/api/admin/private-documents'
    fetch(url, { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '读取失败')
        return data.items || []
      })
      .then((loaded) => { setItems(loaded); setSelectedId(loaded[0]?.id || ''); setStatus('ok') })
      .catch((error) => { setMessage(error.message); setStatus('error') })
  }, [])

  async function upload(event) {
    event.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setMessage('请选择 PDF 文件。')
    setBusy(true)
    setMessage('')
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('title', title)
      form.set('recordId', recordId)
      const response = await fetch('/api/admin/private-documents', { method: 'POST', credentials: 'same-origin', body: form })
      const data = await response.json()
      if (!response.ok || !data.item) throw new Error(data.error || `HTTP ${response.status}`)
      setItems((current) => [data.item, ...current])
      setSelectedId(data.item.id)
      setTitle('')
      if (fileRef.current) fileRef.current.value = ''
      setMessage('已保存到私密文档目录。')
    } catch (error) {
      setMessage(`上传失败：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const selected = items.find((item) => item.id === selectedId)
  return (
    <AdminPage title="私密文档" description="在后台写私人文字记录，也可保存仅站长能预览的 PDF。">
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="私密文档类型">
        <button type="button" role="tab" aria-selected={view === 'notes'} onClick={() => setView('notes')} className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'notes' ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#10161f]' : 'border border-[#d5d7cd] dark:border-[#343d48]'}`}>文字记录</button>
        <button type="button" role="tab" aria-selected={view === 'files'} onClick={() => setView('files')} className={`rounded-lg px-4 py-2 text-sm font-medium ${view === 'files' ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#10161f]' : 'border border-[#d5d7cd] dark:border-[#343d48]'}`}>PDF 文件</button>
      </div>
      {view === 'notes' ? <PrivateTextNotes /> : <>
      <form onSubmit={upload} className="mb-6 grid gap-3 rounded-xl border border-[#d5d7cd] bg-white p-4 dark:border-[#252e39] dark:bg-[#10161f] sm:grid-cols-2">
        <label className="text-sm">标题<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="留空使用文件名" className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-[#10161f]" /></label>
        <label className="text-sm">关联私密记录 ID<input value={recordId} onChange={(event) => setRecordId(event.target.value)} inputMode="numeric" placeholder="可留空" className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-[#10161f]" /></label>
        <label className="text-sm sm:col-span-2">PDF 文件<input ref={fileRef} type="file" accept="application/pdf,.pdf" required className="mt-1 block w-full text-sm" /></label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-[#15140f] px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-gray-100 dark:text-[#10161f]">{busy ? '上传中…' : '保存私密文档'}</button>
          <span className="text-xs text-[#67695d] dark:text-gray-400">仅 PDF，最大 20 MB；不会生成公开文件地址。</span>
        </div>
      </form>
      {message ? <p role="status" className="mb-4 text-sm">{message}</p> : null}
      {status === 'loading' ? <p>正在读取私密文档…</p> : status === 'error' ? <p>私密文档暂不可用。</p> : items.length === 0 ? <p>还没有私密文档。</p> : (
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-2" aria-label="私密文档列表">
            {items.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-lg border p-3 text-left text-sm dark:border-[#252e39] ${selectedId === item.id ? 'border-[#8a7045] bg-[#f7f2e8] dark:bg-[#20251f]' : 'border-[#d5d7cd] bg-white dark:bg-[#10161f]'}`}>
              <span className="block font-medium">{item.title}</span>
              <span className="mt-1 block text-xs text-[#67695d] dark:text-gray-400">{item.fileName} · {formatSize(item.sizeBytes)}{item.recordId ? ` · 记录 #${item.recordId}` : ''}</span>
            </button>)}
          </div>
          <div className="min-h-[680px] rounded-xl border border-[#d5d7cd] bg-white dark:border-[#252e39] dark:bg-[#10161f]">
            {selected ? <iframe key={selected.id} title={selected.title} src={selected.previewUrl} className="h-[75vh] min-h-[680px] w-full rounded-xl" referrerPolicy="no-referrer" /> : <p className="p-6 text-sm text-[#67695d]">选择左侧文档预览。</p>}
          </div>
        </div>
      )}
      </>}
    </AdminPage>
  )
}
