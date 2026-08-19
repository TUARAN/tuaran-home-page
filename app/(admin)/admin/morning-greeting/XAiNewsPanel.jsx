'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminButton, Section, StatusPill } from '../../components/ui'

const inputClass = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-5 text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'
const fieldClass = 'mb-3 flex flex-col gap-1 text-[12px] font-semibold text-[#34352f] dark:text-gray-200'

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
  const providerType = generatorId === 'deepseek' ? 'deepseek' : 'ollama'
  const providerId = providerType === 'ollama' ? generatorId.replace(/^ollama:/, '') : ''
  const selectedProvider = providers.find((item) => item.id === providerId)
  const generatorName = providerType === 'deepseek' ? 'DeepSeek Flash' : selectedProvider?.name || 'NAS Ollama'
  const draftWeight = useMemo(() => weightedLength(draft), [draft])
  const canPublish = Boolean(draft.trim()) && draftWeight <= 280 && !publishing && !generating

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
      description="粘贴已核实的 AI 资讯素材，选择 DeepSeek Flash 或 NAS Ollama Qwen 生成草稿；草稿可编辑，确认后才会发布到 X。"
      className="mb-4"
      actions={<StatusPill tone="success" size="sm">DeepSeek + {providers.length} 个 Ollama 服务</StatusPill>}
    >
      {error ? <div role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex flex-col">
          <Field label="生成模型"><select value={generatorId} onChange={(event) => setGeneratorId(event.target.value)} disabled={loading || generating || publishing} className={inputClass}><option value="deepseek">DeepSeek Flash</option>{providers.map((provider) => <option key={provider.id} value={`ollama:${provider.id}`}>NAS Ollama · {provider.name} · {provider.model}</option>)}</select></Field>
          <Field className="mb-0" label="已核实的资讯素材 / 主题"><textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={8} maxLength={4000} placeholder={'粘贴你已确认的事实、数字、来源链接或要点。\n模型不会代替你核实事实，因此不要只写“今天有什么 AI 新闻”。'} className={inputClass} /></Field>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <AdminButton type="button" variant="primary" onClick={generateDraft} className="self-end" disabled={loading || generating || publishing || !generatorId || brief.trim().length < 8}>{generating ? '生成中…' : `调用 ${providerType === 'deepseek' ? 'DeepSeek' : 'Qwen'} 生成草稿`}</AdminButton>
            <span className="text-[11px] text-[#85877c]">NAS 冷启动可能需要 30–120 秒；生成记录会进入“调用记录与审计”。</span>
          </div>
        </div>

        <div className="flex flex-col">
          <Field label="可编辑发布草稿"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} placeholder="生成结果会出现在这里；也可以直接粘贴并手动发布。" className={inputClass} /></Field>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className={`font-mono text-[11px] ${draftWeight > 280 ? 'text-rose-600' : 'text-[#85877c]'}`}>X 加权长度 {draftWeight} / 280</span>
            {generation?.taskId ? <Link href="/admin/deepseek-tasks" className="text-[11px] text-sky-700 hover:underline dark:text-sky-300">查看生成审计</Link> : null}
            <div className="ml-auto"><AdminButton type="button" variant="primary" className="self-end" onClick={publishDraft} disabled={!canPublish}>{publishing ? '发布中…' : '确认并发布到 X'}</AdminButton></div>
          </div>
          {lastRun ? <div className="mt-4 rounded-lg border border-[#e2e4da] bg-[#fbfbf8] px-3 py-2 text-xs dark:border-[#243041] dark:bg-[#0f141d]"><div className="flex flex-wrap items-center gap-2"><StatusPill tone={lastRun.ok ? 'success' : 'danger'} size="sm">最近发布{lastRun.ok ? '成功' : '失败'}</StatusPill><span className="text-[#82847a]">{formatTime(lastRun.at)}</span>{lastRun.postUrl ? <a href={lastRun.postUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline dark:text-sky-300">查看 X 帖子</a> : null}</div>{lastRun.error ? <p className="mb-0 mt-2 text-rose-600">{lastRun.error}</p> : null}</div> : null}
        </div>
      </div>
    </Section>
  )
}
