'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'

const KIND_LABELS = {
  secret: '密钥',
  token: 'Token',
  webhook: 'Webhook',
}

const inputClass =
  'h-9 w-full rounded-lg border border-[#d8dad0] bg-white px-3 text-[13px] text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function EnvChip({ name, configured }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-px font-mono text-[10.5px] ${
        configured
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'border-[#d8dad0] bg-white text-[#94968b] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-500'
      }`}
      title={configured ? '环境变量已配置' : '环境变量未配置'}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${configured ? 'bg-emerald-500' : 'bg-[#c2c4b8] dark:bg-[#3a4757]'}`} />
      {name}
    </span>
  )
}

const EMPTY_FORM = {
  name: '',
  service: 'other',
  kind: 'secret',
  envRef: '',
  value: '',
  baseUrl: '',
  note: '',
}

export default function IntegrationsClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/integrations', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || '集成台账读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.value.trim()) {
      setError('名称与凭证值必填。')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice(`已保存「${form.name}」，明文不再展示。`)
      setForm(EMPTY_FORM)
      await refresh()
    } catch (createError) {
      setError(createError?.message || '保存失败。')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(credential) {
    setPendingId(credential.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          name: credential.name,
          service: credential.service,
          kind: credential.kind,
          envRef: credential.envRef,
          status: credential.status === 'active' ? 'disabled' : 'active',
          note: credential.note,
        }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (toggleError) {
      setError(toggleError?.message || '状态更新失败。')
    } finally {
      setPendingId('')
    }
  }

  async function handleDelete(credential) {
    if (!window.confirm(`确认删除「${credential.name}」？删除后无法恢复。`)) return
    setPendingId(credential.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/integrations?id=${encodeURIComponent(credential.id)}`, { method: 'DELETE' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setNotice(`已删除「${credential.name}」。`)
      await refresh()
    } catch (deleteError) {
      setError(deleteError?.message || '删除失败。')
    } finally {
      setPendingId('')
    }
  }

  const credentials = data?.credentials || []
  const services = data?.services || []
  const webhooks = data?.webhooks || []
  const envStatus = data?.envStatus || {}
  const stats = data?.stats || {}

  return (
    <AdminPage
      title="集成与 API Keys"
      description="全站外部服务凭证、Webhook 与定时任务的统一台账。凭证加密落库，界面只显示掩码；环境变量探测只标记「已配置 / 未配置」。"
      actions={<AdminButton type="button" onClick={refresh} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      {data?.status === 'unavailable' ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          当前环境没有 D1 绑定，无法读取集成台账。
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>
      ) : null}
      {!loading && data?.masterSecretConfigured === false ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          尚未配置加密主密钥：请先在 Cloudflare Pages 设置 <code className="font-mono">INTEGRATION_KEYS_ENC_SECRET</code>（可回退 <code className="font-mono">DEEPSEEK_KEYS_ENC_SECRET</code>），否则新凭证无法加密保存。
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="已登记凭证" value={loading ? '—' : stats.credentials || 0} />
        <StatCard label="启用中" value={loading ? '—' : stats.active || 0} tone="success" />
        <StatCard label="覆盖服务" value={loading ? '—' : stats.servicesCovered || 0} tone="info" />
        <StatCard label="服务目录" value={loading ? '—' : services.length} sub={`Webhook 端点 ${webhooks.length} 个`} />
      </div>

      <Section
        title="接入服务目录"
        description="全站代码里实际依赖的外部服务。环境变量芯片表示 Cloudflare Pages 侧的配置状态。"
      >
        {loading ? (
          <p className="text-sm text-[#67695d] dark:text-gray-400">加载中…</p>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="flex flex-col gap-1.5 rounded-lg border border-[#e6e7df] px-3 py-2.5 text-[12px] dark:border-[#243041] lg:flex-row lg:items-start lg:gap-4">
                <div className="flex min-w-0 items-start gap-2 lg:w-52 lg:shrink-0">
                  <StatusPill tone={service.credentialCount ? 'success' : 'neutral'} size="sm" icon={false}>
                    {service.credentialCount ? `已登记 ${service.credentialCount}` : '未登记'}
                  </StatusPill>
                  <div className="min-w-0">
                    <p className="mb-0 font-semibold text-[#15140f] dark:text-gray-100">{service.label}</p>
                    <p className="mb-0 font-mono text-[10px] text-[#94968b] dark:text-gray-500">{service.provider}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 leading-5 text-[#67695d] dark:text-gray-400">{service.purpose}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {service.envRefs?.length ? (
                      service.envRefs.map((ref) => (
                        <EnvChip key={ref} name={ref} configured={Boolean(envStatus[ref])} />
                      ))
                    ) : (
                      <span className="text-[11px] text-[#94968b] dark:text-gray-500">无需凭据</span>
                    )}
                  </div>
                  {service.note ? (
                    <p className="mb-0 mt-1 text-[11px] text-[#94968b] dark:text-gray-500">{service.note}</p>
                  ) : null}
                </div>
                {service.managedIn ? (
                  <AdminButton href={service.managedIn} size="sm" variant="ghost" className="shrink-0">管理入口 →</AdminButton>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="已登记凭证"
        description="密文 AES-GCM 落库，保存后只显示掩码；停用不影响环境变量里的配置。"
        className="mt-4"
      >
        {!loading && !credentials.length ? (
          <EmptyState title="还没有登记凭证" description="在下方表单登记第一条外部服务凭证。" />
        ) : (
          <div className="mb-4 space-y-1.5">
            {credentials.map((credential) => (
              <div key={credential.id} className="flex flex-col gap-1 rounded-lg border border-[#e6e7df] px-3 py-2 text-[12px] dark:border-[#243041] lg:flex-row lg:items-center lg:gap-3">
                <StatusPill tone={credential.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {credential.status === 'active' ? '启用' : '停用'}
                </StatusPill>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-[#15140f] dark:text-gray-100">{credential.name}</span>
                  <span className="ml-2 text-[#94968b] dark:text-gray-500">
                    {KIND_LABELS[credential.kind] || credential.kind}
                    {credential.service ? ` · ${services.find((s) => s.id === credential.service)?.label || credential.service}` : ''}
                  </span>
                  {credential.envRef ? (
                    <span className="ml-2 font-mono text-[10.5px] text-[#67695d] dark:text-gray-400">{credential.envRef}</span>
                  ) : null}
                </span>
                <span className="font-mono text-[11px] text-[#82847a] dark:text-gray-500">{credential.keyHint}</span>
                {credential.note ? <span className="text-[#94968b] dark:text-gray-500">{credential.note}</span> : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={pendingId === credential.id}
                    onClick={() => toggleStatus(credential)}
                    className="rounded-lg border border-[#caccc0] px-2 py-1 text-[11px] text-[#63645a] hover:bg-[#edefe7] disabled:opacity-50 dark:border-[#2d3744] dark:text-[#9aa6b6] dark:hover:bg-[#151c25]"
                  >
                    {credential.status === 'active' ? '停用' : '启用'}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === credential.id}
                    onClick={() => handleDelete(credential)}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleCreate} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
          <h3 className="mb-3 text-[13px] font-semibold text-[#15140f] dark:text-gray-100">登记新凭证</h3>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400">
              名称 *
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="如：X 主账号 Access Token" />
            </label>
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400">
              服务
              <select value={form.service} onChange={(e) => setField('service', e.target.value)} className={`mt-1 ${inputClass}`}>
                <option value="other">其他</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.label}</option>
                ))}
              </select>
            </label>
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400">
              类型
              <select value={form.kind} onChange={(e) => setField('kind', e.target.value)} className={`mt-1 ${inputClass}`}>
                <option value="secret">密钥</option>
                <option value="token">Token</option>
                <option value="webhook">Webhook</option>
              </select>
            </label>
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400">
              环境变量名（可选）
              <input value={form.envRef} onChange={(e) => setField('envRef', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="如：X_ACCESS_TOKEN" />
            </label>
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400 md:col-span-2">
              凭证值 *
              <input
                type="password"
                value={form.value}
                onChange={(e) => setField('value', e.target.value)}
                className={`mt-1 ${inputClass}`}
                placeholder="保存后仅显示掩码"
                autoComplete="new-password"
              />
            </label>
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400">
              Base URL（可选）
              <input value={form.baseUrl} onChange={(e) => setField('baseUrl', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="https://api.example.com" />
            </label>
            <label className="text-[11.5px] text-[#67695d] dark:text-gray-400">
              备注
              <input value={form.note} onChange={(e) => setField('note', e.target.value)} className={`mt-1 ${inputClass}`} placeholder="用途、权限范围等" />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <AdminButton type="submit" variant="primary" disabled={saving}>
              {saving ? '保存中…' : '加密保存'}
            </AdminButton>
          </div>
        </form>
      </Section>

      <Section
        title="Webhook 与定时任务端点"
        description="GitHub Actions 外部调度触发的站内端点；鉴权统一走 *_SECRET 环境变量回退链。"
        className="mt-4"
      >
        <div className="overflow-x-auto rounded-lg border border-[#e4e5dc] dark:border-[#263142]">
          <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
            <thead className="bg-[#f7f8f3] dark:bg-[#111821]">
              <tr className="border-b border-[#e4e5dc] text-[#85877c] dark:border-[#263142] dark:text-[#78869a]">
                <th className="px-3 py-2 font-medium">端点</th>
                <th className="px-3 py-2 font-medium">用途</th>
                <th className="px-3 py-2 font-medium">鉴权 Secret</th>
                <th className="px-3 py-2 font-medium">调度</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-[#eceee6] last:border-0 dark:border-[#1b2430]">
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#3f4039] dark:text-gray-200">{webhook.path}</td>
                  <td className="px-3 py-2.5 text-[#67695d] dark:text-gray-400">{webhook.purpose}</td>
                  <td className="px-3 py-2.5 font-mono text-[10.5px] text-[#82847a] dark:text-gray-500">{webhook.secretEnv}</td>
                  <td className="px-3 py-2.5">
                    <a href={webhook.workflow} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline dark:text-sky-300">工作流 ↗</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </AdminPage>
  )
}
