'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminButton, EmptyState, Section, StatusPill } from '../../components/ui'

const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const INPUT_CLASS = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-6 text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const EMPTY_FORM = { name: '', baseUrl: '', defaultModel: '', authType: 'none', token: '', clientId: '', clientSecret: '', status: 'active', note: '' }

function formatDate(value) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—'
}

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

export default function OllamaProvidersPanel({ onViewCalls }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState('')
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

  const providers = data?.providers || []
  const activeCount = providers.filter((item) => item.status === 'active').length

  return (
    <>
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

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
                      <code className="text-[11px] text-[#67695d] dark:text-gray-300">{provider.defaultModel}</code>
                    </div>
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
