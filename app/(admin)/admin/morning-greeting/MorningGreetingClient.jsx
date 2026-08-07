'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'

const inputClass =
  'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-5 text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', { hour12: false })
}

export default function MorningGreetingClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [drafts, setDrafts] = useState({})
  const [newText, setNewText] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/morning-greeting', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || '问早模板读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const templates = data?.templates || []
  const lastRun = data?.lastRun || null
  const stats = data?.stats || {}

  async function saveTemplate(template, { text, enabled }) {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          text: text ?? template.text,
          enabled,
          sortOrder: template.sortOrder,
        }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice('模板已保存。')
      await refresh()
    } catch (saveError) {
      setError(saveError?.message || '保存失败。')
    } finally {
      setSaving(false)
    }
  }

  async function addTemplate(event) {
    event.preventDefault()
    if (!newText.trim()) {
      setError('文案不能为空。')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: newText,
          enabled: true,
          sortOrder: templates.length,
        }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice('已新增模板。')
      setNewText('')
      await refresh()
    } catch (addError) {
      setError(addError?.message || '新增失败。')
    } finally {
      setSaving(false)
    }
  }

  async function removeTemplate(template) {
    if (!window.confirm('确认删除这条文案？删除后不会再被随机选中。')) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/morning-greeting?id=${template.id}`, { method: 'DELETE' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setNotice('已删除。')
      await refresh()
    } catch (deleteError) {
      setError(deleteError?.message || '删除失败。')
    } finally {
      setSaving(false)
    }
  }

  async function togglePause() {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: data?.paused ? 'resume' : 'pause' }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setNotice(data?.paused ? '已恢复运行，明天 08:00 起自动发布。' : '已暂停，定时触发将跳过发布。')
      await refresh()
    } catch (pauseError) {
      setError(pauseError?.message || '状态切换失败。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPage
      title="推特问早自动化"
      description="每天北京时间 08:00 / 08:20 / 08:40 由 GitHub Actions 触发，按日期稳定随机选一条启用的文案发布到 X；当天已发布则自动跳过（幂等补跑）。"
      actions={
        <AdminButton type="button" onClick={refresh} disabled={loading}>
          {loading ? '刷新中…' : '刷新'}
        </AdminButton>
      }
    >
      {data?.status === 'unavailable' ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          当前环境没有 D1 绑定，无法读取模板。
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="模板总数" value={loading ? '—' : stats.total || 0} />
        <StatCard label="启用中" value={loading ? '—' : stats.enabled || 0} tone="success" />
        <StatCard
          label="自动化状态"
          value={loading ? '—' : data?.paused ? '已暂停' : '运行中'}
          tone={data?.paused ? 'warning' : 'success'}
        />
        <StatCard
          label="上次发布"
          value={loading ? '—' : lastRun?.ok ? '成功' : lastRun ? '失败' : '暂无'}
          tone={lastRun?.ok ? 'success' : lastRun ? 'danger' : 'neutral'}
          sub={lastRun ? formatTime(lastRun.at) : '尚未发布'}
        />
      </div>

      <Section
        title="文案模板"
        description="每天按日期随机选一条发布；保留 {date} 占位符，发布时会替换为当天日期。"
        className="mt-4"
        actions={
          <StatusPill tone={data?.paused ? 'warning' : 'success'} size="sm">
            {data?.paused ? '已暂停' : '运行中'}
          </StatusPill>
        }
      >
        <form onSubmit={addTemplate} className="mb-4 rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
          <label className="mb-1.5 block text-[12px] font-semibold text-[#15140f] dark:text-gray-100">新增文案</label>
          <div className="flex flex-col gap-2 lg:flex-row">
            <textarea
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              rows={2}
              placeholder={'例如：早安！今天是{date}。新一天，继续保持节奏～'}
              className={inputClass}
            />
            <AdminButton type="submit" variant="primary" disabled={saving || !newText.trim()}>
              {saving ? '保存中…' : '新增'}
            </AdminButton>
          </div>
        </form>

        {!loading && !templates.length ? (
          <EmptyState title="还没有文案模板" description="新增第一条文案后，问早自动化会从中随机选择。" />
        ) : (
          <div className="space-y-2">
            {templates.map((template, index) => (
              <div key={template.id} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-[#82847a] dark:text-gray-500">#{index + 1}</span>
                  <StatusPill tone={template.enabled ? 'success' : 'neutral'} size="sm" icon={false}>
                    {template.enabled ? '启用' : '停用'}
                  </StatusPill>
                  <span className="text-[11px] text-[#94968b] dark:text-gray-500">更新于 {formatTime(template.updatedAt)}</span>
                </div>
                <textarea
                  value={drafts[template.id] ?? template.text}
                  onChange={(event) => setDrafts((prev) => ({ ...prev, [template.id]: event.target.value }))}
                  rows={2}
                  className={inputClass}
                />
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => saveTemplate(template, { text: drafts[template.id] ?? template.text, enabled: !template.enabled })}
                    className="rounded-lg border border-[#caccc0] px-2.5 py-1 text-[11.5px] text-[#63645a] hover:bg-[#edefe7] disabled:opacity-50 dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                  >
                    {template.enabled ? '停用' : '启用'}
                  </button>
                  <AdminButton type="button" size="sm" variant="ghost" disabled={saving} onClick={() => saveTemplate(template, { text: drafts[template.id] ?? template.text, enabled: template.enabled })}>
                    保存修改
                  </AdminButton>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => removeTemplate(template)}
                    className="rounded-lg border border-rose-200 px-2.5 py-1 text-[11.5px] text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="上次发布" className="mt-4">
        {lastRun ? (
          <div className="flex flex-col gap-1 text-[12.5px] leading-6 text-[#67695d] dark:text-gray-400">
            <p className="mb-0">
              时间：{formatTime(lastRun.at)} · 结果：
              <StatusPill tone={lastRun.ok ? 'success' : 'danger'} size="sm">{lastRun.ok ? '成功' : '失败'}</StatusPill>
            </p>
            {lastRun.postUrl ? (
              <a href={lastRun.postUrl} target="_blank" rel="noreferrer" className="break-all text-sky-700 hover:underline dark:text-sky-300">
                {lastRun.postUrl}
              </a>
            ) : null}
            {lastRun.error ? <p className="mb-0 break-words text-rose-600 dark:text-rose-300">{lastRun.error}</p> : null}
          </div>
        ) : (
          <p className="mb-0 text-[13px] text-[#82847a] dark:text-gray-500">暂无发布记录。</p>
        )}
      </Section>
    </AdminPage>
  )
}
