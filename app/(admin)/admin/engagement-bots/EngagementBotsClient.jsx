'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconCheck,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, AdminPagination, DataTable, Section, StatCard, StatusPill } from '../../components/ui'

const RIGHT_PANELS = [
  { id: 'bots', label: '人设' },
  { id: 'runs', label: '最近运行' },
  { id: 'actions', label: '动作记录' },
]
const BOTS_PAGE_SIZE = 5
const RUNS_PAGE_SIZE = 6
const ACTIONS_PAGE_SIZE = 10

const EMPTY_FORM = {
  id: '',
  slug: '',
  displayName: '',
  voicePrompt: '',
  enabled: true,
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function formatTime(ts) {
  const n = Number(ts)
  if (!n) return ''
  try {
    return new Date(n).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function actionTone(status) {
  if (status === 'ok') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'skipped' || status === 'partial') return 'warning'
  return 'neutral'
}

function actionLabel(item) {
  if (item.actionType === 'like') return '点赞'
  if (item.actionType === 'comment') return '评论'
  return item.actionType || '动作'
}

export default function EngagementBotsClient() {
  const [bots, setBots] = useState([])
  const [settings, setSettings] = useState({
    enabled: true,
    likesPerRun: 2,
    commentsPerRun: 1,
    skipProbability: 0,
    cooldownHours: 72,
    maxCommentChars: 72,
    contentPrefixes: ['article:', 'research:'],
  })
  const [actions, setActions] = useState([])
  const [runs, setRuns] = useState([])
  const [stats, setStats] = useState({ bots: 0, enabledBots: 0, likesToday: 0, commentsToday: 0, failedToday: 0 })
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [persistent, setPersistent] = useState(true)
  const [adminDeepSeekConfigured, setAdminDeepSeekConfigured] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rightPanel, setRightPanel] = useState('bots')
  const [botsOffset, setBotsOffset] = useState(0)
  const [runsOffset, setRunsOffset] = useState(0)
  const [actionsOffset, setActionsOffset] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/engagement-bots', { cache: 'no-store', credentials: 'same-origin' })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setBots(Array.isArray(data?.bots) ? data.bots : [])
      if (data?.settings) {
        setSettings({
          ...data.settings,
          contentPrefixes: Array.isArray(data.settings.contentPrefixes)
            ? data.settings.contentPrefixes
            : ['article:', 'research:'],
        })
      }
      setActions(Array.isArray(data?.actions) ? data.actions : [])
      setRuns(Array.isArray(data?.runs) ? data.runs : [])
      setStats(data?.stats || { bots: 0, enabledBots: 0, likesToday: 0, commentsToday: 0, failedToday: 0 })
      setPersistent(data?.persistent !== false)
      setAdminDeepSeekConfigured(data?.adminDeepSeekConfigured === true)
    } catch (reason) {
      setError(reason?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const prefixText = useMemo(
    () => (Array.isArray(settings.contentPrefixes) ? settings.contentPrefixes.join(', ') : ''),
    [settings.contentPrefixes],
  )
  const visibleBots = useMemo(() => bots.slice(botsOffset, botsOffset + BOTS_PAGE_SIZE), [bots, botsOffset])
  const visibleRuns = useMemo(() => runs.slice(runsOffset, runsOffset + RUNS_PAGE_SIZE), [runs, runsOffset])
  const visibleActions = useMemo(() => actions.slice(actionsOffset, actionsOffset + ACTIONS_PAGE_SIZE), [actions, actionsOffset])

  useEffect(() => {
    if (botsOffset >= bots.length && botsOffset > 0) {
      setBotsOffset(Math.max(0, Math.floor((bots.length - 1) / BOTS_PAGE_SIZE) * BOTS_PAGE_SIZE))
    }
  }, [bots.length, botsOffset])

  useEffect(() => {
    if (runsOffset >= runs.length && runsOffset > 0) {
      setRunsOffset(Math.max(0, Math.floor((runs.length - 1) / RUNS_PAGE_SIZE) * RUNS_PAGE_SIZE))
    }
  }, [runs.length, runsOffset])

  useEffect(() => {
    if (actionsOffset >= actions.length && actionsOffset > 0) {
      setActionsOffset(Math.max(0, Math.floor((actions.length - 1) / ACTIONS_PAGE_SIZE) * ACTIONS_PAGE_SIZE))
    }
  }, [actions.length, actionsOffset])

  async function saveSettings(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/engagement-bots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          kind: 'settings',
          settings: {
            ...settings,
            contentPrefixes: prefixText,
          },
        }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setSettings(data.settings)
      setMessage(data.settings.enabled ? '路过互动已保存并启用。' : '设置已保存。定时任务在关闭时会直接跳过。')
    } catch (reason) {
      setError(reason?.message || 'SAVE_FAILED')
    } finally {
      setSaving(false)
    }
  }

  async function saveBot(event) {
    event.preventDefault()
    if (!form.displayName.trim() || !form.voicePrompt.trim() || (!form.id && !form.slug.trim())) {
      setError('人设需要标识、昵称和说话方式。')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/engagement-bots', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setForm(EMPTY_FORM)
      setMessage(form.id ? '人设已更新。' : '人设已添加。')
      await load()
    } catch (reason) {
      setError(reason?.message || 'SAVE_FAILED')
    } finally {
      setSaving(false)
    }
  }

  async function toggleBot(item) {
    setError('')
    const response = await fetch('/api/admin/engagement-bots', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ ...item, enabled: !item.enabled }),
    })
    const data = await readJson(response)
    if (!response.ok) {
      setError(data?.error || `HTTP_${response.status}`)
      return
    }
    setBots((current) => current.map((bot) => (bot.id === item.id ? { ...bot, enabled: !bot.enabled } : bot)))
  }

  async function removeBot(item) {
    if (!window.confirm(`确定删除人设「${item.displayName}」吗？历史记录会保留。`)) return
    setError('')
    const response = await fetch(`/api/admin/engagement-bots?id=${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    const data = await readJson(response)
    if (!response.ok) {
      setError(data?.error || `HTTP_${response.status}`)
      return
    }
    setBots((current) => current.filter((bot) => bot.id !== item.id))
    if (form.id === item.id) setForm(EMPTY_FORM)
    setMessage('人设已删除。')
  }

  async function runNow() {
    setRunning(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/engagement-bots/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ force: true }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      const skipped = data?.status === 'skipped' ? `（${data.detail || '跳过'}）` : ''
      setMessage(`本次运行：点赞 ${data?.likes || 0}，评论 ${data?.comments || 0}，失败 ${data?.failed || 0}${skipped}。`)
      await load()
    } catch (reason) {
      setError(reason?.message || 'RUN_FAILED')
    } finally {
      setRunning(false)
    }
  }

  return (
    <AdminPage
      title="路过互动"
      description="每天 10:23（北京时间）随机点赞并生成短评。定时任务在 2aran.com 运行，立即运行在 admin.2aran.com 运行；两边分别读取各自的 DeepSeek 密钥。前台身份显示为「路过」，不发站长通知、不记燃币。"
      actions={
        <>
          <AdminButton onClick={load} disabled={loading || saving || running}>
            <IconRefresh size={15} />
            重新读取
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={runNow}
            disabled={!persistent || running || saving || !adminDeepSeekConfigured}
            title={!adminDeepSeekConfigured ? 'admin.2aran.com 当前没有可用的 DeepSeek 密钥' : undefined}
          >
            <IconPlayerPlay size={15} />
            {running ? '运行中…' : '立即运行'}
          </AdminButton>
        </>
      }
    >
      {!persistent ? <Notice tone="warning">当前为本地预览数据；部署并应用 D1 迁移 0074 后才能保存和运行。</Notice> : null}
      {!loading && !adminDeepSeekConfigured ? (
        <Notice tone="warning">admin.2aran.com 当前没有配置可用的 DeepSeek 密钥，“立即运行”已停用；每天 10:23 的 2aran.com 定时任务不受影响。</Notice>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="人设" value={stats.enabledBots} sub={`共 ${stats.bots} 个`} icon="users" />
        <StatCard label="今日点赞" value={stats.likesToday} icon="analytics" />
        <StatCard label="今日评论" value={stats.commentsToday} icon="ops" />
        <StatCard
          label="状态"
          value={settings.enabled ? '已启用' : '已关闭'}
          sub={settings.enabled ? '定时任务会尝试互动' : '定时任务直接跳过'}
          tone={settings.enabled ? 'success' : 'warning'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Section title="运行设置" description="GitHub Actions 每天 10:23（北京时间）触发一次。关闭后接口直接跳过；立即运行会忽略关闭状态和随机跳过，方便试一次。">
            <form onSubmit={saveSettings} className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-[#55574e] dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(settings.enabled)}
                  onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
                  className="h-4 w-4 accent-[#15140f]"
                />
                启用定时路过互动
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="每次点赞">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={settings.likesPerRun}
                    onChange={(event) => setSettings((current) => ({ ...current, likesPerRun: Number(event.target.value) }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="每次评论">
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={settings.commentsPerRun}
                    onChange={(event) => setSettings((current) => ({ ...current, commentsPerRun: Number(event.target.value) }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="随机跳过">
                  <input
                    type="number"
                    min="0"
                    max="0.9"
                    step="0.01"
                    value={settings.skipProbability}
                    onChange={(event) => setSettings((current) => ({ ...current, skipProbability: Number(event.target.value) }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="同篇冷却（小时）">
                  <input
                    type="number"
                    min="12"
                    max="720"
                    value={settings.cooldownHours}
                    onChange={(event) => setSettings((current) => ({ ...current, cooldownHours: Number(event.target.value) }))}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="内容前缀">
                <input
                  value={prefixText}
                  onChange={(event) => setSettings((current) => ({ ...current, contentPrefixes: event.target.value.split(/[\n,，]/).map((item) => item.trim()).filter(Boolean) }))}
                  className={inputClass}
                  placeholder="article:, research:"
                />
              </Field>
              <p className="text-[12px] leading-5 text-[#858779]">
                定时评论读取 2aran.com 的 DeepSeek 密钥，立即运行读取 admin.2aran.com 的密钥；调用统一记入
                <Link className="mx-1 underline underline-offset-2" href="/admin/deepseek-tasks">模型任务</Link>
                台账。
              </p>
              <AdminButton type="submit" variant="primary" disabled={saving || !persistent}>
                <IconCheck size={15} />
                {saving ? '保存中…' : '保存设置'}
              </AdminButton>
            </form>
          </Section>

          <Section title={form.id ? '编辑人设' : '新增人设'} description="昵称会出现在评论区。说话方式只给 DeepSeek，不对外展示。">
            {form.id ? (
              <button type="button" onClick={() => setForm(EMPTY_FORM)} className="mb-3 text-xs text-[#858779]" aria-label="取消编辑">
                <IconX size={14} className="mr-1 inline" />
                取消编辑
              </button>
            ) : null}
            <form onSubmit={saveBot} className="space-y-4">
              {!form.id ? (
                <Field label="标识（英文）">
                  <input
                    required
                    maxLength={32}
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                    className={inputClass}
                    placeholder="wanfeng"
                  />
                </Field>
              ) : (
                <p className="text-xs text-[#858779]">标识：{form.slug}</p>
              )}
              <Field label="昵称">
                <input
                  required
                  maxLength={12}
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  className={inputClass}
                  placeholder="晚风"
                />
              </Field>
              <Field label="说话方式">
                <textarea
                  required
                  maxLength={240}
                  rows={4}
                  value={form.voicePrompt}
                  onChange={(event) => setForm((current) => ({ ...current, voicePrompt: event.target.value }))}
                  className={`${inputClass} h-auto resize-y py-2`}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-[#55574e] dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(form.enabled)}
                  onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                  className="h-4 w-4 accent-[#15140f]"
                />
                启用此人设
              </label>
              <AdminButton type="submit" variant="primary" disabled={saving || !persistent}>
                {form.id ? <IconCheck size={15} /> : <IconPlus size={15} />}
                {saving ? '保存中…' : form.id ? '保存人设' : '添加人设'}
              </AdminButton>
            </form>
          </Section>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-[#e2e3da] bg-[#f5f5ef] p-1.5 dark:border-[#27313d] dark:bg-[#0c1118]" role="tablist" aria-label="路过互动记录分区">
            {RIGHT_PANELS.map((panel) => (
              <button
                key={panel.id}
                type="button"
                role="tab"
                aria-selected={rightPanel === panel.id}
                onClick={() => setRightPanel(panel.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  rightPanel === panel.id
                    ? 'bg-white text-[#25251f] shadow-sm dark:bg-[#18212c] dark:text-white'
                    : 'text-[#77786d] hover:text-[#25251f] dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {panel.label}
                <span className="ml-1.5 text-[10px] opacity-60">
                  {panel.id === 'bots' ? bots.length : panel.id === 'runs' ? runs.length : actions.length}
                </span>
              </button>
            ))}
          </div>

          {rightPanel === 'bots' ? <Section title="人设" description="前台评论会显示昵称，身份行是「路过」。">
            <div className="divide-y divide-[#e7e4da] dark:divide-[#27313d]">
              {visibleBots.map((item) => (
                <article key={item.id} className={`grid gap-3 py-4 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center ${item.enabled ? '' : 'opacity-55'}`}>
                  <div className="min-w-0">
                    <p className="font-medium text-[#292a24] dark:text-gray-100">
                      {item.displayName}
                      <span className="ml-2 text-xs font-normal text-[#858779]">{item.slug}</span>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#858779]">{item.voicePrompt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBot(item)}
                      disabled={!persistent}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${item.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-[#efeee8] text-[#77786d] dark:bg-[#202934] dark:text-gray-400'}`}
                    >
                      {item.enabled ? '已启用' : '已停用'}
                    </button>
                    <button type="button" onClick={() => setForm(item)} className={iconButtonClass} aria-label="编辑">
                      编辑
                    </button>
                    <button type="button" onClick={() => removeBot(item)} disabled={!persistent} className={`${iconButtonClass} hover:text-rose-600`} aria-label="删除">
                      <IconTrash size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {!loading && !bots.length ? <p className="py-10 text-center text-sm text-[#858779]">还没有人设</p> : null}
            </div>
            <AdminPagination total={bots.length} offset={botsOffset} limit={BOTS_PAGE_SIZE} onOffsetChange={setBotsOffset} loading={loading} />
          </Section> : null}

          {rightPanel === 'runs' ? <Section title="最近运行" description="含定时跳过。失败的评论可在模型任务里核对 DeepSeek 返回。">
            <DataTable
              rows={visibleRuns}
              rowKey={(row) => row.id}
              empty={<p className="py-8 text-center text-sm text-[#858779]">还没有运行记录</p>}
              columns={[
                { key: 'time', header: '时间', render: (row) => formatTime(row.startedAt) },
                { key: 'by', header: '来源', render: (row) => (row.triggeredBy === 'admin' ? '后台' : '定时') },
                {
                  key: 'status',
                  header: '结果',
                  render: (row) => <StatusPill tone={actionTone(row.status)} size="sm">{row.status}{row.detail && row.status === 'skipped' ? ` · ${row.detail}` : ''}</StatusPill>,
                },
                { key: 'likes', header: '赞', render: (row) => row.likes },
                { key: 'comments', header: '评', render: (row) => row.comments },
                { key: 'failed', header: '失败', render: (row) => row.failed },
              ]}
            />
            <AdminPagination total={runs.length} offset={runsOffset} limit={RUNS_PAGE_SIZE} onOffsetChange={setRunsOffset} loading={loading} />
          </Section> : null}

          {rightPanel === 'actions' ? <Section title="动作记录" description="按时间倒序查看最近的点赞与评论。">
            <DataTable
              rows={visibleActions}
              rowKey={(row) => row.id}
              empty={<p className="py-8 text-center text-sm text-[#858779]">还没有点赞或评论记录</p>}
              columns={[
                { key: 'time', header: '时间', render: (row) => formatTime(row.createdAt) },
                { key: 'bot', header: '人设', render: (row) => row.botName || row.botSlug },
                { key: 'type', header: '动作', render: (row) => actionLabel(row) },
                { key: 'article', header: '内容', render: (row) => row.articleTitle || row.articleKey },
                {
                  key: 'status',
                  header: '状态',
                  render: (row) => <StatusPill tone={actionTone(row.status)} size="sm">{row.status}</StatusPill>,
                },
                {
                  key: 'detail',
                  header: '摘要',
                  render: (row) => row.message || row.error || '',
                  tdClassName: 'max-w-[18rem] truncate',
                },
              ]}
            />
            <AdminPagination total={actions.length} offset={actionsOffset} limit={ACTIONS_PAGE_SIZE} onOffsetChange={setActionsOffset} loading={loading} />
          </Section> : null}
        </div>
      </div>
    </AdminPage>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-[#d7d8ce] bg-white px-3 text-sm text-[#292a24] outline-none transition focus:border-[#818472] dark:border-[#34404d] dark:bg-[#0c1118] dark:text-gray-100'
const iconButtonClass = 'rounded-lg border border-[#dedfd5] px-2 py-2 text-xs text-[#77786d] transition hover:border-[#aaac9e] hover:text-[#25251f] disabled:opacity-40 dark:border-[#303b47] dark:text-gray-400 dark:hover:text-white'

function Field({ label, children }) {
  return (
    <label className="block text-xs font-medium text-[#55574e] dark:text-gray-300">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  )
}

function Notice({ tone, children }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  }
  return <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>{children}</div>
}
