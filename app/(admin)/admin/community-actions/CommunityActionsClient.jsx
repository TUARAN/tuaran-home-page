'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'
import MorningGreetingClient from '../morning-greeting/MorningGreetingClient'
import XReplyTasksClient from '../x-replies/XReplyTasksClient'
import DeepSeekKeysPanel from '../deepseek-tasks/DeepSeekKeysPanel'
import CommunityOperationsPlan from './CommunityOperationsPlan'

const PLATFORM_LABEL = {
  x: 'X',
  xhs: '小红书',
  juejin: '掘金',
}

const MODE_TABS = Object.freeze([
  { id: 'overview', label: '总览' },
  { id: 'plan', label: '实践计划' },
  { id: 'extension', label: '浏览器插件' },
  { id: 'cloud', label: '纯云端' },
  { id: 'api', label: '模型 API 密钥' },
])

const CLOUD_PANELS = Object.freeze([
  { id: 'x-publish', label: 'X 发布' },
  { id: 'x-reply', label: 'X 回复' },
])

const CLOUD_PANEL_IDS = new Set(CLOUD_PANELS.map((item) => item.id))

const EXTENSION_TASKS = Object.freeze([
  {
    id: 'x-assistant',
    platform: 'x',
    label: 'X 高频互动助手',
    summary: '评论帖子、回复评论、关注管理、定时发帖。开始和频率在插件里设置；运行状态与确认结果在插件监控查看。',
    href: '/resources/x-reply-clipboard-extension',
  },
  {
    id: 'xhs-assistant',
    platform: 'xhs',
    label: '小红书高频互动助手',
    summary: '推荐评论和笔记浇给。依赖本机已登录的小红书标签页。',
  },
  {
    id: 'juejin-assistant',
    platform: 'juejin',
    label: '掘金高频互动助手',
    summary: '默认每天最多发布 3 条沸点、保存 3 篇文章草稿；可切换高频自动发布模式。开发测试中，在本机加载插件源码目录。',
    sourcePath: 'tools/juejin-interaction-extension',
  },
])

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

const INVITE_STATUS_LABEL = {
  downloadable: '可下载',
  bound: '已绑设备',
  revoked: '已作废',
}

function PersonInvitesPanel() {
  const [invites, setInvites] = useState([])
  const [label, setLabel] = useState('')
  const [freshCode, setFreshCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const response = await fetch('/api/admin/community-actions/person-invites', { cache: 'no-store', credentials: 'same-origin' })
    const data = await safeJson(response)
    if (!response.ok) throw new Error(data?.migrationRequired || data?.error || '列表读取失败')
    setInvites(Array.isArray(data?.invites) ? data.invites : [])
  }, [])

  useEffect(() => {
    let mounted = true
    refresh()
      .catch((refreshError) => { if (mounted) setError(refreshError.message || '人员码暂时无法读取。') })
    return () => { mounted = false }
  }, [refresh])

  async function createInvite() {
    if (busy) return
    setBusy(true)
    setNotice('')
    setError('')
    try {
      const response = await fetch('/api/admin/community-actions/person-invites', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'create', label }),
      })
      const data = await safeJson(response)
      if (!response.ok || !data?.code) throw new Error(data?.error || '生成失败')
      setFreshCode(data.code)
      setLabel('')
      await refresh()
      setNotice('新人码已生成：先可下载，首次心跳后变为设备码并禁止再下。请立即复制，刷新后无法再看明文。')
    } catch (createError) {
      setError(createError.message || '生成失败。')
    } finally {
      setBusy(false)
    }
  }

  async function runAction(action, id, confirmText) {
    if (busy || !window.confirm(confirmText)) return
    setBusy(true)
    setNotice('')
    setError('')
    try {
      const response = await fetch('/api/admin/community-actions/person-invites', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, id }),
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(data?.error || '操作失败')
      await refresh()
      setNotice(action === 'reset' ? '已重置为可下载，旧设备绑定已清空。' : '已作废该人员码。')
    } catch (actionError) {
      setError(actionError.message || '操作失败。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 min-w-0 max-w-full rounded-lg border border-[#d9ddd2] bg-[#f7f8f4] p-3 dark:border-[#263142] dark:bg-[#10161f]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13px] font-semibold text-[#25261f] dark:text-gray-100">人员码（一人一码）</p>
          <p className="mb-0 mt-1 text-[12px] leading-5 text-[#6d7066] dark:text-gray-400">先作下载凭证并写入 ZIP；对方首次心跳后转为设备码，不能再下载。站长总密钥不受影响。</p>
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="备注（人名）"
          aria-label="人员码备注"
          className="min-w-[10rem] flex-1 rounded-lg border border-[#d9ddd2] bg-white px-3 py-2 text-[13px] text-[#25261f] dark:border-[#263142] dark:bg-[#0b111a] dark:text-gray-100"
        />
        <AdminButton size="sm" variant="primary" onClick={createInvite} disabled={busy}>{busy ? '处理中…' : '生成人员码'}</AdminButton>
        <AdminButton size="sm" onClick={() => refresh().catch((refreshError) => setError(refreshError.message || '刷新失败'))} disabled={busy}>刷新</AdminButton>
      </div>
      {freshCode ? (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input readOnly value={freshCode} aria-label="新生成的人员码" className="col-span-2 min-w-0 w-full rounded-lg border border-[#d9ddd2] bg-white px-3 py-2 font-mono text-[13px] text-[#25261f] dark:border-[#263142] dark:bg-[#0b111a] dark:text-gray-100 sm:col-span-1" />
          <AdminButton size="sm" onClick={async () => { try { await copyText(freshCode); setNotice('人员码已复制。') } catch { setNotice('复制失败，请手动选中。') } }}>复制</AdminButton>
          <AdminButton size="sm" variant="ghost" onClick={() => setFreshCode('')}>隐藏</AdminButton>
        </div>
      ) : null}
      {invites.length ? (
        <ul className="mb-0 mt-3 grid gap-2 p-0">
          {invites.map((item) => (
            <li key={item.id} className="min-w-0 rounded-lg border border-[#e4e6dc] bg-white px-3 py-2 dark:border-[#263142] dark:bg-[#0b111a]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="m-0 text-[13px] font-medium text-[#25261f] dark:text-gray-100">{item.label || '未命名'}</p>
                  <p className="mb-0 mt-1 text-[12px] text-[#6d7066] dark:text-gray-400">
                    {INVITE_STATUS_LABEL[item.status] || item.status}
                    {item.deviceId ? ` · 设备 ${item.deviceId.slice(0, 10)}…` : ''}
                    {item.accountHandle ? ` · @${item.accountHandle}` : ''}
                    {` · 下载 ${item.downloadCount || 0} 次`}
                    {item.lastSeenAt ? ` · 最近 ${formatTime(item.lastSeenAt)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status !== 'downloadable' ? (
                    <AdminButton size="sm" onClick={() => runAction('reset', item.id, '重置后可再次下载，旧设备绑定会清空。确定吗？')} disabled={busy}>重置可下</AdminButton>
                  ) : null}
                  {item.status !== 'revoked' ? (
                    <AdminButton size="sm" variant="danger" onClick={() => runAction('revoke', item.id, '作废后不可下载也不可回执。确定吗？')} disabled={busy}>作废</AdminButton>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0 mt-3 text-[12px] text-[#6d7066] dark:text-gray-400">还没有人员码。</p>
      )}
      {notice ? <p role="status" className="mb-0 mt-2 text-[12px] text-[#5f6156] dark:text-gray-300">{notice}</p> : null}
      {error ? <p role="alert" className="mb-0 mt-2 text-[12px] text-rose-700 dark:text-rose-300">{error}</p> : null}
    </div>
  )
}

function resolveView(searchParams) {
  const raw = String(searchParams.get('tab') || '').trim()
  if (raw === 'extension' || raw === 'receipts') {
    return { mode: 'extension', panel: 'x-publish' }
  }
  if (raw === 'api') return { mode: 'api', panel: 'x-publish' }
  if (raw === 'plan') return { mode: 'plan', panel: 'x-publish' }
  if (CLOUD_PANEL_IDS.has(raw)) {
    return { mode: 'cloud', panel: raw }
  }
  if (raw === 'cloud') {
    const panel = String(searchParams.get('panel') || '').trim()
    return { mode: 'cloud', panel: CLOUD_PANEL_IDS.has(panel) ? panel : 'x-publish' }
  }
  return { mode: 'overview', panel: 'x-publish' }
}

function ReceiptsPanel({ center, loading, error, notice, rotating, onRefresh, onCopySecret, onRegenerateSecret }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      {error ? <p className="mb-0 text-[13px] text-rose-700 dark:text-rose-300">{error}</p> : null}
      {notice ? <p className="mb-0 text-[13px] text-[#3f4039] dark:text-gray-200">{notice}</p> : null}
      {center?.migrationRequired ? (
        <p className="mb-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {center.migrationRequired}
        </p>
      ) : null}

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe3dd] bg-[#f3f8f5] px-4 py-3 dark:border-[#244238] dark:bg-[#10251f]">
        <p className="m-0 text-[13px] leading-6 text-[#315748] dark:text-emerald-200">X、小红书和掘金的设备状态、日期统计与回执统一在插件监控查看。</p>
        <div className="flex flex-wrap gap-2"><AdminButton href="/admin/community-actions/monitor" variant="primary">插件监控</AdminButton><AdminButton onClick={onRefresh} disabled={loading}>刷新</AdminButton></div>
      </div>

      <Section
        title="站长总密钥"
        description="仅站长本机使用：永久可下载、永久鉴权回执，不绑设备。重新生成只影响站长机器，不影响已发人员码。"
        actions={(
          <>
            <AdminButton size="sm" variant="primary" onClick={onCopySecret} disabled={!center?.secret}>复制</AdminButton>
            <AdminButton size="sm" variant="danger" onClick={onRegenerateSecret} disabled={rotating || !center?.secret}>重新生成</AdminButton>
          </>
        )}
      >
        <input
          readOnly
          value={center?.secret || ''}
          className="block min-w-0 w-full max-w-full rounded-lg border border-[#d9ddd2] bg-[#f7f8f4] px-3 py-2 font-mono text-[13px] text-[#25261f] dark:border-[#263142] dark:bg-[#10161f] dark:text-gray-100"
          aria-label="站长总密钥"
        />
      </Section>

      <Section title="插件任务" description="这些动作必须在本机 Chrome 登录态下执行，云端不能代替。">
        <ul className="m-0 grid gap-2 p-0">
          {EXTENSION_TASKS.map((item) => (
            <li key={item.id} id={item.id} className="min-w-0 rounded-lg border border-[#e4e6dc] px-3 py-3 dark:border-[#263142]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-[13px] font-medium text-[#25261f] dark:text-gray-100">{item.label}</p>
                <StatusPill size="sm" tone="neutral" icon={false}>{PLATFORM_LABEL[item.platform] || item.platform}</StatusPill>
              </div>
              <p className="mb-0 mt-2 break-words text-[12px] leading-5 text-[#7a7c70] dark:text-gray-400">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminButton size="sm" href={`/admin/community-actions/monitor?platform=${item.platform}`}>查看监控</AdminButton>
                {item.href ? <AdminButton size="sm" variant="ghost" href={item.href}>插件下载页</AdminButton> : null}
              </div>
              {item.id === 'x-assistant' ? <PersonInvitesPanel /> : null}
              {item.sourcePath ? <code className="mt-2 block text-[12px] text-[#5f6156] dark:text-gray-300">{item.sourcePath}</code> : null}
            </li>
          ))}
        </ul>
      </Section>

    </div>
  )
}

function OverviewPanel({ onOpenMode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section
        title="M1 常驻实践计划"
        description="按试运行、监控、恢复、修正发布和采购复盘推进；每阶段以证据和验收结果收口。"
        actions={<AdminButton size="sm" variant="primary" onClick={() => onOpenMode('plan')}>查看计划</AdminButton>}
        className="lg:col-span-2"
      >
        <p className="m-0 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300">先使用闲置 M1 和 NAS 验证 7 天，确认网络、浏览器与平台任务的实际故障，再决定是否购买 Mac mini。</p>
      </Section>
      <Section
        title="浏览器插件"
        description="依赖本机 Chrome 登录态。开始、停止和挡位在插件里；运行状态与确认回执统一在插件监控查看。"
        actions={<><AdminButton size="sm" href="/admin/community-actions/monitor">插件监控</AdminButton><AdminButton size="sm" variant="primary" onClick={() => onOpenMode('extension')}>打开插件台</AdminButton></>}
      >
        <p className="m-0 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300">插件监控按平台查看设备状态、历史趋势和确认回执；X 的自动同步日报也在那里查看。插件台管理共用密钥。</p>
        <ul className="mb-0 mt-4 grid gap-2 p-0 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300">
          <li>X 高频互动助手：评论、点赞、关注管理、定时发帖</li>
          <li>小红书高频互动助手：推荐评论、笔记浇给</li>
          <li>掘金高频互动助手：每日签到、沸点和文章；支持每日上限与高频两种模式</li>
        </ul>
      </Section>

      <Section
        title="纯云端"
        description="不依赖本机插件常开。由 Cloudflare、GitHub Actions 和 X API 执行，后台可直接暂停或人工确认。"
        actions={<AdminButton size="sm" variant="primary" onClick={() => onOpenMode('cloud')}>打开云端台</AdminButton>}
      >
        <ul className="m-0 grid gap-3 p-0">
          {CLOUD_PANELS.map((item) => (
            <li key={item.id} className="rounded-lg border border-[#e4e6dc] px-3 py-3 dark:border-[#263142]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-[13px] font-medium text-[#25261f] dark:text-gray-100">{item.label}</p>
                <StatusPill size="sm" tone="info" icon={false}>云端</StatusPill>
              </div>
              <p className="mb-0 mt-2 text-[12px] leading-5 text-[#7a7c70] dark:text-gray-400">
                {item.id === 'x-publish'
                  ? '定时生成并发布短帖，走网站侧 X API。'
                  : '录入目标帖、准备短回复，人工确认后再走 X API。'}
              </p>
              <div className="mt-3">
                <AdminButton size="sm" variant="ghost" onClick={() => onOpenMode('cloud', item.id)}>进入</AdminButton>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="模型 API 密钥"
        description="查看、复制和管理模型服务密钥，包括插件使用的 DeepSeek、B.AI 密钥及站点任务密钥。"
        actions={<AdminButton size="sm" variant="primary" onClick={() => onOpenMode('api')}>打开密钥管理</AdminButton>}
      >
        <p className="mb-0 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300">数据库密钥与当前 Admin 环境变量可按需查看和复制。X 插件的 B.AI 密钥用于回复回退，需单独粘贴到插件设置；小红书和掘金插件使用 DeepSeek。</p>
      </Section>
    </div>
  )
}

export default function CommunityActionsClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = resolveView(searchParams)

  const [center, setCenter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [rotating, setRotating] = useState(false)

  const openMode = useCallback((mode, panel = 'x-publish') => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('panel')
    if (mode === 'overview') {
      params.delete('tab')
    } else if (mode === 'plan') {
      params.set('tab', 'plan')
    } else if (mode === 'extension') {
      params.set('tab', 'extension')
    } else if (mode === 'api') {
      params.set('tab', 'api')
    } else if (CLOUD_PANEL_IDS.has(panel)) {
      params.set('tab', panel)
    } else {
      params.set('tab', 'cloud')
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/community-actions', { cache: 'no-store', credentials: 'same-origin' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setCenter(payload)
      setError('')
    } catch (refreshError) {
      setError(refreshError.message === 'DB_UNAVAILABLE' ? '当前环境没有数据库，回执还写不进来。' : (refreshError.message || '读取失败。'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function copySecret() {
    if (!center?.secret) return
    try {
      await copyText(center.secret)
      setNotice('站长总密钥已复制。')
    } catch {
      setNotice('浏览器没有允许复制，请手动选择密钥。')
    }
  }

  async function regenerateSecret() {
    if (!window.confirm('重新生成只更换站长总密钥，已发人员码不受影响。站长本机需要改贴新密钥。确定继续吗？')) return
    setRotating(true)
    setNotice('')
    try {
      const response = await fetch('/api/admin/community-actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'regenerate-secret' }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setCenter((current) => ({ ...(current || {}), secret: payload.secret }))
      setNotice('站长总密钥已更新。请贴到站长本机插件设置；人员码无需改动。')
    } catch (rotateError) {
      setError(rotateError.message || '密钥没有换成功。')
    } finally {
      setRotating(false)
    }
  }

  return (
    <AdminPage
      title="社区动作"
      description="先按执行方式分开：浏览器插件依赖本机登录态；纯云端走网站 API 和定时任务。"
    >
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="社区动作执行方式">
        {MODE_TABS.map((item) => {
          const active = view.mode === item.id
          return (
            <AdminButton
              key={item.id}
              type="button"
              role="tab"
              variant={active ? 'default' : 'ghost'}
              aria-selected={active}
              onClick={() => openMode(item.id)}
            >
              {item.label}
            </AdminButton>
          )
        })}
      </div>

      {view.mode === 'overview' ? (
        <OverviewPanel onOpenMode={openMode} />
      ) : null}

      {view.mode === 'plan' ? <CommunityOperationsPlan /> : null}

      {view.mode === 'extension' ? (
        <ReceiptsPanel
          center={center}
          loading={loading}
          error={error}
          notice={notice}
          rotating={rotating}
          onRefresh={refresh}
          onCopySecret={copySecret}
          onRegenerateSecret={regenerateSecret}
        />
      ) : null}

      {view.mode === 'api' ? <DeepSeekKeysPanel /> : null}


      {view.mode === 'cloud' ? (
        <div className="grid min-w-0 gap-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="纯云端任务">
            {CLOUD_PANELS.map((item) => {
              const active = view.panel === item.id
              return (
                <AdminButton
                  key={item.id}
                  type="button"
                  role="tab"
                  size="sm"
                  variant={active ? 'default' : 'ghost'}
                  aria-selected={active}
                  onClick={() => openMode('cloud', item.id)}
                >
                  {item.label}
                </AdminButton>
              )
            })}
          </div>
          <p className="mb-0 text-[13px] leading-6 text-[#5f6156] dark:text-gray-300">
            这些任务不依赖本机插件。页面关掉后，定时发布仍会按计划跑；回复仍需人工确认后才发。
          </p>
          {view.panel === 'x-publish' ? <MorningGreetingClient embedded /> : null}
          {view.panel === 'x-reply' ? <XReplyTasksClient embedded /> : null}
        </div>
      ) : null}
    </AdminPage>
  )
}
