'use client'
import { useEffect, useState } from 'react'
import { AdminButton, StatusPill } from '../../components/ui'
const endpoint = '/api/admin/syncblog-download'
export default function SyncblogDownloadPanel() {
  const [status, setStatus] = useState(null)
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
  return (
    <div className="p-3">
      <div className="scroll-mt-24 space-y-5 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill size="sm" tone={status?.ready ? 'success' : 'neutral'} icon={false}>
            {!status ? '正在读取配置' : status.ready ? '可下载' : '待配置'}
          </StatusPill>
          <span className="text-[#5f6156] dark:text-gray-300">{status?.fileName || '尚未上传安装包'}</span>
        </div>
        <p className="m-0 leading-6 text-[#5f6156] dark:text-gray-300">读者添加微信 atar24 后，由站长提供下载密码。请先上传 ZIP 安装包，再生成密码。</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <form className="space-y-3" onSubmit={event => { event.preventDefault(); update('PUT', new FormData(event.currentTarget)) }}>
            <label className="block font-medium text-[#25261f] dark:text-gray-100" htmlFor="syncblog-package">安装包（ZIP，最多 25 MB）</label>
            <input id="syncblog-package" name="file" type="file" accept=".zip" required disabled={busy || !status} className="block w-full min-w-0 rounded-lg border border-[#d9ddd2] bg-[#f7f8f4] p-2 text-[13px] file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-1 file:text-[13px] dark:border-[#263142] dark:bg-[#10161f] dark:text-gray-100 dark:file:bg-[#263142] dark:file:text-gray-100" />
            <AdminButton type="submit" variant="primary" disabled={busy || !status}>{busy ? '处理中…' : '上传并替换安装包'}</AdminButton>
          </form>
          <div className="space-y-3">
            <p className="m-0 font-medium text-[#25261f] dark:text-gray-100">下载密码</p>
            <p className="m-0 leading-6 text-[#5f6156] dark:text-gray-300">{status?.passwordUpdatedAt ? '已设置密码。更新后，已发出的旧密码立即失效。' : '尚未生成密码。新密码仅在生成后显示，请及时保存。'}</p>
            <AdminButton type="button" disabled={busy || !status} onClick={() => update('POST')}>{status?.passwordUpdatedAt ? '更新下载密码' : '生成下载密码'}</AdminButton>
            {password ? <div><label htmlFor="syncblog-password">新密码（请复制保存）</label><input id="syncblog-password" readOnly value={password} className="mt-2 block w-full rounded-lg border border-[#d9ddd2] bg-[#f7f8f4] px-3 py-2 font-mono text-[13px] text-[#25261f] dark:border-[#263142] dark:bg-[#10161f] dark:text-gray-100" onFocus={event => event.target.select()} /></div> : null}
          </div>
        </div>
        {notice ? <p role="status" className="m-0 leading-6 text-[#5f6156] dark:text-gray-300">{notice}</p> : null}
      </div>
    </div>
  )
}
