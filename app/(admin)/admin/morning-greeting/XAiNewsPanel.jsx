'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminButton, Section, StatusPill } from '../../components/ui'

const inputClass = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-5 text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'
const fieldClass = 'mb-3 flex flex-col gap-1 text-[12px] font-semibold text-[#34352f] dark:text-gray-200'
const modeTabClass = 'rounded-lg px-3 py-2.5 text-left transition'

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

function weightedLength(value) {
  return Array.from(String(value || '')).reduce((total, character) => total + (character.codePointAt(0) <= 0x7f ? 1 : 2), 0)
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(Number(value))
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false })
}

function Field({ label, className = '', children }) {
  return <label className={`${fieldClass} ${className}`.trim()}>{label}{children}</label>
}

export default function XAiNewsPanel() {
  const [data, setData] = useState(null)
  const [generatorId, setGeneratorId] = useState('')
  const [brief, setBrief] = useState('')
  const [draft, setDraft] = useState('')
  const [generation, setGeneration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/x-ai-news', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
      setGeneratorId((current) => current || (payload.defaultProviderId ? `ollama:${payload.defaultProviderId}` : 'deepseek'))
    } catch (fetchError) {
      setError(fetchError?.message || 'AI 资讯任务读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const providers = data?.providers || []
  const providerType = generatorId.startsWith('ollama:') ? 'ollama' : 'deepseek'
  const providerId = providerType === 'ollama' ? generatorId.replace(/^ollama:/, '') : ''
  const selectedProvider = providers.find((item) => item.id === providerId)
  const generatorName = providerType === 'deepseek' ? 'DeepSeek Flash' : selectedProvider?.name || 'NAS Ollama'
  const draftWeight = useMemo(() => weightedLength(draft), [draft])
  const hasDraft = Boolean(draft.trim())
  const canPublish = hasDraft && draftWeight <= 280 && !publishing && !generating

  function selectMode(mode) {
    if (mode === 'deepseek') {
      setGeneratorId('deepseek')
      return
    }
    const nextId = providerId || providers[0]?.id || ''
    setGeneratorId(nextId ? `ollama:${nextId}` : 'ollama:')
  }

  async function generateDraft() {
    if (!generatorId || (providerType === 'ollama' && !providerId)) return setError('请选择生成模型。')
    if (brief.trim().length < 8) return setError('请至少填写 8 个字符的已核实资讯素材。')
    setGenerating(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/x-ai-news', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'generate', providerType, providerId, brief }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setDraft(payload.draft || '')
      setGeneration(payload)
      setNotice(`草稿已由 ${payload.providerName || generatorName} · ${payload.model || selectedProvider?.model || ''} 生成，请复核后手动发布。`)
    } catch (generateError) {
      setError(generateError?.message || '模型生成失败。')
    } finally {
      setGenerating(false)
    }
  }

  async function publishDraft() {
    if (!canPublish) return
    if (!window.confirm('确认把当前草稿发布到站长 X 账号？发布后会立即公开。')) return
    setPublishing(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/x-ai-news', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'publish', text: draft }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice('AI 资讯已发布到 X。')
      setData((current) => ({
        ...(current || {}),
        lastRun: { at: Date.now(), ok: true, text: payload.text, weight: payload.weight, postId: payload.post?.id, postUrl: payload.post?.url },
      }))
    } catch (publishError) {
      setError(publishError?.message || '发布到 X 失败。')
      await refresh()
    } finally {
      setPublishing(false)
    }
  }

  const lastRun = data?.lastRun
  return (
    <Section
      title="手动任务"
      description="粘贴已核实素材，生成草稿后确认才会发到 X。"
      className="mb-4"
      actions={
        lastRun ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusPill tone={lastRun.ok ? 'success' : 'danger'} size="sm">最近发布{lastRun.ok ? '成功' : '失败'}</StatusPill>
            <span className="text-[11px] text-[#82847a]">{formatTime(lastRun.at)}</span>
            {lastRun.postUrl ? <a href={lastRun.postUrl} target="_blank" rel="noreferrer" className="text-[12px] text-sky-700 hover:underline dark:text-sky-300">查看 X 帖子</a> : null}
          </div>
        ) : (
          <span className="text-[12px] text-[#82847a]">DeepSeek · {providers.length} 个 NAS 服务可用</span>
        )
      }
    >
      {error ? <div role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[12px] font-semibold text-[#34352f] dark:text-gray-200">生成模型</p>
          <div role="tablist" aria-label="生成模型" className="grid max-w-md grid-cols-2 gap-1 rounded-xl bg-[#f0f1eb] p-1.5 dark:bg-[#151c25]">
            {[
              { id: 'deepseek', label: 'DeepSeek', hint: 'Flash' },
              { id: 'ollama', label: 'Ollama', hint: 'NAS Qwen' },
            ].map((item) => {
              const selected = providerType === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  disabled={loading || generating || publishing}
                  onClick={() => selectMode(item.id)}
                  className={`${modeTabClass} ${selected ? 'bg-white text-[#25261f] shadow-sm dark:bg-[#253041] dark:text-white' : 'text-[#77796e] hover:text-[#3f4039] dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-[11px]">{item.hint}</span>
                </button>
              )
            })}
          </div>
        </div>
        {providerType === 'ollama' ? (
          <Field className="mb-0 lg:w-80" label="NAS 服务">
            <select
              value={providerId}
              onChange={(event) => setGeneratorId(`ollama:${event.target.value}`)}
              disabled={loading || generating || publishing}
              className={inputClass}
            >
              {!providers.length ? <option value="">暂无可用服务</option> : null}
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>NAS Ollama · {provider.name} · {provider.model}</option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Field className="mb-0" label="1. 已核实的资讯素材 / 主题">
          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={8}
            maxLength={4000}
            placeholder={'粘贴你已确认的事实、数字、来源链接或要点。\n模型不会代替你核实事实，因此不要只写“今天有什么 AI 新闻”。'}
            className={inputClass}
          />
        </Field>
        <Field className="mb-0" label="2. 可编辑发布草稿">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={8}
            placeholder="生成结果会出现在这里；也可以直接粘贴并手动发布。"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#e2e4da] pt-3 dark:border-[#243041]">
        <AdminButton
          type="button"
          variant={hasDraft ? 'default' : 'primary'}
          onClick={generateDraft}
          disabled={loading || generating || publishing || !generatorId || (providerType === 'ollama' && !providerId) || brief.trim().length < 8}
        >
          {generating ? '生成中…' : `调用 ${providerType === 'deepseek' ? 'DeepSeek' : 'Qwen'} 生成草稿`}
        </AdminButton>
        <span className="text-[11px] text-[#85877c]">NAS 冷启动可能需要 30–120 秒；生成记录会进入调用审计。</span>
        {generation?.taskId ? <Link href="/admin/deepseek-tasks" className="text-[11px] text-sky-700 hover:underline dark:text-sky-300">查看生成审计</Link> : null}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className={`font-mono text-[11px] ${draftWeight > 280 ? 'text-rose-600' : 'text-[#85877c]'}`}>X 加权长度 {draftWeight} / 280</span>
          <AdminButton type="button" variant="primary" onClick={publishDraft} disabled={!canPublish}>
            {publishing ? '发布中…' : '确认并发布到 X'}
          </AdminButton>
        </div>
      </div>
      {lastRun?.error ? <p className="mb-0 mt-3 text-xs text-rose-600">{lastRun.error}</p> : null}
    </Section>
  )
}
