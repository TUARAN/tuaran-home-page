'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminButton, EmptyState, Section, StatusPill } from '../../components/ui'

const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const INPUT_CLASS = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-6 text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const EMPTY_FORM = { name: '', baseUrl: '', defaultModel: '', authType: 'none', token: '', clientId: '', clientSecret: '', status: 'active', note: '' }
const OLLAMA_USES = [
  { name: 'X AI 资讯草稿', source: 'x-ai-news', taskTypes: ['manual-copy-generation'], scope: 'cloud' },
  { name: 'X 每日问候文案', source: 'x-daily-greeting', taskTypes: ['direct-post-copy'], scope: 'cloud' },
  { name: '服务连通测试', source: 'admin-llm-provider', taskTypes: ['connection-test'], scope: 'cloud' },
  { name: 'Mac 本地聊天', source: 'mac-nas-qwen', taskTypes: ['chat'], scope: 'local' },
]

function formatDate(value) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'
}

function formatModelOption(model) {
  const size = model.size > 0 ? ` · ${(model.size / (1024 ** 3)).toFixed(1)} GiB` : ''
  return `${model.displayName || model.name} — ${model.name}${size}`
}

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

export default function OllamaProvidersPanel({ onViewCalls }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState('')
  const [savingDefaultId, setSavingDefaultId] = useState('')
  const [modelStates, setModelStates] = useState({})
  const [selectedModels, setSelectedModels] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState('')
  const [formVisible, setFormVisible] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/llm-providers', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || 'Ollama 服务读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const loadModels = useCallback(async (provider, { announce = false } = {}) => {
    setModelStates((prev) => ({
      ...prev,
      [provider.id]: { ...(prev[provider.id] || {}), loading: true, error: '' },
    }))
    if (announce) {
      setError('')
      setNotice('')
    }
    try {
      const response = await fetch(`/api/admin/llm-providers/models?id=${encodeURIComponent(provider.id)}`, { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setModelStates((prev) => ({ ...prev, [provider.id]: { models: payload.models || [], loading: false, error: '' } }))
      setSelectedModels((prev) => ({ ...prev, [provider.id]: prev[provider.id] || provider.defaultModel }))
      if (announce) setNotice(`${provider.name} 的模型列表已刷新。`)
    } catch (modelError) {
      const message = modelError?.message || 'Ollama 模型列表读取失败。'
      setModelStates((prev) => ({
        ...prev,
        [provider.id]: { ...(prev[provider.id] || {}), loading: false, error: message },
      }))
      if (announce) setError(message)
    }
  }, [])

  useEffect(() => {
    for (const provider of data?.providers || []) {
      if (!modelStates[provider.id]) loadModels(provider)
    }
  }, [data?.providers, loadModels, modelStates])

  function resetForm() {
    setEditingId('')
    setForm(EMPTY_FORM)
    setFormVisible(false)
  }

  function startCreate() {
    setEditingId('')
    setForm(EMPTY_FORM)
    setFormVisible(true)
  }

  function startEdit(provider) {
    setEditingId(provider.id)
    setForm({
      name: provider.name || '',
      baseUrl: provider.baseUrl || '',
      defaultModel: provider.defaultModel || '',
      authType: provider.authType || 'none',
      token: '',
      clientId: '',
      clientSecret: '',
      status: provider.status || 'active',
      note: provider.note || '',
    })
    setFormVisible(true)
  }

  async function saveProvider() {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/llm-providers', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      resetForm()
      await refresh()
    } catch (saveError) {
      setError(saveError?.message || 'Ollama 服务保存失败。')
    } finally {
      setSaving(false)
    }
  }

  async function toggleProvider(provider) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/llm-providers', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: provider.id, status: provider.status === 'active' ? 'disabled' : 'active' }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (toggleError) {
      setError(toggleError?.message || '状态更新失败。')
    } finally {
      setSaving(false)
    }
  }

  async function testProvider(provider) {
    setTestingId(provider.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/llm-providers/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: provider.id }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice(`${provider.name} 已连通：${payload.model} 返回“${payload.content}”；测试调用已进入台账。`)
      await refresh()
    } catch (testError) {
      setError(testError?.message || 'Ollama 连通性测试失败。')
      await refresh()
    } finally {
      setTestingId('')
    }
  }

  async function setDefaultModel(provider) {
    const model = String(selectedModels[provider.id] || provider.defaultModel || '').trim()
    if (!model || model === provider.defaultModel) return
    if (!window.confirm('切换默认模型会影响 X AI 资讯草稿、每日问候和服务测试等云调用，是否继续？')) return

    setSavingDefaultId(provider.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/llm-providers', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: provider.id, defaultModel: model }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setSelectedModels((prev) => ({ ...prev, [provider.id]: model }))
      setNotice(`${provider.name} 的默认模型已切换为 ${model}。后续云调用将使用该模型。`)
      await refresh()
    } catch (saveError) {
      setError(saveError?.message || '默认模型切换失败。')
    } finally {
      setSavingDefaultId('')
    }
  }

  const providers = data?.providers || []
  const activeCount = providers.filter((item) => item.status === 'active').length

  return (
    <>
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <Section
        title="NAS · Ollama 使用场景"
        description="统一展示调用 NAS Qwen 的业务用途；云调用由线上站点发起，本地调用由 Mac 发起并将摘要同步到调用台账。"
        className="mb-4"
        actions={<span className="text-[12px] text-[#82847a]">{OLLAMA_USES.length} 个使用场景</span>}
      >
        <article className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="success" size="sm">NAS 自托管</StatusPill>
            <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">Ollama · Qwen</span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {OLLAMA_USES.map((item) => (
              <div key={item.source} className="rounded-md bg-[#f7f7f2] px-2.5 py-2 dark:bg-[#111a25]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[13px] font-medium text-[#3f4039] dark:text-gray-200">{item.name}</div>
                  <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${item.scope === 'local' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'}`}>
                    {item.scope === 'local' ? '本地调用' : '云调用'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <code className="font-mono text-[11px] text-[#67695d] dark:text-gray-300">{item.source}</code>
                  {item.taskTypes.map((taskType) => (
                    <code key={taskType} className="font-mono text-[11px] text-[#82847a] dark:text-gray-400">{taskType}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </Section>

      <Section
        title="NAS · Ollama 服务"
        description="配置可由 Cloudflare 访问的 Ollama API；测试与后续业务调用统一进入调用台账。"
        actions={!formVisible ? <AdminButton type="button" variant="primary" onClick={startCreate}>新增服务</AdminButton> : null}
      >
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          线上站点不能访问 192.168.x.x 或 NAS 局域网地址。请通过 Cloudflare Tunnel 提供 HTTPS 域名，并优先使用 Access Service Token；不要把 Ollama 11434 端口直接暴露到公网。
        </div>
        <div className="mb-3 text-[12px] text-[#82847a]">共 {providers.length} 个服务，{activeCount} 个启用</div>
        {loading ? <p className="py-4 text-sm text-[#82847a]">加载中…</p> : !providers.length ? (
          <EmptyState title="暂无 Ollama 服务" description="添加 NAS 的 HTTPS 端点后，可在这里测试调用并查看 Token、耗时与失败原因。" />
        ) : (
          <div className="space-y-2">
            {providers.map((provider) => (
              <article key={provider.id} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={provider.status === 'active' ? 'success' : 'neutral'} size="sm">{provider.status === 'active' ? '启用' : '已停用'}</StatusPill>
                      <StatusPill tone={provider.lastCheckStatus === 'succeeded' ? 'success' : provider.lastCheckStatus === 'failed' ? 'danger' : 'neutral'} size="sm">
                        {provider.lastCheckStatus === 'succeeded' ? '连通' : provider.lastCheckStatus === 'failed' ? '异常' : '未测试'}
                      </StatusPill>
                      <strong className="text-[14px] text-[#15140f] dark:text-gray-100">{provider.name}</strong>
                    </div>
                    {(() => {
                      const modelState = modelStates[provider.id] || {}
                      const installedModels = modelState.models || []
                      const models = installedModels.some((item) => item.name === provider.defaultModel)
                        ? installedModels
                        : [{ name: provider.defaultModel, displayName: provider.defaultModel, size: 0 }, ...installedModels]
                      const selectedModel = selectedModels[provider.id] || provider.defaultModel
                      return (
                        <div className="mt-3 rounded-lg bg-[#f7f7f2] p-2.5 dark:bg-[#111a25]">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <label className="min-w-0 flex-1 text-[12px] text-[#67695d] dark:text-gray-300">
                              默认模型
                              <select
                                aria-label={`${provider.name} 默认模型`}
                                className={`${CONTROL_CLASS} mt-1 w-full`}
                                value={selectedModel}
                                disabled={modelState.loading || !models.length}
                                onChange={(event) => setSelectedModels((prev) => ({ ...prev, [provider.id]: event.target.value }))}
                              >
                                {models.map((model) => <option key={model.name} value={model.name}>{formatModelOption(model)}</option>)}
                              </select>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <AdminButton type="button" variant="ghost" disabled={modelState.loading} onClick={() => loadModels(provider, { announce: true })}>
                                {modelState.loading ? '刷新中…' : '刷新模型列表'}
                              </AdminButton>
                              <AdminButton type="button" variant="primary" disabled={savingDefaultId === provider.id || selectedModel === provider.defaultModel} onClick={() => setDefaultModel(provider)}>
                                {savingDefaultId === provider.id ? '切换中…' : '设为默认'}
                              </AdminButton>
                            </div>
                          </div>
                          {modelState.error ? <p className="mt-2 text-[12px] text-rose-700 dark:text-rose-300">{modelState.error} 当前默认模型仍为 {provider.defaultModel}。</p> : null}
                          {/^qwen3\.8-27b(?::|$)/i.test(selectedModel) ? <p className="mt-2 text-[12px] text-amber-700 dark:text-amber-300">27B 模型使用 4096 上下文并按单请求执行；冷启动可能需要 60–90 秒。</p> : null}
                        </div>
                      )
                    })()}
                    <p className="mt-1.5 break-all font-mono text-[12px] text-[#82847a]">{provider.baseUrl}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-[#82847a]">
                      <span>{provider.usage.calls.toLocaleString()} 次调用</span>
                      <span>{provider.usage.totalTokens.toLocaleString()} tokens</span>
                      <span>最近测试 {formatDate(provider.lastCheckedAt)}</span>
                      <span>鉴权 {provider.authType === 'cloudflare_access' ? `Cloudflare Access · ${provider.authHint || '已配置'}` : provider.authType === 'bearer' ? `Bearer · ${provider.authHint || '已配置'}` : '无'}</span>
                    </div>
                    {provider.lastCheckDetail ? <p className="mt-1.5 text-[12px] text-[#67695d] dark:text-gray-400">{provider.lastCheckDetail}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminButton type="button" variant="ghost" onClick={() => onViewCalls(provider.id)}>查看调用</AdminButton>
                    <AdminButton type="button" variant="ghost" disabled={testingId === provider.id || provider.status !== 'active'} onClick={() => testProvider(provider)}>{testingId === provider.id ? '测试中…' : '测试调用'}</AdminButton>
                    <AdminButton type="button" variant="ghost" disabled={saving} onClick={() => startEdit(provider)}>编辑</AdminButton>
                    <AdminButton type="button" variant="ghost" disabled={saving} onClick={() => toggleProvider(provider)}>{provider.status === 'active' ? '停用' : '启用'}</AdminButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      {formVisible ? (
        <Section title={editingId ? '编辑 Ollama 服务' : '新增 Ollama 服务'} description="端点需提供 Ollama 原生 Chat API；Cloudflare Access 凭证只会加密保存并由服务端发送。" className="mt-4" actions={<AdminButton type="button" variant="ghost" onClick={resetForm}>取消</AdminButton>}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-[12px] text-[#67695d]">名称 *<input className={`${INPUT_CLASS} mt-1`} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="例如：家中 NAS · Qwen3" /></label>
            <label className="text-[12px] text-[#67695d]">HTTPS Base URL *<input className={`${INPUT_CLASS} mt-1`} value={form.baseUrl} onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))} placeholder="https://ollama.example.com" /></label>
            <label className="text-[12px] text-[#67695d]">默认模型 *<input className={`${INPUT_CLASS} mt-1`} value={form.defaultModel} onChange={(event) => setForm((prev) => ({ ...prev, defaultModel: event.target.value }))} placeholder="qwen3:8b" /></label>
            <label className="text-[12px] text-[#67695d]">鉴权方式<select className={`${CONTROL_CLASS} mt-1 w-full`} value={form.authType} onChange={(event) => setForm((prev) => ({ ...prev, authType: event.target.value, token: '', clientId: '', clientSecret: '' }))}><option value="none">无鉴权</option><option value="bearer">Bearer Token</option><option value="cloudflare_access">Cloudflare Access Service Token</option></select></label>
            {form.authType === 'bearer' ? <label className="text-[12px] text-[#67695d]">Bearer 访问令牌{editingId ? '（留空保持不变）' : ' *'}<input type="password" autoComplete="off" className={`${INPUT_CLASS} mt-1`} value={form.token} onChange={(event) => setForm((prev) => ({ ...prev, token: event.target.value }))} /></label> : null}
            {form.authType === 'cloudflare_access' ? <>
              <label className="text-[12px] text-[#67695d]">CF-Access-Client-Id{editingId ? '（两项均留空保持不变）' : ' *'}<input type="password" autoComplete="off" className={`${INPUT_CLASS} mt-1`} value={form.clientId} onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))} /></label>
              <label className="text-[12px] text-[#67695d]">CF-Access-Client-Secret{editingId ? '（两项均留空保持不变）' : ' *'}<input type="password" autoComplete="off" className={`${INPUT_CLASS} mt-1`} value={form.clientSecret} onChange={(event) => setForm((prev) => ({ ...prev, clientSecret: event.target.value }))} /></label>
            </> : null}
            <label className="text-[12px] text-[#67695d]">状态<select className={`${CONTROL_CLASS} mt-1 w-full`} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}><option value="active">启用</option><option value="disabled">停用</option></select></label>
            <label className="text-[12px] text-[#67695d]">备注<input className={`${INPUT_CLASS} mt-1`} maxLength={500} value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="NAS、显卡、上下文长度、用途等" /></label>
          </div>
          <div className="mt-4 flex justify-end"><AdminButton type="button" variant="primary" disabled={saving || !form.name || !form.baseUrl || !form.defaultModel} onClick={saveProvider}>{saving ? '保存中…' : editingId ? '保存修改' : '新增服务'}</AdminButton></div>
        </Section>
      ) : null}
    </>
  )
}
