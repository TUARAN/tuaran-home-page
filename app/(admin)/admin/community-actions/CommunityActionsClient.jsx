'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'

const RESULT_META = {
  success: { label: '成功', tone: 'success' },
  failed: { label: '失败', tone: 'danger' },
  skipped: { label: '跳过', tone: 'neutral' },
  limited: { label: '受限', tone: 'warning' },
}

const PLATFORM_LABEL = {
  x: 'X',
  xhs: '小红书',
}

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

export default function CommunityActionsClient() {
  const [center, setCenter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [rotating, setRotating] = useState(false)

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
    const timer = window.setInterval(refresh, 20000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function copySecret() {
    if (!center?.secret) return
    try {
      await copyText(center.secret)
      setNotice('回执密钥已复制。')
    } catch {
      setNotice('浏览器没有允许复制，请手动选择密钥。')
    }
  }

  async function regenerateSecret() {
    if (!window.confirm('重新生成后，两个插件里原来的密钥会失效，需要重新粘贴。')) return
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
      setNotice('已生成新密钥。请重新贴到两个插件的设置里。')
    } catch (rotateError) {
      setError(rotateError.message || '密钥没有换成功。')
    } finally {
      setRotating(false)
    }
  }

  const tasks = center?.tasks || []
  const devices = center?.devices || []
  const recent = center?.recent || []
  const links = center?.links || []
  const onlineCount = devices.filter((device) => device.online).length

  return (
    <AdminPage
      title="社区动作"
      description="两套高频助手在动作确认后，把回执发到公开站。这个页面用来查看，不用一直开着。开始、停止和挡位仍在插件里。"
      actions={<AdminButton onClick={refresh} disabled={loading}>刷新</AdminButton>}
    >
      {error ? <p className="mb-4 text-[13px] text-rose-700 dark:text-rose-300">{error}</p> : null}
      {notice ? <p className="mb-4 text-[13px] text-[#3f4039] dark:text-gray-200">{notice}</p> : null}
      {center?.migrationRequired ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {center.migrationRequired}
        </p>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="今日成功" value={center?.todaySuccess ?? '—'} tone="success" />
        <StatCard label="在线设备" value={loading ? '—' : onlineCount} sub="5 分钟内有心跳" tone={onlineCount ? 'info' : 'neutral'} />
        <StatCard label="最近回执" value={recent.length} sub="最多 40 条" />
      </div>

      <div className="grid gap-4">
        <Section
          title="回执密钥"
          description="复制后贴到 X 高频互动助手和小红书高频互动助手的设置里。两个插件用同一把密钥。插件直接请求 2aran.com，不经过这个页面。"
          actions={(
            <>
              <AdminButton size="sm" variant="primary" onClick={copySecret} disabled={!center?.secret}>复制</AdminButton>
              <AdminButton size="sm" variant="danger" onClick={regenerateSecret} disabled={rotating || !center?.secret}>重新生成</AdminButton>
            </>
          )}
        >
          <input
            readOnly
            value={center?.secret || ''}
            className="w-full rounded-lg border border-[#d9ddd2] bg-[#f7f8f4] px-3 py-2 font-mono text-[13px] text-[#25261f] dark:border-[#263142] dark:bg-[#10161f] dark:text-gray-100"
            aria-label="社区回执密钥"
          />
        </Section>

        <Section title="今日任务项" description="按北京时间当天统计。同一条动作只记一次确认结果。">
          {tasks.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tasks.map((task) => (
                <article key={`${task.platform}:${task.task}`} className="rounded-xl border border-[#e4e6dc] px-3 py-3 dark:border-[#263142]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-[13px] font-medium text-[#25261f] dark:text-gray-100">{task.label}</p>
                    <StatusPill size="sm" tone="neutral" icon={false}>{PLATFORM_LABEL[task.platform] || task.platform}</StatusPill>
                  </div>
                  <p className="mb-0 mt-2 text-[1.4rem] font-semibold leading-none text-emerald-700 dark:text-emerald-300">{task.success}</p>
                  <p className="mb-0 mt-2 text-[12px] leading-5 text-[#7a7c70] dark:text-gray-400">
                    失败 {task.failed} · 跳过 {task.skipped} · 受限 {task.limited}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="还没有任务项" description={loading ? '正在读取。' : '迁移完成后，这里会列出八个任务项。'} />
          )}
        </Section>

        <Section title="设备" description="每个已安装的插件有自己的设备号。账号要等页面读到登录身份后才会出现。">
          {devices.length ? (
            <ul className="m-0 grid gap-2 p-0">
              {devices.map((device) => (
                <li key={device.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e4e6dc] px-3 py-2 text-[13px] dark:border-[#263142]">
                  <span className="font-medium text-[#25261f] dark:text-gray-100">
                    {PLATFORM_LABEL[device.platform] || device.platform}
                    {device.accountHandle ? ` · @${device.accountHandle}` : ' · 账号未上报'}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-[#7a7c70] dark:text-gray-400">
                    <StatusPill size="sm" tone={device.online ? 'success' : 'neutral'}>{device.online ? '在线' : '离线'}</StatusPill>
                    <span>v{device.extensionVersion || '—'}</span>
                    <span>{formatTime(device.lastSeenAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="还没有设备" description="插件保存密钥并打开对应网站后，这里会出现心跳。" />
          )}
        </Section>

        <Section title="最近回执" description="只保留动作编号、结果和错误码，不保存正文、Cookie 或模型密钥。">
          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="text-[#7a7c70] dark:text-gray-400">
                    <th className="py-2 pr-3 font-medium">时间</th>
                    <th className="py-2 pr-3 font-medium">平台</th>
                    <th className="py-2 pr-3 font-medium">任务</th>
                    <th className="py-2 pr-3 font-medium">结果</th>
                    <th className="py-2 pr-3 font-medium">账号</th>
                    <th className="py-2 font-medium">目标</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((event) => {
                    const meta = RESULT_META[event.result] || { label: event.result, tone: 'neutral' }
                    return (
                      <tr key={event.id} className="border-t border-[#e4e6dc] dark:border-[#263142]">
                        <td className="py-2 pr-3 whitespace-nowrap">{formatTime(event.occurredAt)}</td>
                        <td className="py-2 pr-3">{PLATFORM_LABEL[event.platform] || event.platform}</td>
                        <td className="py-2 pr-3">{event.taskLabel}</td>
                        <td className="py-2 pr-3">
                          <StatusPill size="sm" tone={meta.tone}>{meta.label}</StatusPill>
                          {event.errorCode ? <span className="ml-2 text-[#7a7c70] dark:text-gray-400">{event.errorCode}</span> : null}
                        </td>
                        <td className="py-2 pr-3">{event.accountHandle ? `@${event.accountHandle}` : '—'}</td>
                        <td className="py-2 max-w-[16rem] truncate">{event.targetId || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="还没有回执" description="插件确认一条回复、评论、关注或发帖后，会出现在这里。" />
          )}
        </Section>

        <Section title="相关入口" description="这些动作先挂在同一个中心旁边。执行方式保持原样，回执以后再并进这本账。">
          <ul className="m-0 grid gap-2 p-0">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="block rounded-lg border border-[#e4e6dc] px-3 py-2 no-underline hover:border-[#b9bbad] dark:border-[#263142] dark:hover:border-[#34414f]">
                  <span className="block text-[13px] font-medium text-[#25261f] dark:text-gray-100">{link.label}</span>
                  <span className="block text-[12px] leading-5 text-[#7a7c70] dark:text-gray-400">{link.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </AdminPage>
  )
}
