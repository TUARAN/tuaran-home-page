'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AdminButton,
  AdminPage,
  EmptyState,
  Section,
  StatCard,
  StatusPill,
  Toolbar,
} from '../../components/ui'
import DeepSeekKeysPanel from './DeepSeekKeysPanel'

const EXECUTION_META = {
  running: { label: '运行中', tone: 'info' },
  succeeded: { label: '成功', tone: 'success' },
  failed: { label: '失败', tone: 'danger' },
}

const MANAGEMENT_LABELS = {
  pending: '待审阅',
  reviewing: '审阅中',
  approved: '已确认',
  archived: '已归档',
}

const PRIORITY_LABELS = { low: '低', normal: '普通', high: '高' }
const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function formatDuration(value) {
  const ms = Number(value) || 0
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} 秒`
}

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function TaskDetail({ task, note, setNote, saving, onSave }) {
  if (!task) return null
  return (
    <Section title="任务详情" description={task.id} className="mt-4">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 text-[13px]">
          <div>
            <p className="text-[#82847a] dark:text-gray-500">输入摘要</p>
            <p className="mt-1 whitespace-pre-wrap leading-6 text-[#3f4039] dark:text-gray-200">{task.inputSummary || '—'}</p>
          </div>
          <div>
            <p className="text-[#82847a] dark:text-gray-500">规划 / 结果摘要</p>
            <p className="mt-1 whitespace-pre-wrap leading-6 text-[#3f4039] dark:text-gray-200">{task.resultSummary || '—'}</p>
          </div>
          {task.errorDetail ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              <strong>{task.errorCode || '调用失败'}</strong>
              <p className="mt-1 break-words">{task.errorDetail}</p>
            </div>
          ) : null}
        </div>
        <div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
            <div><dt className="text-[#82847a]">模型</dt><dd className="mt-0.5 break-all">{task.model || '—'}</dd></div>
            <div>
              <dt className="text-[#82847a]">联网检索</dt>
              <dd className="mt-0.5">
                {task.metadata?.webSearch?.enabled
                  ? `${Number(task.metadata.webSearch.calls) || 0} 次 / 引用 ${Number(task.metadata.webSearch.citations) || 0} 条`
                  : '未启用'}
              </dd>
            </div>
            <div><dt className="text-[#82847a]">使用密钥</dt><dd className="mt-0.5 break-all">{task.keyName || task.keyId || '—'}</dd></div>
            <div><dt className="text-[#82847a]">调用人</dt><dd className="mt-0.5">{task.actorName || task.actorId || '—'}</dd></div>
            <div><dt className="text-[#82847a]">Prompt Token</dt><dd className="mt-0.5">{task.promptTokens}</dd></div>
            <div><dt className="text-[#82847a]">输出 Token</dt><dd className="mt-0.5">{task.completionTokens}</dd></div>
            <div><dt className="text-[#82847a]">耗时</dt><dd className="mt-0.5">{formatDuration(task.durationMs)}</dd></div>
            <div><dt className="text-[#82847a]">完成时间</dt><dd className="mt-0.5">{formatDate(task.finishedAt)}</dd></div>
          </dl>
          <label className="mt-5 block text-[12px] text-[#67695d] dark:text-gray-400" htmlFor="management-note">
            管理备注
          </label>
          <textarea
            id="management-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            rows={5}
            className="mt-1.5 w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-6 dark:border-[#2b3644] dark:bg-[#0e141d]"
            placeholder="记录审阅结论、后续动作或异常原因…"
          />
          <div className="mt-2 flex justify-end">
            <AdminButton type="button" variant="primary" onClick={onSave} disabled={saving}>
              {saving ? '保存中…' : '保存备注'}
            </AdminButton>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default function DeepSeekTasksClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('records')
  const [execution, setExecution] = useState('')
  const [management, setManagement] = useState('')
  const [source, setSource] = useState('')
  const [keyFilter, setKeyFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ limit: '100' })
    if (execution) params.set('execution', execution)
    if (management) params.set('management', management)
    if (source) params.set('source', source)
    if (keyFilter) params.set('key', keyFilter)
    try {
      const response = await fetch(`/api/admin/deepseek-tasks?${params}`, { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || '任务记录读取失败。')
    } finally {
      setLoading(false)
    }
  }, [execution, management, source, keyFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  const tasks = data?.tasks || []
  const selectedTask = tasks.find((task) => task.id === selectedId) || null

  useEffect(() => {
    setNote(selectedTask?.managementNote || '')
  }, [selectedTask])

  async function updateTask(id, patch) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/deepseek-tasks', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (updateError) {
      setError(updateError?.message || '任务更新失败。')
    } finally {
      setSaving(false)
    }
  }

  const stats = data?.stats || {}
  const knownKeys = new Map()
  for (const task of tasks) {
    if (task.keyId) knownKeys.set(task.keyId, task.keyName || task.keyId)
  }
  const TAB_CLASS = 'h-9 rounded-lg px-4 text-[13px] font-medium transition'

  return (
    <AdminPage
      title="DeepSeek 管理"
      description="统一管理 DeepSeek API 密钥、任务绑定与调用记录；完整 Key 与 Prompt 不会写入台账。"
      actions={
        <>
          <AdminButton href="/admin/model-dispatch" variant="primary">AI 规划台</AdminButton>
          {tab === 'records' ? (
            <AdminButton type="button" onClick={refresh} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>
          ) : null}
        </>
      }
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}

      <div className="mb-4 flex gap-1 rounded-xl border border-[#e6e7df] bg-[#f6f7f0] p-1 dark:border-[#243041] dark:bg-[#10161f]">
        <button type="button" className={`${TAB_CLASS} ${tab === 'records' ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#1b2532] dark:text-gray-100' : 'text-[#82847a] hover:text-[#3f4039] dark:hover:text-gray-300'}`} onClick={() => setTab('records')}>
          调用记录
        </button>
        <button type="button" className={`${TAB_CLASS} ${tab === 'keys' ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#1b2532] dark:text-gray-100' : 'text-[#82847a] hover:text-[#3f4039] dark:hover:text-gray-300'}`} onClick={() => setTab('keys')}>
          密钥管理
        </button>
      </div>

      {tab === 'keys' ? (
        <DeepSeekKeysPanel onViewCalls={(keyId) => {
          setKeyFilter(keyId)
          setTab('records')
        }} />
      ) : (
        <>
          {data?.status === 'unavailable' ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">D1 不可用或迁移 0025 尚未部署，当前无法读取任务记录。</div> : null}

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard label="累计调用" value={loading ? '—' : stats.total || 0} icon="deepseekTasks" />
            <StatCard label="今日调用" value={loading ? '—' : stats.today || 0} />
            <StatCard label="成功" value={loading ? '—' : stats.succeeded || 0} tone="success" />
            <StatCard label="失败" value={loading ? '—' : stats.failed || 0} tone="danger" />
            <StatCard label="运行中" value={loading ? '—' : stats.running || 0} tone="info" />
            <StatCard label="累计 Token" value={loading ? '—' : Number(stats.totalTokens || 0).toLocaleString()} />
          </div>

          <Section
            title="调用记录"
            description="执行状态自动更新；审阅状态、优先级和备注由后台维护。"
            actions={<span className="text-[12px] text-[#82847a]">当前 {tasks.length} 条</span>}
          >
            <Toolbar className="mb-4">
              <select className={CONTROL_CLASS} value={execution} onChange={(event) => setExecution(event.target.value)} aria-label="执行状态">
                <option value="">全部执行状态</option>
                {Object.entries(EXECUTION_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
              <select className={CONTROL_CLASS} value={management} onChange={(event) => setManagement(event.target.value)} aria-label="管理状态">
                <option value="">全部管理状态</option>
                {Object.entries(MANAGEMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select className={CONTROL_CLASS} value={source} onChange={(event) => setSource(event.target.value)} aria-label="调用来源">
                <option value="">全部来源</option>
                {(data?.sources || []).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className={CONTROL_CLASS} value={keyFilter} onChange={(event) => setKeyFilter(event.target.value)} aria-label="使用密钥">
                <option value="">全部密钥</option>
                {[...knownKeys.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                {keyFilter && !knownKeys.has(keyFilter) ? <option value={keyFilter}>{keyFilter}</option> : null}
              </select>
            </Toolbar>

            {!loading && !tasks.length ? (
              <EmptyState title="暂无 DeepSeek 任务记录" description="完成迁移后，新调用会自动进入这里。" />
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const executionMeta = EXECUTION_META[task.executionStatus] || { label: task.executionStatus, tone: 'neutral' }
                  return (
                    <article key={task.id} className={`rounded-lg border p-3 transition ${selectedId === task.id ? 'border-[#818472] bg-[#fafbf6] dark:border-[#4a5568] dark:bg-[#0e141d]' : 'border-[#e6e7df] dark:border-[#243041]'}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <button type="button" onClick={() => setSelectedId(selectedId === task.id ? '' : task.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={executionMeta.tone} size="sm">{executionMeta.label}</StatusPill>
                            <span className="text-[11px] text-[#82847a]">{task.source} · {task.taskType}</span>
                            {task.keyName ? <span className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">{task.keyName}</span> : null}
                            {task.metadata?.webSearch?.enabled ? (
                              <span className="rounded-md bg-[#e9f2e4] px-1.5 py-0.5 text-[11px] text-[#3e6b2f] dark:bg-[#12240e] dark:text-[#9fd08a]">联网检索 {Number(task.metadata.webSearch.calls) || 0} 次</span>
                            ) : null}
                          </div>
                          <h3 className="mt-1.5 truncate text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{task.title || '未命名任务'}</h3>
                          <p className="mt-1 truncate text-[12px] text-[#67695d] dark:text-gray-400">{task.resultSummary || task.inputSummary || '暂无摘要'}</p>
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-24 text-right font-mono text-[11px] text-[#82847a]">{task.totalTokens.toLocaleString()} tokens</span>
                          <span className="w-20 text-right text-[11px] text-[#82847a]">{formatDuration(task.durationMs)}</span>
                          <span className="w-32 text-right text-[11px] text-[#82847a]">{formatDate(task.createdAt)}</span>
                          <select className={CONTROL_CLASS} value={task.priority} disabled={saving} onChange={(event) => updateTask(task.id, { priority: event.target.value })} aria-label={`${task.title}优先级`}>
                            {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>优先级：{label}</option>)}
                          </select>
                          <select className={CONTROL_CLASS} value={task.managementStatus} disabled={saving} onChange={(event) => updateTask(task.id, { managementStatus: event.target.value })} aria-label={`${task.title}管理状态`}>
                            {Object.entries(MANAGEMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </Section>

          <TaskDetail task={selectedTask} note={note} setNote={setNote} saving={saving} onSave={() => updateTask(selectedTask.id, { managementNote: note })} />
        </>
      )}
    </AdminPage>
  )
}
