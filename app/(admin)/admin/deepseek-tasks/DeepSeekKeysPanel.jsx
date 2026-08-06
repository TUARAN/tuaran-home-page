'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, EmptyState, Section, StatusPill } from '../../components/ui'

const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const INPUT_CLASS = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-6 text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const KNOWN_SOURCES = [
  'a-share-research',
  'admin-model-dispatch',
  'stock-analysis',
  'public-opinion',
]

const EMPTY_FORM = {
  name: '',
  key: '',
  baseUrl: '',
  defaultModel: '',
  status: 'active',
  note: '',
  bindings: [{ source: '', taskType: '' }],
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function BindingChips({ bindings }) {
  if (!bindings?.length) {
    return <span className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 text-[11px] text-[#82847a] dark:bg-[#1b2532] dark:text-gray-400">全局兜底</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {bindings.map((binding, index) => (
        <span key={`${binding.source}-${binding.taskType}-${index}`} className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">
          {binding.source}{binding.taskType ? ` · ${binding.taskType}` : ' · 全部任务'}
        </span>
      ))}
    </div>
  )
}

export default function DeepSeekKeysPanel({ onViewCalls }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showKey, setShowKey] = useState(false)
  const [formVisible, setFormVisible] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/deepseek-keys', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || '密钥列表读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function resetForm() {
    setEditingId('')
    setForm(EMPTY_FORM)
    setShowKey(false)
    setFormVisible(false)
  }

  function startCreate() {
    setEditingId('')
    setForm(EMPTY_FORM)
    setShowKey(false)
    setFormVisible(true)
  }

  function startEdit(key) {
    setEditingId(key.id)
    setFormVisible(true)
    setForm({
      name: key.name || '',
      key: '',
      baseUrl: key.baseUrl || '',
      defaultModel: key.defaultModel || '',
      status: key.status || 'active',
      note: key.note || '',
      bindings: (key.bindings || []).length ? key.bindings : [{ source: '', taskType: '' }],
    })
    setShowKey(false)
  }

  function updateBinding(index, field, value) {
    setForm((prev) => ({
      ...prev,
      bindings: prev.bindings.map((binding, bindingIndex) =>
        bindingIndex === index ? { ...binding, [field]: value } : binding,
      ),
    }))
  }

  function addBinding() {
    setForm((prev) => ({ ...prev, bindings: [...prev.bindings, { source: '', taskType: '' }] }))
  }

  function removeBinding(index) {
    setForm((prev) => ({ ...prev, bindings: prev.bindings.filter((_, bindingIndex) => bindingIndex !== index) }))
  }

  function cleanBindings() {
    return form.bindings
      .map((binding) => ({
        source: String(binding.source || '').trim(),
        taskType: String(binding.taskType || '').trim(),
      }))
      .filter((binding) => binding.source)
  }

  async function saveKey() {
    setSaving(true)
    setError('')
    const payload = {
      name: form.name,
      key: form.key,
      baseUrl: form.baseUrl,
      defaultModel: form.defaultModel,
      status: form.status,
      note: form.note,
      bindings: cleanBindings(),
    }
    try {
      const response = await fetch('/api/admin/deepseek-keys', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })
      const result = await safeJson(response)
      if (!response.ok) throw new Error(result?.detail || result?.error || `HTTP_${response.status}`)
      resetForm()
      await refresh()
    } catch (saveError) {
      setError(saveError?.message || '密钥保存失败。')
    } finally {
      setSaving(false)
    }
  }

  async function toggleKey(key) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/deepseek-keys', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: key.id, status: key.status === 'active' ? 'disabled' : 'active' }),
      })
      const result = await safeJson(response)
      if (!response.ok) throw new Error(result?.detail || result?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (toggleError) {
      setError(toggleError?.message || '密钥状态更新失败。')
    } finally {
      setSaving(false)
    }
  }

  const keys = data?.keys || []

  return (
    <>
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {data?.status === 'unavailable' ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          D1 不可用或迁移 0059 尚未部署，暂时无法管理密钥；现有调用仍会回退到环境变量默认密钥。
        </div>
      ) : null}
      {!data?.encSecretConfigured && data?.status === 'ok' ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          尚未配置 DEEPSEEK_KEYS_ENC_SECRET：数据库密钥功能不可用，调用将回退到环境变量默认密钥。配置后即可新增可管理的密钥。
        </div>
      ) : null}

      <Section
        title="环境变量默认密钥"
        description="兼容既有部署的兜底密钥，不需要数据库存储；建议后续迁移到可管理的数据库密钥。"
        className="mb-4"
      >
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <StatusPill tone={data?.envKeyConfigured ? 'success' : 'danger'} size="sm">
            {data?.envKeyConfigured ? '已配置' : '未配置'}
          </StatusPill>
          {data?.envKeyConfigured ? (
            <code className="rounded-md bg-[#f0f1e9] px-2 py-1 font-mono text-[12px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">{data.envKeyHint}</code>
          ) : (
            <span className="text-[#82847a]">DEEPSEEK_API_KEY 未配置，线上调用将失败。</span>
          )}
          <span className="text-[12px] text-[#82847a]">只作为任务未绑定密钥时的回退</span>
        </div>
      </Section>

      <Section
        title="数据库密钥"
        description="Key 加密存储，列表只显示掩码；可为每个任务绑定具体密钥，调用记录自动关联。"
        actions={
          !formVisible ? (
            <AdminButton type="button" variant="primary" onClick={startCreate}>新增密钥</AdminButton>
          ) : null
        }
      >
        {loading ? (
          <p className="py-4 text-sm text-[#82847a]">加载中…</p>
        ) : !keys.length ? (
          <EmptyState title="暂无数据库密钥" description="新增密钥后，任务绑定与调用记录会自动关联。" />
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <article key={key.id} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={key.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {key.status === 'active' ? '启用' : '已停用'}
                      </StatusPill>
                      <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{key.name || '未命名密钥'}</span>
                      <code className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">{key.keyHint}</code>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#82847a]">
                      <span>{key.usage.calls.toLocaleString()} 次调用</span>
                      <span>{key.usage.totalTokens.toLocaleString()} tokens</span>
                      <span>最近使用 {formatDate(key.lastUsedAt)}</span>
                      {key.baseUrl ? <span className="font-mono">{key.baseUrl}</span> : null}
                      {key.defaultModel ? <span className="font-mono">{key.defaultModel}</span> : null}
                    </div>
                    <div className="mt-2">
                      <BindingChips bindings={key.bindings} />
                    </div>
                    {key.note ? <p className="mt-1.5 text-[12px] text-[#67695d] dark:text-gray-400">{key.note}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminButton type="button" variant="ghost" onClick={() => onViewCalls(key.id)}>查看调用</AdminButton>
                    <AdminButton type="button" variant="ghost" onClick={() => startEdit(key)} disabled={saving}>编辑</AdminButton>
                    <AdminButton type="button" variant="ghost" onClick={() => toggleKey(key)} disabled={saving}>
                      {key.status === 'active' ? '停用' : '启用'}
                    </AdminButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      {formVisible ? (
        <Section
          title={editingId ? '编辑密钥' : '新增密钥'}
          description={editingId ? 'Key 留空表示保持不变；修改绑定后只影响后续调用。' : '明文只在提交时加密落库，任何接口都不会返回完整 Key。'}
          className="mt-4"
          actions={<AdminButton type="button" variant="ghost" onClick={resetForm}>取消</AdminButton>}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
              名称 *
              <input className={`${INPUT_CLASS} mt-1`} value={form.name} maxLength={80} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="例如：主站 DeepSeek Pro" />
            </label>
            <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
              API Key {editingId ? '' : '*'}{editingId ? '（留空保持不变）' : ''}
              <div className="mt-1 flex gap-2">
                <input
                  className={INPUT_CLASS}
                  type={showKey ? 'text' : 'password'}
                  value={form.key}
                  autoComplete="off"
                  onChange={(event) => setForm((prev) => ({ ...prev, key: event.target.value }))}
                  placeholder={editingId ? 'sk-…' : 'sk-…'}
                />
                <button type="button" className={`${CONTROL_CLASS} shrink-0`} onClick={() => setShowKey((value) => !value)}>
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
            </label>
            <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
              Base URL（可选）
              <input className={`${INPUT_CLASS} mt-1`} value={form.baseUrl} onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))} placeholder="https://api.deepseek.com" />
            </label>
            <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
              默认模型（可选）
              <input className={`${INPUT_CLASS} mt-1`} value={form.defaultModel} onChange={(event) => setForm((prev) => ({ ...prev, defaultModel: event.target.value }))} placeholder="deepseek-v4-pro" />
            </label>
            <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
              状态
              <select className={`${CONTROL_CLASS} mt-1 w-full`} value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
            <label className="block text-[12px] text-[#67695d] dark:text-gray-400">
              备注
              <input className={`${INPUT_CLASS} mt-1`} value={form.note} maxLength={500} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="用途、成本、到期时间等" />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-[12px] text-[#67695d] dark:text-gray-400">绑定任务（source 必填，taskType 留空表示该来源全部任务；全部留空表示全局兜底）</p>
            <div className="mt-2 space-y-2">
              {form.bindings.map((binding, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2">
                  <select
                    className={`${CONTROL_CLASS} w-48`}
                    value={binding.source}
                    onChange={(event) => updateBinding(index, 'source', event.target.value)}
                    aria-label={`绑定 ${index + 1} 来源`}
                  >
                    <option value="">选择来源…</option>
                    {KNOWN_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
                    {binding.source && !KNOWN_SOURCES.includes(binding.source) ? <option value={binding.source}>{binding.source}</option> : null}
                  </select>
                  <input
                    className={`${INPUT_CLASS} w-56`}
                    value={binding.taskType}
                    onChange={(event) => updateBinding(index, 'taskType', event.target.value)}
                    placeholder="taskType（可选）"
                  />
                  <button type="button" className={`${CONTROL_CLASS} shrink-0`} onClick={() => removeBinding(index)} disabled={form.bindings.length === 1}>移除</button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <AdminButton type="button" variant="ghost" onClick={addBinding}>添加绑定</AdminButton>
              <AdminButton type="button" variant="primary" onClick={saveKey} disabled={saving || !form.name || (!editingId && form.key.length < 16)}>
                {saving ? '保存中…' : editingId ? '保存修改' : '新增密钥'}
              </AdminButton>
            </div>
          </div>
        </Section>
      ) : null}
    </>
  )
}
