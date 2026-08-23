'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AdminButton,
  AdminPage,
  AdminPagination,
  EmptyState,
  Section,
  StatCard,
  StatusPill,
  Toolbar,
} from '../../components/ui'
import DeepSeekKeysPanel from './DeepSeekKeysPanel'
import OllamaProvidersPanel from './OllamaProvidersPanel'

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
const SCOPE_META = {
  cloud: { label: '云调用', className: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  local: { label: '本地调用', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
}
const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const PAGE_SIZE = 50

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
            <div><dt className="text-[#82847a]">模型服务</dt><dd className="mt-0.5 break-all">{task.providerName || (task.provider === 'ollama' ? 'NAS · Ollama' : 'DeepSeek')}</dd></div>
            <div><dt className="text-[#82847a]">调用位置</dt><dd className="mt-0.5">{SCOPE_META[task.executionScope]?.label || '云调用'}</dd></div>
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
            <div><dt className="text-[#82847a]">优先级</dt><dd className="mt-0.5">{PRIORITY_LABELS[task.priority] || task.priority || '—'}</dd></div>
            <div><dt className="text-[#82847a]">管理状态</dt><dd className="mt-0.5">{MANAGEMENT_LABELS[task.managementStatus] || task.managementStatus || '—'}</dd></div>
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
  const [providerFilter, setProviderFilter] = useState('')
  const [providerIdFilter, setProviderIdFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [offset, setOffset] = useState(0)

  const refresh = useCallback(async (nextOffset = 0) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) })
    if (execution) params.set('execution', execution)
    if (management) params.set('management', management)
    if (source) params.set('source', source)
    if (keyFilter) params.set('key', keyFilter)
    if (providerFilter) params.set('provider', providerFilter)
    if (providerIdFilter) params.set('providerId', providerIdFilter)
    if (scopeFilter) params.set('scope', scopeFilter)
    try {
      const response = await fetch(`/api/admin/deepseek-tasks?${params}`, { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
      setOffset(Number(payload?.offset) || 0)
    } catch (fetchError) {
      setError(fetchError?.message || '任务记录读取失败。')
    } finally {
      setLoading(false)
    }
  }, [execution, management, source, keyFilter, providerFilter, providerIdFilter, scopeFilter])

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
      await refresh(offset)
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
  const PAGE_TAB_CLASS = 'h-9 rounded-md px-4 text-[13px] font-medium transition'
  const SCOPE_PILL_CLASS = 'h-8 rounded-md px-3 text-[12px] font-medium transition'
  const isRecordTab = tab === 'records'

  function openAllRecords() {
    setScopeFilter('')
    setSource('')
    setProviderFilter('')
    setProviderIdFilter('')
    setKeyFilter('')
    setExecution('')
    setManagement('')
    setTab('records')
  }

  function openCloudRecords() {
    setScopeFilter('cloud')
    setSource('')
    setProviderFilter('')
    setProviderIdFilter('')
    setKeyFilter('')
    setExecution('')
    setManagement('')
    setTab('records')
  }

  function openMacRecords() {
    setScopeFilter('local')
    setSource('mac-nas-qwen')
    setProviderFilter('ollama')
    setProviderIdFilter('')
    setKeyFilter('')
    setExecution('')
    setManagement('')
    setTab('records')
  }

  function getRecordTitle() {
    if (scopeFilter === 'cloud') return '云调用记录'
    if (scopeFilter === 'local') return '本地调用记录'
    return '调用记录'
  }

  function getRecordDescription() {
    if (scopeFilter === 'cloud') return '仅显示云端模型调用。'
    if (scopeFilter === 'local') return '仅显示 Mac 发起的 NAS Qwen 本地调用。'
    return '点开一条可看摘要、耗时和备注。'
  }

  const resultTone = Number(stats.failed) > 0 ? 'danger' : 'success'

  return (
    <AdminPage
      title="模型管理"
      description="查看云端与 Mac 发起的 NAS Qwen 调用摘要。密钥和本地 SQLite 原始记录不会上传。"
      actions={
        <>
          <AdminButton href="/admin/model-dispatch">AI 规划台</AdminButton>
          {isRecordTab ? (
            <AdminButton type="button" variant="primary" onClick={() => refresh(offset)} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>
          ) : null}
        </>
      }
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}

      <div
        role="tablist"
        aria-label="模型管理"
        className="mb-4 grid max-w-xl grid-cols-3 overflow-hidden rounded-lg border border-[#d5d7cd] bg-[#f7f8f2] p-1 dark:border-[#2a3544] dark:bg-[#0d131b]"
      >
        {[
          { id: 'records', label: '调用记录' },
          { id: 'keys', label: 'DeepSeek 密钥' },
          { id: 'ollama', label: 'NAS · Ollama' },
        ].map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${PAGE_TAB_CLASS} ${active ? 'bg-[#2f3027] text-white shadow-sm dark:bg-gray-100 dark:text-[#111]' : 'text-[#626459] hover:bg-white dark:text-[#9aa6b6] dark:hover:bg-[#151c25]'}`}
              onClick={() => {
                if (item.id === 'records') {
                  if (!isRecordTab) openAllRecords()
                  return
                }
                setTab(item.id)
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'keys' ? (
        <DeepSeekKeysPanel onViewCalls={(keyId) => {
          setKeyFilter(keyId)
          setScopeFilter('cloud')
          setSource('')
          setTab('records')
        }} />
      ) : tab === 'ollama' ? (
        <OllamaProvidersPanel onViewCalls={(providerId) => {
          setProviderFilter('ollama')
          setProviderIdFilter(providerId)
          setScopeFilter('cloud')
          setSource('')
          setKeyFilter('')
          setTab('records')
        }} />
      ) : (
        <>
          {data?.status === 'unavailable' ? <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">D1 不可用或迁移 0025 尚未部署，当前无法读取任务记录。</div> : null}

          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="今日调用" value={loading ? '—' : stats.today || 0} sub={`累计 ${stats.total || 0}`} icon="deepseekTasks" />
            <StatCard label="成功" value={loading ? '—' : stats.succeeded || 0} sub={`失败 ${stats.failed || 0} · 运行中 ${stats.running || 0}`} tone={loading ? 'neutral' : resultTone} />
            <StatCard label="云调用" value={loading ? '—' : stats.cloud || 0} sub={`本地调用 ${stats.local || 0}`} />
            <StatCard label="累计 Token" value={loading ? '—' : Number(stats.totalTokens || 0).toLocaleString()} />
          </div>

          <Section
            title={getRecordTitle()}
            description={getRecordDescription()}
            actions={<span className="text-[12px] text-[#82847a]">共 {Number(data?.total) || 0} 条</span>}
          >
            <Toolbar className="mb-4">
              <div role="tablist" aria-label="调用位置" className="flex rounded-lg bg-[#f0f1eb] p-1 dark:bg-[#151c25]">
                <button type="button" role="tab" aria-selected={!scopeFilter} className={`${SCOPE_PILL_CLASS} ${!scopeFilter ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#253041] dark:text-white' : 'text-[#77796e] hover:text-[#3f4039] dark:text-gray-400'}`} onClick={openAllRecords}>全部</button>
                <button type="button" role="tab" aria-selected={scopeFilter === 'cloud'} className={`${SCOPE_PILL_CLASS} ${scopeFilter === 'cloud' ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#253041] dark:text-white' : 'text-[#77796e] hover:text-[#3f4039] dark:text-gray-400'}`} onClick={openCloudRecords}>云调用</button>
                <button type="button" role="tab" aria-selected={scopeFilter === 'local'} className={`${SCOPE_PILL_CLASS} ${scopeFilter === 'local' ? 'bg-white text-[#15140f] shadow-sm dark:bg-[#253041] dark:text-white' : 'text-[#77796e] hover:text-[#3f4039] dark:text-gray-400'}`} onClick={openMacRecords}>本地调用</button>
              </div>
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
              <select className={CONTROL_CLASS} value={providerFilter} onChange={(event) => { setProviderFilter(event.target.value); setProviderIdFilter('') }} aria-label="模型服务">
                <option value="">全部模型服务</option>
                {(data?.providers || []).map((item) => <option key={item.id} value={item.id}>{item.label}（{item.count}）</option>)}
              </select>
              <select className={CONTROL_CLASS} value={keyFilter} onChange={(event) => setKeyFilter(event.target.value)} aria-label="使用密钥">
                <option value="">全部密钥</option>
                {[...knownKeys.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                {keyFilter && !knownKeys.has(keyFilter) ? <option value={keyFilter}>{keyFilter}</option> : null}
              </select>
              {providerIdFilter ? <button type="button" className={CONTROL_CLASS} onClick={() => setProviderIdFilter('')}>清除 Ollama 服务筛选</button> : null}
            </Toolbar>

            {!loading && !tasks.length ? (
              <EmptyState title="暂无模型调用记录" description="完成迁移后，DeepSeek 与 Ollama 新调用会自动进入这里。" />
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const executionMeta = EXECUTION_META[task.executionStatus] || { label: task.executionStatus, tone: 'neutral' }
                  const scopeMeta = SCOPE_META[task.executionScope] || SCOPE_META.cloud
                  const providerLabel = task.providerName || (task.provider === 'ollama' ? 'NAS · Ollama' : 'DeepSeek')
                  return (
                    <article key={task.id} className={`rounded-lg border p-3 transition ${selectedId === task.id ? 'border-[#818472] bg-[#fafbf6] dark:border-[#4a5568] dark:bg-[#0e141d]' : 'border-[#e6e7df] dark:border-[#243041]'}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <button type="button" onClick={() => setSelectedId(selectedId === task.id ? '' : task.id)} className="min-w-0 flex-1 text-left">
                          <h3 className="truncate text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{task.title || '未命名任务'}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-[#67695d] dark:text-gray-400">
                            <StatusPill tone={executionMeta.tone} size="sm">{executionMeta.label}</StatusPill>
                            <span>{scopeMeta.label}</span>
                            <span>· {providerLabel}</span>
                            <span>· {task.source} · {task.taskType}</span>
                            {task.metadata?.webSearch?.enabled ? <span>· 联网检索 {Number(task.metadata.webSearch.calls) || 0} 次</span> : null}
                          </div>
                          <p className="mt-1 truncate text-[12px] text-[#82847a] dark:text-gray-500">{task.resultSummary || task.inputSummary || '暂无摘要'}</p>
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-24 text-right font-mono text-[11px] text-[#82847a]">{task.totalTokens.toLocaleString()} tokens</span>
                          <span className="w-20 text-right text-[11px] text-[#82847a]">{formatDuration(task.durationMs)}</span>
                          <span className="w-32 text-right text-[11px] text-[#82847a]">{formatDate(task.createdAt)}</span>
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
            <AdminPagination
              total={Number(data?.total) || 0}
              offset={offset}
              limit={PAGE_SIZE}
              onOffsetChange={refresh}
              loading={loading}
            />
          </Section>

          <TaskDetail task={selectedTask} note={note} setNote={setNote} saving={saving} onSave={() => updateTask(selectedTask.id, { managementNote: note })} />
        </>
      )}
    </AdminPage>
  )
}
