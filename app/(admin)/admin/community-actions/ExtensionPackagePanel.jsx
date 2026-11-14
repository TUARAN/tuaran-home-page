'use client'
import { useCallback, useEffect, useState } from 'react'
import { AdminButton, StatusPill } from '../../components/ui'
const OPTIONS = {
  x: { href: '/resources/x-reply-clipboard-extension', docs: '/resources/x-reply-clipboard-extension/docs' },
  'ai-distributor': { href: '/tools/syncblog-publisher', docs: '/tools/syncblog-publisher/docs' },
}
export default function ExtensionPackagePanel({ pluginId }) {
  const [release, setRelease] = useState(null), [error, setError] = useState('')
  const endpoint = `/api/admin/community-actions/extension-package?plugin=${pluginId}`
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/community-actions/extension-package?plugin=${pluginId}`, { cache: 'no-store', credentials: 'same-origin' })
      const data = await response.json()
      if (!response.ok) throw new Error('暂时无法确认安装包状态，请稍后刷新。')
      setRelease(data); setError('')
    } catch (e) { setError(e.message) }
  }, [pluginId])
  useEffect(() => { refresh() }, [refresh])
  const links = OPTIONS[pluginId]
  return <div className="mt-3 space-y-3">
    <div className="flex flex-wrap items-center gap-2 text-xs"><StatusPill size="sm" tone={release?.ready ? 'success' : 'neutral'} icon={false}>{release?.ready ? '已打包 · 可下载' : release ? '安装包同步中' : '正在确认安装包'}</StatusPill>{release && <span className="text-[#6d7066] dark:text-gray-400">v{release.version} · {(release.size / 1024 / 1024).toFixed(1)} MB</span>}<AdminButton size="sm" variant="ghost" onClick={refresh}>刷新</AdminButton></div>
    <div className="flex flex-wrap gap-2">
      {release?.ready ? <AdminButton size="sm" variant="primary" href={`${endpoint}&download=1`} download={release.fileName} prefetch={false}>站长下载</AdminButton> : <AdminButton size="sm" variant="primary" disabled>站长下载</AdminButton>}
      <AdminButton size="sm" href={`/admin/community-actions/monitor?platform=${pluginId}`}>查看监控</AdminButton>
      <AdminButton size="sm" variant="ghost" href={links.href}>插件下载页</AdminButton>
      <AdminButton size="sm" variant="ghost" href={links.docs}>黄皮书</AdminButton>
    </div>
    <p className="m-0 text-xs leading-5 text-[#6d7066] dark:text-gray-400">安装包已自动打包。站长直接下载；分发给其他人时，提供上方生成的人员码，下载时会自动写入安装包，首次心跳后绑定设备。</p>
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
  </div>
}
