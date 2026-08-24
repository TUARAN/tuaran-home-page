'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'

const PERIODS = [
  { id: 'morning', label: '早安' },
  { id: 'noon', label: '午安' },
  { id: 'evening', label: '晚安' },
]
const CULTURE_STORY_SLOTS = [
  { id: 'culture_morning', label: '上午短故事', time: '10:00' },
  { id: 'culture_afternoon', label: '下午短故事', time: '16:00' },
  { id: 'culture_evening', label: '晚间短故事', time: '20:00' },
]
const CULTURE_CATEGORY_LABELS = {
  guoxue: '国学哲思',
  chinese_story: '中华寓言 / 历史',
  foreign_fable: '国外童话 / 寓言',
}
const inputClass = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-5 text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'
const periodLabel = (period) => PERIODS.find((item) => item.id === period)?.label || period
const generationModeLabel = (mode) => ({ deepseek: 'DeepSeek Flash', ollama: 'Ollama Qwen', template: '模板库', llm: 'DeepSeek Flash' })[mode] || mode
const fieldClass = 'mb-3 flex flex-col gap-1 text-[12px] font-semibold text-[#34352f] dark:text-gray-200'

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(Number(value))
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false })
}

function Field({ label, className = '', children }) {
  return <label className={`${fieldClass} ${className}`.trim()}>{label}{children}</label>
}

export default function MorningGreetingClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [drafts, setDrafts] = useState({})
  const [generationMode, setGenerationMode] = useState('deepseek')
  const [llmIntent, setLlmIntent] = useState('')
  const [ollamaProviderId, setOllamaProviderId] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/morning-greeting', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
      setGenerationMode(payload.generationMode || 'deepseek')
      setLlmIntent(payload.llmIntent || '')
      setOllamaProviderId(payload.ollamaProviderId || '')
    } catch (fetchError) {
      setError(fetchError?.message || '每日问候模板读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const templates = data?.templates || []
  const lastRuns = data?.lastRuns || {}
  const cultureRuns = data?.cultureRuns || {}
  const xArticleRun = data?.xArticleRun || null

  async function saveTemplate(template) {
    setSaving(true); setError(''); setNotice('')
    try {
      const draft = drafts[template.id] || {}
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...template, ...draft }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setDrafts((current) => { const next = { ...current }; delete next[template.id]; return next })
      setNotice('模板已保存。')
      await refresh()
    } catch (saveError) { setError(saveError?.message || '保存失败。') } finally { setSaving(false) }
  }

  async function togglePause() {
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: data?.paused ? 'resume' : 'pause' }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setNotice(data?.paused ? '已恢复全部自动任务。' : '已暂停，所有自动发布都不会执行。')
      await refresh()
    } catch (pauseError) { setError(pauseError?.message || '状态切换失败。') } finally { setSaving(false) }
  }

  async function saveGenerationSettings() {
    if (generationMode !== 'template' && !llmIntent.trim()) return setError('生成意图不能为空。')
    if (generationMode === 'ollama' && !ollamaProviderId) return setError('请选择 NAS Ollama 服务。')
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'save-generation', mode: generationMode, intent: llmIntent, ollamaProviderId }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice(generationMode === 'template' ? '已切换到模板库模式。' : `已切换到 ${generationModeLabel(generationMode)}；下个时段将生成文案后直接发推。`)
      await refresh()
    } catch (saveError) { setError(saveError?.message || '生成方式保存失败。') } finally { setSaving(false) }
  }

  function changeDraft(id, key, value) {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), [key]: value } }))
  }

  const appliedMode = data?.generationMode || 'deepseek'
  const isGenerationDirty = generationMode !== appliedMode
    || (generationMode !== 'template' && llmIntent !== (data?.llmIntent || ''))
    || (generationMode === 'ollama' && ollamaProviderId !== (data?.ollamaProviderId || ''))

  return (
    <AdminPage
      title="X 发布任务"
      description="管理每日问候、文化短故事和 X 长文章自动发布。"
      actions={<AdminButton type="button" onClick={() => refresh()} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <Section
          title="自动任务"
          description="每天自动发布三条问候、三条文化短故事和一篇 X Article，不经人工审核。"
          className="mb-4"
          actions={
            <>
              <StatusPill tone={data?.paused ? 'warning' : 'success'} size="sm">{data?.paused ? '已暂停' : '运行中'}</StatusPill>
              <AdminButton type="button" onClick={togglePause} disabled={saving || loading} variant={data?.paused ? 'primary' : 'ghost'}>{data?.paused ? '恢复运行' : '暂停自动化'}</AdminButton>
            </>
          }
        >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[12px] font-semibold text-[#34352f] dark:text-gray-200">问候 · 08:00 / 12:00 / 22:00</p>
            <div className="grid gap-2 md:grid-cols-3">{['morning', 'noon', 'evening'].map((item) => { const run = lastRuns[item]; return <div key={item} className="rounded-lg border border-[#e2e4da] px-3 py-2.5 dark:border-[#243041]"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{periodLabel(item)}</strong><StatusPill tone={run?.ok ? 'success' : run ? 'danger' : 'neutral'} size="sm">{run?.ok ? '成功' : run ? '失败' : '暂无'}</StatusPill></div><p className="mb-0 mt-1 text-[11px] text-[#82847a]">{formatTime(run?.at)}{run?.mode ? ` · ${generationModeLabel(run.mode)}` : ''}{run?.styleLabel ? ` · ${run.styleLabel}` : ''}{run?.model ? ` · ${run.model}` : ''}</p>{run?.postUrl ? <a href={run.postUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-[11px] text-sky-700 hover:underline dark:text-sky-300">查看 X 帖子</a> : null}{run?.error ? <p className="mb-0 mt-1 break-words text-[11px] text-rose-600">{run.error}</p> : null}</div> })}</div>
          </div>

          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#34352f] dark:text-gray-200">文化短故事 · 10:00 / 16:00 / 20:00</p>
            <p className="mb-2 text-[11px] leading-5 text-[#85877c]">每条约 105—130 个汉字，讲清故事和含义。15 条循环配比：国学哲思 40%、中华寓言或历史故事 40%、国外童话或寓言 20%。问候选择模板方式时，文化短故事仍由 DeepSeek 生成。</p>
            <div className="grid gap-2 md:grid-cols-3">{CULTURE_STORY_SLOTS.map((item) => { const run = cultureRuns[item.id]; return <div key={item.id} className="rounded-lg border border-[#e2e4da] px-3 py-2.5 dark:border-[#243041]"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{item.label}</strong><StatusPill tone={run?.ok ? 'success' : run ? 'danger' : 'neutral'} size="sm">{run?.ok ? '成功' : run ? '失败' : '暂无'}</StatusPill></div><p className="mb-0 mt-1 text-[11px] text-[#82847a]">{item.time}{run?.at ? ` · ${formatTime(run.at)}` : ''}{run?.category ? ` · ${CULTURE_CATEGORY_LABELS[run.category] || run.category}` : ''}</p>{run?.postUrl ? <a href={run.postUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-[11px] text-sky-700 hover:underline dark:text-sky-300">查看 X 帖子</a> : null}{run?.error ? <p className="mb-0 mt-1 break-words text-[11px] text-rose-600">{run.error}</p> : null}</div> })}</div>
          </div>

          <div>
            <p className="mb-1 text-[12px] font-semibold text-[#34352f] dark:text-gray-200">X 长文章 · 14:00</p>
            <p className="mb-2 text-[11px] leading-5 text-[#85877c]">浏览器插件每天随机领取一篇站内文章，保留兼容的链接、排版和图片后发布到 X Articles；领取、图片上传或页面加载失败会自动重试。</p>
            <div className="rounded-lg border border-[#e2e4da] px-3 py-2.5 dark:border-[#243041]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm">{xArticleRun?.title || '等待插件领取'}</strong>
                <StatusPill
                  tone={xArticleRun?.status === 'published' ? 'success' : ['failed', 'uncertain'].includes(xArticleRun?.status) ? 'danger' : 'neutral'}
                  size="sm"
                >
                  {xArticleRun?.status === 'published' ? '成功' : xArticleRun?.status === 'failed' ? '等待重试' : xArticleRun?.status === 'uncertain' ? '待确认' : xArticleRun ? '已领取' : '暂无'}
                </StatusPill>
              </div>
              <p className="mb-0 mt-1 text-[11px] text-[#82847a]">
                14:00{xArticleRun?.updatedAt || xArticleRun?.createdAt ? ` · ${formatTime(xArticleRun.updatedAt || xArticleRun.createdAt)}` : ''}{xArticleRun?.attempts ? ` · 尝试 ${xArticleRun.attempts} 次` : ''}
              </p>
              {xArticleRun?.xArticleUrl ? <a href={xArticleRun.xArticleUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-[11px] text-sky-700 hover:underline dark:text-sky-300">查看 X Article</a> : null}
              {xArticleRun?.detail ? <p className="mb-0 mt-1 break-words text-[11px] text-[#77796e] dark:text-gray-400">{xArticleRun.detail}</p> : null}
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="mb-0 text-[12px] font-semibold text-[#34352f] dark:text-gray-200">生成方式</p>
              <span className="text-[11px] text-[#85877c]">当前生效：{generationModeLabel(appliedMode)}</span>
              {isGenerationDirty ? <span className="text-[11px] text-amber-700 dark:text-amber-300">切换尚未生效，保存后才用于下一次自动发布</span> : null}
            </div>
            <div role="tablist" aria-label="自动问候生成方式" className="grid min-w-0 grid-cols-3 gap-2 rounded-xl bg-[#f0f1eb] p-1.5 dark:bg-[#151c25]">
              {[
                { id: 'deepseek', label: 'DeepSeek', hint: 'Flash' },
                { id: 'ollama', label: 'Ollama', hint: 'NAS Qwen' },
                { id: 'template', label: '模板', hint: '固定三条' },
              ].map((item) => (
                <button
                  key={item.id}
                  id={`generation-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={generationMode === item.id}
                  aria-controls={`generation-panel-${item.id}`}
                  onClick={() => setGenerationMode(item.id)}
                  className={`rounded-lg px-3 py-3 text-left transition ${generationMode === item.id ? 'bg-white text-[#25261f] shadow-sm dark:bg-[#253041] dark:text-white' : 'text-[#77796e] hover:text-[#3f4039] dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {appliedMode === item.id ? <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">生效</span> : null}
                  </span>
                  <span className="mt-0.5 block text-[11px]">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e2e4da] bg-[#fbfbf8] p-4 dark:border-[#243041] dark:bg-[#0f141d]">
            {generationMode !== 'template' ? (
              <div id={`generation-panel-${generationMode}`} role="tabpanel" aria-labelledby={`generation-tab-${generationMode}`}>
                {generationMode === 'ollama' ? <Field label="NAS Ollama 服务">
                  <select value={ollamaProviderId} onChange={(event) => setOllamaProviderId(event.target.value)} className={inputClass}>
                    {!data?.ollamaProviders?.length ? <option value="">暂无可用服务</option> : null}
                    {(data?.ollamaProviders || []).map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.model}</option>)}
                  </select>
                </Field> : null}
                <Field className="mb-0" label="意图（提示语）"><textarea value={llmIntent} onChange={(event) => setLlmIntent(event.target.value)} rows={4} maxLength={4000} placeholder="告诉模型希望写出什么样的问候文案" className={inputClass} /></Field>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="m-0 flex-1 text-[11px] leading-5 text-[#85877c]">每次从人间烟火、轻松俏皮、诗意留白、微小行动、好奇联想中随机选择一种，再由当前模型结合日期、时段和内容意图生成。</p>
                  <AdminButton type="button" variant="primary" disabled={saving || loading || !isGenerationDirty || !llmIntent.trim() || (generationMode === 'ollama' && !ollamaProviderId)} onClick={saveGenerationSettings}>{saving ? '保存中…' : isGenerationDirty ? '保存并应用' : '已应用'}</AdminButton>
                </div>
              </div>
            ) : (
              <div id="generation-panel-template" role="tabpanel" aria-labelledby="generation-tab-template">
                <p className="mb-1 text-[13px] font-semibold text-[#34352f] dark:text-gray-200">按时段发布固定问候</p>
                <p className="m-0 text-[11px] leading-5 text-[#85877c]">早安、午安、晚安各一条，文案可在下方随时修改。只有当前生效方式为模板时才会用于发布。</p>
                <div className="mt-3 flex justify-end">
                  <AdminButton type="button" variant="primary" disabled={saving || loading || !isGenerationDirty} onClick={saveGenerationSettings}>{saving ? '保存中…' : isGenerationDirty ? '保存并应用' : '已应用'}</AdminButton>
                </div>
              </div>
            )}
          </div>
        </div>
        </Section>

        <Section title="三条问候" description="早安、午安、晚安各一条；{date} 会在发布时替换为当天日期。">
        <div className="grid gap-3 lg:grid-cols-3">{templates.map((template) => {
          const draft = drafts[template.id] || {}
          return <article key={template.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#e2e4da] bg-[#fbfbf8] p-3 dark:border-[#243041] dark:bg-[#0f141d]">
            <div className="min-w-0 flex flex-col gap-2">
              <strong className="text-sm text-[#34352f] dark:text-gray-100">{periodLabel(template.period)}</strong>
              <textarea aria-label={`${periodLabel(template.period)}文案`} value={draft.text ?? template.text} onChange={(event) => changeDraft(template.id, 'text', event.target.value)} rows={6} className={inputClass} />
            </div>
            <div className="mt-auto flex justify-end">
              <AdminButton type="button" size="sm" variant="ghost" disabled={saving || !draft.text?.trim()} onClick={() => saveTemplate(template)}>保存修改</AdminButton>
            </div>
          </article>
        })}</div>
        </Section>
    </AdminPage>
  )
}
