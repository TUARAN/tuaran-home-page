'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, AdminPagination, EmptyState, Section, StatusPill } from '../../components/ui'
import XAiNewsPanel from './XAiNewsPanel'

const PAGE_SIZE = 10
const PERIODS = [
  { id: 'all', label: '全部时段' },
  { id: 'morning', label: '早安' },
  { id: 'noon', label: '午安' },
  { id: 'evening', label: '晚安' },
]
const KINDS = [
  { id: 'quote', label: '名言' },
  { id: 'story', label: '故事' },
  { id: 'reflection', label: '随想' },
]

const inputClass = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-5 text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'
const periodLabel = (period) => PERIODS.find((item) => item.id === period)?.label || period
const kindLabel = (kind) => KINDS.find((item) => item.id === kind)?.label || kind
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
  const [period, setPeriod] = useState('all')
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [offset, setOffset] = useState(0)
  const [newTemplate, setNewTemplate] = useState({ text: '', period: 'morning', contentKind: 'quote' })
  const [generationMode, setGenerationMode] = useState('deepseek')
  const [llmIntent, setLlmIntent] = useState('')
  const [ollamaProviderId, setOllamaProviderId] = useState('')

  const refresh = useCallback(async ({ nextOffset = offset, nextPeriod = period, nextQuery = query } = {}) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ offset: String(nextOffset), limit: String(PAGE_SIZE), period: nextPeriod })
      if (nextQuery) params.set('q', nextQuery)
      const response = await fetch(`/api/admin/morning-greeting?${params}`, { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
      setGenerationMode(payload.generationMode || 'deepseek')
      setLlmIntent(payload.llmIntent || '')
      setOllamaProviderId(payload.ollamaProviderId || '')
      setOffset(nextOffset)
      setPeriod(nextPeriod)
      setQuery(nextQuery)
    } catch (fetchError) {
      setError(fetchError?.message || '每日问候模板读取失败。')
    } finally {
      setLoading(false)
    }
  }, [offset, period, query])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const templates = data?.templates || []
  const stats = data?.stats || {}
  const lastRuns = data?.lastRuns || {}

  async function saveTemplate(template, changes = {}) {
    setSaving(true); setError(''); setNotice('')
    try {
      const draft = drafts[template.id] || {}
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...template, ...draft, ...changes }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setDrafts((current) => { const next = { ...current }; delete next[template.id]; return next })
      setNotice('模板已保存。')
      await refresh()
    } catch (saveError) { setError(saveError?.message || '保存失败。') } finally { setSaving(false) }
  }

  async function addTemplate(event) {
    event.preventDefault()
    if (!newTemplate.text.trim()) return setError('文案不能为空。')
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...newTemplate, enabled: true, sortOrder: stats.byPeriod?.[newTemplate.period]?.total || 0 }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNewTemplate((current) => ({ ...current, text: '' }))
      setNotice('已新增模板。')
      await refresh({ nextOffset: 0, nextPeriod: newTemplate.period, nextQuery: '' })
      setSearchInput('')
    } catch (addError) { setError(addError?.message || '新增失败。') } finally { setSaving(false) }
  }

  async function removeTemplate(template) {
    if (!window.confirm('确认删除这条文案？删除后不会再被随机选中。')) return
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch(`/api/admin/morning-greeting?id=${template.id}`, { method: 'DELETE' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setNotice('已删除。')
      await refresh({ nextOffset: templates.length === 1 ? Math.max(0, offset - PAGE_SIZE) : offset })
    } catch (deleteError) { setError(deleteError?.message || '删除失败。') } finally { setSaving(false) }
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
      setNotice(data?.paused ? '已恢复每日三次问候。' : '已暂停，三个时段都不会发布。')
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

  return (
    <AdminPage
      title="X 发布任务"
      description="集中管理手动 AI 资讯发布与每天 08:00、12:00、22:00 的自动问候；生成模型、模板和发布结果均可追踪。"
      actions={<AdminButton type="button" onClick={() => refresh()} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <XAiNewsPanel />

      <Section
        title="自动任务"
        description="每天早、中、晚自动生成并发布问候。可选择 DeepSeek Flash、NAS Ollama Qwen 或模板库；模型文案生成后直接发布，不进入人工审核。"
        actions={
          <>
            <StatusPill tone={data?.paused ? 'warning' : 'success'} size="sm">{data?.paused ? '已暂停' : '运行中'}</StatusPill>
            <AdminButton type="button" onClick={togglePause} disabled={saving || loading} variant={data?.paused ? 'primary' : 'ghost'}>{data?.paused ? '恢复运行' : '暂停自动化'}</AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div role="tablist" aria-label="自动问候生成方式" className="grid min-w-0 grid-cols-3 gap-2 rounded-xl bg-[#f0f1eb] p-1.5 dark:bg-[#151c25]">
            {[
              { id: 'deepseek', label: 'DeepSeek', hint: 'Flash' },
              { id: 'ollama', label: 'Ollama', hint: 'NAS Qwen' },
              { id: 'template', label: '模板库', hint: '稳定随机' },
            ].map((item) => <button key={item.id} id={`generation-tab-${item.id}`} type="button" role="tab" aria-selected={generationMode === item.id} aria-controls={`generation-panel-${item.id}`} onClick={() => setGenerationMode(item.id)} className={`rounded-lg px-3 py-3 text-left transition ${generationMode === item.id ? 'bg-white text-[#25261f] shadow-sm dark:bg-[#253041] dark:text-white' : 'text-[#77796e] hover:text-[#3f4039] dark:text-gray-400 dark:hover:text-gray-200'}`}><span className="block text-sm font-semibold">{item.label}</span><span className="mt-0.5 block text-[11px]">{item.hint}</span></button>)}
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
                <Field className="mb-0" label="意图（提示语）"><textarea value={llmIntent} onChange={(event) => setLlmIntent(event.target.value)} rows={5} maxLength={4000} placeholder="告诉模型希望写出什么样的问候文案" className={inputClass} /></Field>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="m-0 flex-1 text-[11px] leading-5 text-[#85877c]">系统会自动补充日期、当前时段、纯文案输出和 X 长度限制；这里只需要写内容意图。</p>
                  <AdminButton type="button" variant="primary" disabled={saving || loading || !llmIntent.trim() || (generationMode === 'ollama' && !ollamaProviderId)} onClick={saveGenerationSettings}>{saving ? '保存中…' : '保存并应用'}</AdminButton>
                </div>
              </div>
            ) : (
              <div id="generation-panel-template" role="tabpanel" aria-labelledby="generation-tab-template" className="flex min-h-[148px] flex-col justify-between">
                <div>
                  <p className="mb-1 text-[13px] font-semibold text-[#34352f] dark:text-gray-200">从已启用模板中随机发布</p>
                  <p className="m-0 text-[11px] leading-5 text-[#85877c]">每个发布时段会从对应的早安、午安或晚安模板池中随机选择一条；可在下方模板库新增、修改、停用或删除文案。</p>
                  <p className="mb-0 mt-3 text-[12px] text-[#63655b] dark:text-gray-300">当前共启用 <strong className="text-[#25261f] dark:text-white">{stats.enabled || 0}</strong> 条模板：早安 {stats.byPeriod?.morning?.enabled || 0} 条、午安 {stats.byPeriod?.noon?.enabled || 0} 条、晚安 {stats.byPeriod?.evening?.enabled || 0} 条。</p>
                </div>
                <div className="mt-3 flex justify-end">
                  <AdminButton type="button" variant="primary" disabled={saving || loading} onClick={saveGenerationSettings}>{saving ? '保存中…' : '保存并应用'}</AdminButton>
                </div>
              </div>
            )}
          </div>

          {generationMode === 'template' ? <>
            <Section title="新增问候" description="{date} 会在发布时替换为当天日期；新模板会自动进入对应时段的随机池。模板可随时维护，只有切到模板库模式时才参与发布。">
              <form onSubmit={addTemplate} className="grid gap-3 lg:grid-cols-[130px_130px_1fr_auto] items-end">
                <Field label="时段"><select value={newTemplate.period} onChange={(event) => setNewTemplate((current) => ({ ...current, period: event.target.value }))} className={inputClass}>{PERIODS.slice(1).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
                <Field label="内容类型"><select value={newTemplate.contentKind} onChange={(event) => setNewTemplate((current) => ({ ...current, contentKind: event.target.value }))} className={inputClass}>{KINDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
                <Field className="mb-0" label="文案"><textarea value={newTemplate.text} onChange={(event) => setNewTemplate((current) => ({ ...current, text: event.target.value }))} rows={3} placeholder={'例如：午安！今天是{date}。\n《论语》说……'} className={inputClass} /></Field>
                <AdminButton type="submit" variant="primary" disabled={saving || !newTemplate.text.trim()} className="self-end">{saving ? '保存中…' : '新增模板'}</AdminButton>
              </form>
            </Section>

            <Section title="模板库" description="每页显示 10 条，支持按时段筛选、搜索、修改和停用。" className="mt-4" actions={<StatusPill tone={data?.paused ? 'warning' : 'success'} size="sm">{data?.paused ? '已暂停' : '运行中'}</StatusPill>}>
              <div className="mb-4 flex flex-col gap-2 md:flex-row">
                <div className="flex flex-wrap gap-2">{PERIODS.map((item) => <button key={item.id} type="button" onClick={() => { setSearchInput(''); refresh({ nextOffset: 0, nextPeriod: item.id, nextQuery: '' }) }} className={`rounded-full border px-3 py-1.5 text-xs ${period === item.id ? 'border-[#15140f] bg-[#15140f] text-white dark:border-white dark:bg-white dark:text-black' : 'border-[#d8dad0] text-[#63645a] hover:bg-[#edefe7] dark:border-[#2d3744] dark:text-gray-300 dark:hover:bg-[#151c25]'}`}>{item.label}</button>)}</div>
                <form className="ml-auto flex w-full items-end gap-2 md:max-w-md" onSubmit={(event) => { event.preventDefault(); refresh({ nextOffset: 0, nextQuery: searchInput.trim() }) }}><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="搜索名言、人物或故事" className={inputClass} /><AdminButton type="submit" disabled={loading} className="self-end">搜索</AdminButton></form>
              </div>

              {!loading && !templates.length ? <EmptyState title="没有匹配的文案" description="换一个关键词或时段试试。" /> : <div className="overflow-hidden rounded-xl border border-[#e2e4da] bg-[#fbfbf8] divide-y divide-[#e2e4da] dark:border-[#243041] dark:bg-[#0f141d] dark:divide-[#243041]">{templates.map((template) => {
                const draft = drafts[template.id] || {}
                return <article key={template.id} className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
                  <div className="min-w-0 flex flex-col gap-2">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><StatusPill tone={template.enabled ? 'success' : 'neutral'} size="sm" icon={false}>{template.enabled ? '启用' : '停用'}</StatusPill><span className="text-[11px] text-[#77796e]">{periodLabel(template.period)} · {kindLabel(template.contentKind)}</span><span className="font-mono text-[10px] text-[#94968b]">#{template.id}</span></div>
                    <textarea value={draft.text ?? template.text} onChange={(event) => changeDraft(template.id, 'text', event.target.value)} rows={2} className={inputClass} />
                  </div>
                  <div className="flex min-h-[82px] flex-wrap items-end justify-end gap-2 lg:min-h-[84px]">
                    <select aria-label="时段" value={draft.period ?? template.period} onChange={(event) => changeDraft(template.id, 'period', event.target.value)} className="rounded-lg border border-[#d8dad0] bg-white px-2 py-1.5 text-xs dark:border-[#2d3744] dark:bg-[#10161f]">{PERIODS.slice(1).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
                    <select aria-label="内容类型" value={draft.contentKind ?? template.contentKind} onChange={(event) => changeDraft(template.id, 'contentKind', event.target.value)} className="rounded-lg border border-[#d8dad0] bg-white px-2 py-1.5 text-xs dark:border-[#2d3744] dark:bg-[#10161f]">{KINDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
                    <button type="button" disabled={saving} onClick={() => saveTemplate(template, { enabled: !template.enabled })} className="rounded-lg border border-[#caccc0] px-2.5 py-1 text-[11.5px] text-[#63645a] hover:bg-[#edefe7] disabled:opacity-50 dark:border-[#2d3744] dark:text-[#9aa6b6]">{template.enabled ? '停用' : '启用'}</button>
                    <AdminButton type="button" size="sm" variant="ghost" disabled={saving} onClick={() => saveTemplate(template)}>保存</AdminButton>
                    <button type="button" disabled={saving} onClick={() => removeTemplate(template)} className="rounded-lg border border-rose-200 px-2.5 py-1 text-[11.5px] text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300">删除</button>
                  </div>
                </article>
              })}</div>}
              <AdminPagination total={data?.total || 0} offset={offset} limit={PAGE_SIZE} onOffsetChange={(nextOffset) => refresh({ nextOffset })} loading={loading} />
            </Section>
          </> : null}

          <div className="rounded-xl border border-[#e2e4da] p-4 dark:border-[#243041]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-sm font-semibold text-[#35372f] dark:text-gray-200">今日三个时段</h3>
              <StatusPill tone="neutral" size="sm">发布时间线</StatusPill>
            </div>
            <div className="grid gap-3 md:grid-cols-3">{['morning', 'noon', 'evening'].map((item) => { const run = lastRuns[item]; return <div key={item} className="rounded-lg border border-[#e2e4da] p-4 dark:border-[#243041]"><div className="mb-2 flex items-center justify-between"><strong className="text-sm">{periodLabel(item)}</strong><StatusPill tone={run?.ok ? 'success' : run ? 'danger' : 'neutral'} size="sm">{run?.ok ? '成功' : run ? '失败' : '暂无'}</StatusPill></div><p className="mb-1 text-xs text-[#82847a]">{formatTime(run?.at)}{run?.mode ? ` · ${generationModeLabel(run.mode)}` : ''}</p>{run?.model ? <p className="mb-1 text-[10px] text-[#94968b]">{run.model}</p> : null}{run?.postUrl ? <a href={run.postUrl} target="_blank" rel="noreferrer" className="break-all text-xs text-sky-700 hover:underline dark:text-sky-300">查看 X 帖子</a> : null}{run?.error ? <p className="mb-0 break-words text-xs text-rose-600">{run.error}</p> : null}</div> })}</div>
          </div>
        </div>
      </Section>
    </AdminPage>
  )
}
