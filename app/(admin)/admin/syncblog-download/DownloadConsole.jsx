'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
const endpoint = '/api/admin/syncblog-download'
export default function DownloadConsole() {
  const [status, setStatus] = useState({})
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    fetch(endpoint).then(async response => {
      if (!response.ok) throw new Error('读取配置失败')
      setStatus(await response.json())
    }).catch(error => setNotice(error.message))
  }, [])
  async function update(method, body) {
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch(endpoint, { method, body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '操作失败')
      setStatus(data)
      if (data.password) setPassword(data.password)
      setNotice(method === 'PUT' ? '安装包已保存到私有存储。' : '新密码已生效，旧密码立即失效。请复制保存，刷新后无法查看。')
    } catch (error) { setNotice(error.message) } finally { setBusy(false) }
  }
  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <h1 className="text-2xl font-bold">AI 分发大师 · VIP 下载管理</h1>
    <p>读者扫码添加微信 atar24 后，由你提供下载密码。安装包仅通过密码验证接口交付。</p>
    <p>当前状态：{status.ready ? '可以下载' : '请上传安装包并生成密码'} · {status.fileName || '尚未上传'}</p>
    <form className="space-y-3 rounded-xl border p-5" onSubmit={event => { event.preventDefault(); update('PUT', new FormData(event.currentTarget)) }}>
      <label className="block" htmlFor="package">安装包（ZIP，最多 25 MB）</label>
      <input id="package" name="file" type="file" accept=".zip" required disabled={busy} />
      <button disabled={busy} className="block rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">上传并替换安装包</button>
    </form>
    <section className="space-y-3 rounded-xl border p-5">
      <p>更新密码后，已发出的旧密码将无法下载。</p>
      <button type="button" disabled={busy} onClick={() => update('POST')} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{status.passwordUpdatedAt ? '更新下载密码' : '生成下载密码'}</button>
      {password ? <div><label htmlFor="generated-password">新密码（请复制保存）</label><input id="generated-password" readOnly value={password} className="mt-2 w-full rounded border p-3 text-slate-900" onFocus={event => event.target.select()} /></div> : null}
    </section>
    {notice ? <p role="status">{notice}</p> : null}
    <Link href="/tools/syncblog-publisher" className="underline">查看公开下载页</Link>
  </main>
}
