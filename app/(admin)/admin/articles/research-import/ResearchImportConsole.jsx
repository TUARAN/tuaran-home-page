'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { normalizeResearchSnapshot } from '../../../../../lib/researchDocument.mjs'

const labels = { draft: '草稿', published: '已发布', retired: '已撤回' }

export default function ResearchImportConsole() {
  const [documents, setDocuments] = useState([])
  const [selected, setSelected] = useState(0)
  const [current, setCurrent] = useState(null)
  const [ready, setReady] = useState(false)
  const [reload, setReload] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const snapshot = documents[selected]
  const key = snapshot ? `research:${snapshot.entry.category}:${snapshot.entry.slug}` : ''

  useEffect(() => {
    let active = true
    setReady(false)
    setCurrent(null)
    if (!key) return
    fetch(`/api/admin/research-documents?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '读取失败')
        if (active) { setCurrent(data.document); setReady(true) }
      })
      .catch((error) => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [key, reload])

  async function importFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage('')
    try {
      if (file.size > 32 * 1024 * 1024) throw new Error('导入包超过 32 MiB，请拆分后导入。')
      const bundle = JSON.parse(await file.text())
      if (bundle.version !== 1 || !Array.isArray(bundle.documents) || !bundle.documents.length) throw new Error('请选择调研导出工具生成的 JSON 包。')
      const seen = new Set()
      for (const item of bundle.documents) {
        const result = normalizeResearchSnapshot(item)
        if (result.error) throw new Error(`${item.sourcePath || '调研'}：${result.error}`)
        if (seen.has(result.document.contentKey)) throw new Error('导入包存在重复调研。')
        seen.add(result.document.contentKey)
      }
      setDocuments(bundle.documents); setSelected(0)
      setMessage(`已检查 ${bundle.documents.length} 篇。选择文章并核对内容后发布。`)
    } catch (error) { setMessage(error.message) }
  }

  async function save(status) {
    if (!snapshot || !ready || busy) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/research-documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: { ...snapshot, status }, expectedRevision: current?.revision || 0 }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.error === 'REVISION_CONFLICT') { setReady(false); throw new Error('其他页面已更新此调研。请重新选择文章以读取最新版本，再核对发布。') }
        throw new Error(data.error || '保存失败')
      }
      setCurrent({ revision: data.revision, status, source_hash: snapshot.sourceHash })
      setMessage(`${labels[status]}，版本 ${data.revision}。`)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <main className="mx-auto max-w-4xl space-y-5 p-6">
    <Link href="/admin/articles" className="underline">返回内容管理</Link>
    <h1 className="text-2xl font-semibold">导入调研</h1>
    <p>从 Git 导出调研快照，核对后逐篇发布。正文修改请回到 Markdown 源文件，再重新导入。</p>
    <code className="block overflow-x-auto rounded bg-gray-100 p-3 text-sm dark:bg-gray-900">node scripts/export-research-content.mjs --output /tmp/research-content.json</code>
    <label className="block">选择导出包 <input type="file" accept=".json,application/json" disabled={busy} onChange={importFile} /></label>
    {message && <p role="status" className="rounded border p-3">{message}</p>}
    {snapshot && <>
      <label className="block">选择调研 <select className="block w-full rounded border bg-transparent p-2" value={selected} disabled={busy} onChange={(event) => { setSelected(Number(event.target.value)); setMessage('') }}>
        {documents.map((item, index) => <option value={index} key={`${item.entry.category}/${item.entry.slug}`}>{item.entry.title}</option>)}
      </select></label>
      <dl className="space-y-2 break-all text-sm">
        <div>源文件：{snapshot.sourcePath}</div><div>SHA-256：{snapshot.sourceHash}</div>
        <div>当前状态：{ready ? current ? `${labels[current.status]} · 版本 ${current.revision}` : '尚未写入 D1（可能有历史归档）' : '读取中或暂时不可用'}</div>
        <div>访问路径：/articles/research/{snapshot.entry.category}/{snapshot.entry.slug}</div>
      </dl>
      {snapshot.entry.encrypted ? <p>加密调研：仅上传密文，不在此展示正文。</p> : <div className="space-y-3">
        {(snapshot.entry.variants.length ? snapshot.entry.variants : [{ id: 'body', label: '正文', content: snapshot.entry.content }]).map((variant) => <details key={variant.id} open><summary>{variant.label || variant.id}</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border p-4 text-sm">{variant.content}</pre></details>)}
      </div>}
      <div className="flex flex-wrap gap-3">
        <button className="rounded border px-4 py-2" disabled={busy} onClick={() => setReload((value) => value + 1)}>刷新发布状态</button>
        {['draft', 'published', 'retired'].map((status) => <button key={status} className="rounded border px-4 py-2 disabled:opacity-50" disabled={!ready || busy} onClick={() => save(status)}>{status === 'draft' ? '保存为草稿' : status === 'published' ? '发布当前调研' : '撤回当前调研'}</button>)}
      </div>
      <p className="text-sm">草稿和撤回状态会隐藏同一路径的历史归档。源文件哈希用于追踪版本；导入包须由可信的本地仓库生成。</p>
    </>}
  </main>
}
