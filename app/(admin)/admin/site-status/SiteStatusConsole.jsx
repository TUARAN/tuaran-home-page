'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'

const EMPTY_FORM = {
  status: 'degraded',
  severity: 'warning',
  message: '',
  detail: '',
  affectedServices: '',
}

const STATUS_LABELS = {
  operational: '运行正常',
  degraded: '部分异常',
  outage: '服务中断',
  maintenance: '计划维护',
}

function formatTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusTone(status) {
  if (status === 'operational') return 'success'
  if (status === 'outage') return 'danger'
  return 'warning'
}

export default function SiteStatusConsole() {
  const [data, setData] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/site-status', { cache: 'no-store', credentials: 'same-origin' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || '读取失败')
      setData(payload)
    } catch (loadError) {
      setError(loadError.message || '读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (payload) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/site-status', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || '保存失败')
      setNotice(payload.status === 'operational' ? '公告已解除。' : '公告已发布。')
      setForm(EMPTY_FORM)
      await load()
    } catch (saveError) {
      setError(saveError.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const current = data?.current
  const health = data?.health
  const monitor = data?.monitor
  const inputClass = 'mt-1.5 w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-sm text-[#15140f] outline-none focus:border-[#7f8863] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'

  return (
    <AdminPage title="故障公告" description="故障状态保存在独立 R2 中；D1 异常时，公开页面仍然可以读取公告。">
      <div className="space-y-5">
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div> : null}
        {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{notice}</div> : null}

        <Section title="当前公开状态" actions={<AdminButton size="sm" onClick={load} disabled={loading}>刷新</AdminButton>}>
          {loading && !current ? <p className="text-sm text-[#67695d] dark:text-gray-400">正在读取状态…</p> : (
            <div className="grid gap-4 md:grid-cols-4">
              <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">公开状态</p><div className="mt-2"><StatusPill tone={statusTone(current?.status)}>{STATUS_LABELS[current?.status] || '未知'}</StatusPill></div></div>
              <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">来源</p><p className="mt-2 text-sm font-medium">{current?.source === 'automatic' ? '自动探测' : current?.source === 'manual' ? '人工发布' : '系统默认'}</p></div>
              <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">开始时间</p><p className="mt-2 text-sm font-medium">{formatTime(current?.startedAt)}</p></div>
              <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">更新时间</p><p className="mt-2 text-sm font-medium">{formatTime(current?.updatedAt)}</p></div>
            </div>
          )}
          {current?.active ? (
            <div className="mt-4 rounded-lg bg-[#f4f3ed] px-4 py-3 dark:bg-[#151c26]">
              <p className="font-semibold">{current.message}</p>
              {current.detail ? <p className="mt-1 text-sm text-[#67695d] dark:text-gray-400">{current.detail}</p> : null}
            </div>
          ) : null}
        </Section>

        <Section title="健康探测" description="连续 3 次失败自动发布公告，连续 3 次成功自动解除；人工公告不会被自动探测覆盖。">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">D1</p><div className="mt-2"><StatusPill tone={health?.components?.database?.status === 'ok' ? 'success' : 'danger'}>{health?.components?.database?.status === 'ok' ? '连接正常' : '连接异常'}</StatusPill></div></div>
            <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">连续失败</p><p className="mt-2 font-mono text-lg">{monitor?.consecutiveFailures ?? 0}</p></div>
            <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">连续成功</p><p className="mt-2 font-mono text-lg">{monitor?.consecutiveSuccesses ?? 0}</p></div>
            <div><p className="text-xs text-[#7a7c70] dark:text-gray-500">最近探测</p><p className="mt-2 text-sm font-medium">{formatTime(monitor?.lastCheckedAt)}</p></div>
          </div>
          <p className="mb-0 mt-4 text-xs leading-6 text-[#7a7c70] dark:text-gray-500">
            外部调度器定时 POST <code>/api/site-status/monitor</code>，请求头使用 <code>x-site-status-secret</code>。Cloudflare Secret 配置为 <code>SITE_STATUS_MONITOR_SECRET</code>。
          </p>
        </Section>

        <Section title="人工发布" description="用于计划维护、已知故障或自动探测尚未覆盖的问题。">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              save({
                ...form,
                affectedServices: form.affectedServices.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
              })
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">公告类型
                <select className={inputClass} value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))}>
                  <option value="degraded">部分异常</option>
                  <option value="outage">服务中断</option>
                  <option value="maintenance">计划维护</option>
                </select>
              </label>
              <label className="text-sm font-medium">提醒级别
                <select className={inputClass} value={form.severity} onChange={(event) => setForm((value) => ({ ...value, severity: event.target.value }))}>
                  <option value="warning">警告</option>
                  <option value="critical">严重</option>
                  <option value="info">提示</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">公告标题
              <input required maxLength={160} className={inputClass} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} placeholder="例如：数据库服务异常，评论功能暂时不可用" />
            </label>
            <label className="block text-sm font-medium">补充说明
              <textarea maxLength={500} rows={3} className={inputClass} value={form.detail} onChange={(event) => setForm((value) => ({ ...value, detail: event.target.value }))} placeholder="说明处理进度或预计恢复时间，可留空" />
            </label>
            <label className="block text-sm font-medium">受影响服务
              <input className={inputClass} value={form.affectedServices} onChange={(event) => setForm((value) => ({ ...value, affectedServices: event.target.value }))} placeholder="数据库、登录、评论（使用逗号分隔）" />
            </label>
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="primary" type="submit" disabled={saving}>{saving ? '发布中…' : '发布公告'}</AdminButton>
              <AdminButton type="button" onClick={() => save({ status: 'operational' })} disabled={saving || !current?.active}>解除公告</AdminButton>
            </div>
          </form>
        </Section>
      </div>
    </AdminPage>
  )
}
