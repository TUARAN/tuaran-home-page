'use client'

import { useCallback, useEffect, useState } from 'react'

import { DEEPSEEK_SHARED_SOURCES, DEEPSEEK_SITE_MODEL } from '../../../../lib/deepseekKeysCore'
import { AdminButton, EmptyState, Section, StatusPill } from '../../components/ui'

const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const INPUT_CLASS = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-6 text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const KNOWN_SOURCES = DEEPSEEK_SHARED_SOURCES
const DEEPSEEK_SHARED_USES = [
  { name: 'AI 规划台', runtime: 'Admin · admin.2aran.com', source: 'admin-model-dispatch', taskTypes: ['planning', 'planning-stream'] },
  { name: '股票横向分析', runtime: '公开站 · 2aran.com', source: 'stock-analysis', taskTypes: ['horizontal-analysis'] },
]
const DEEPSEEK_GITHUB_ACTIONS_USES = [
  {
    name: '设计扫描',
    schedule: '每月 1 日 · 北京时间 09:17',
    workflow: 'design-scan.yml',
    taskType: 'design',
  },
  {
    name: '性能扫描',
    schedule: '每两周周三 · 北京时间 09:17',
    workflow: 'perf-scan.yml',
    taskType: 'performance',
  },
  {
    name: '安全扫描',
    schedule: '每周一 · 北京时间 09:17',
    workflow: 'security-scan.yml',
    taskType: 'security',
  },
]
const DEEPSEEK_GITHUB_TRIGGERED_USES = [
  {
    name: 'A 股研究自动化',
    schedule: '每天 · 北京时间 01:00',
    workflow: 'a-share-research.yml',
    source: 'a-share-research',
    taskTypes: ['daily-draft'],
  },
  {
    name: '路过互动评论',
    schedule: '每天 · 北京时间 10:23；支持 Admin 手动运行',
    workflow: 'engagement-bot.yml',
    source: 'engagement-bot',
    taskTypes: ['comment'],
  },
  {
    name: 'X 每日问候文案',
    schedule: '每天早、中、晚定时触发',
    workflow: 'morning-greeting.yml',
    source: 'x-daily-greeting',
    taskTypes: ['direct-post-copy'],
  },
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
  const activeKeys = keys.filter((key) => key.status === 'active')
  const siteKey = activeKeys[0] || null

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
        title="DeepSeek 运行位置"
        description="站点任务和 GitHub Actions 使用相同的变量名，但运行环境彼此隔离。下方分别记录密钥所在环境及对应任务。"
        className="mb-4"
        actions={<span className="text-[12px] text-[#82847a]">{DEEPSEEK_SHARED_USES.length + DEEPSEEK_GITHUB_ACTIONS_USES.length + DEEPSEEK_GITHUB_TRIGGERED_USES.length} 个使用场景</span>}
      >
        <div className="space-y-3">
          <article className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="success" size="sm">已配置</StatusPill>
              <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">GitHub Actions 仓库密钥</span>
              <code className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">DEEPSEEK_API_KEY</code>
              <span className="text-[11px] text-[#82847a] dark:text-gray-400">仓库配置已核验 · 2026-07-31 更新</span>
            </div>
            <div className="mt-3 text-[12px] font-medium text-[#67695d] dark:text-gray-300">直接读取仓库 DEEPSEEK_API_KEY</div>
            <p className="mt-1 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">以下扫描工作流在 GitHub Actions 内直接执行 DeepSeek analysis。</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {DEEPSEEK_GITHUB_ACTIONS_USES.map((item) => (
                <a
                  key={item.workflow}
                  href={`https://github.com/TUARAN/tuaran-home-page/actions/workflows/${item.workflow}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-[#f7f7f2] px-2.5 py-2 transition-colors hover:bg-[#f0f1e9] dark:bg-[#111a25] dark:hover:bg-[#172230]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#3f4039] dark:text-gray-200">{item.name}</span>
                    <span className="text-[11px] text-[#82847a] dark:text-gray-400">{item.schedule}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <code className="font-mono text-[11px] text-[#67695d] dark:text-gray-300">{item.workflow}</code>
                    <code className="font-mono text-[11px] text-[#82847a] dark:text-gray-400">scan-analyze · {item.taskType}</code>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-4 border-t border-[#e6e7df] pt-3 text-[12px] font-medium text-[#67695d] dark:border-[#243041] dark:text-gray-300">Actions 定时触发，DeepSeek 在站点执行</div>
            <p className="mt-1 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">
              以下工作流使用各自的触发密钥调用 2aran.com；DeepSeek 密钥仍由站点运行环境读取。
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {DEEPSEEK_GITHUB_TRIGGERED_USES.map((item) => (
                <a
                  key={item.workflow}
                  href={`https://github.com/TUARAN/tuaran-home-page/actions/workflows/${item.workflow}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-[#f7f7f2] px-2.5 py-2 transition-colors hover:bg-[#f0f1e9] dark:bg-[#111a25] dark:hover:bg-[#172230]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#3f4039] dark:text-gray-200">{item.name}</span>
                    <span className="text-[11px] text-[#82847a] dark:text-gray-400">{item.schedule}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <code className="font-mono text-[11px] text-[#67695d] dark:text-gray-300">{item.workflow}</code>
                    <code className="font-mono text-[11px] text-[#82847a] dark:text-gray-400">{item.source}</code>
                    {item.taskTypes.map((taskType) => (
                      <code key={taskType} className="font-mono text-[11px] text-[#82847a] dark:text-gray-400">{taskType}</code>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
            <div className="mb-2 text-[12px] font-medium text-[#67695d] dark:text-gray-300">站点运行环境</div>
            <div className="flex flex-wrap items-center gap-2">
              {loading ? (
                <>
                  <StatusPill tone="neutral" size="sm">读取中</StatusPill>
                  <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">正在确认当前 Admin 环境</span>
                </>
              ) : siteKey ? (
                <>
                  <StatusPill tone="success" size="sm">Admin 检测到数据库记录</StatusPill>
                  <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{siteKey.name || '未命名密钥'}</span>
                  <code className="rounded-md bg-[#eef6e8] px-1.5 py-0.5 font-mono text-[11px] text-[#3f6b2a] dark:bg-[#1b2a1a] dark:text-lime-200">{DEEPSEEK_SITE_MODEL}</code>
                  <code className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">{siteKey.keyHint}</code>
                </>
              ) : data?.envKeyConfigured ? (
                <>
                  <StatusPill tone="success" size="sm">Admin 环境变量</StatusPill>
                  <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">DEEPSEEK_API_KEY</span>
                  {data.envKeyHint ? (
                    <code className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">{data.envKeyHint}</code>
                  ) : null}
                </>
              ) : (
                <>
                  <StatusPill tone="danger" size="sm">未配置</StatusPill>
                  <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">当前 Admin 环境没有可用的 DeepSeek 密钥</span>
                </>
              )}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {DEEPSEEK_SHARED_USES.map((item) => (
                <div key={item.source} className="rounded-md bg-[#f7f7f2] px-2.5 py-2 dark:bg-[#111a25]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[13px] font-medium text-[#3f4039] dark:text-gray-200">{item.name}</div>
                    <span className="text-[11px] text-[#82847a] dark:text-gray-400">{item.runtime}</span>
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
        </div>
      </Section>

      <Section
        title="数据库密钥"
        description="Key 加密存储在共享 D1，列表只显示掩码。跨项目使用还要求各 Cloudflare 项目配置相同的 DEEPSEEK_KEYS_ENC_SECRET；仅凭 Admin 页面无法证明公开站能够解密。"
        actions={
          !formVisible ? (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#82847a]">共 {keys.length} 个，{keys.filter((key) => key.status === 'active').length} 个启用</span>
              <AdminButton type="button" variant="primary" onClick={startCreate}>新增密钥</AdminButton>
            </div>
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
                      <span className="font-mono">实际调用 {DEEPSEEK_SITE_MODEL}</span>
                      {key.defaultModel && key.defaultModel !== DEEPSEEK_SITE_MODEL ? (
                        <span>密钥备注模型 {key.defaultModel}（不再生效）</span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {activeKeys.length <= 1 && key.status === 'active' ? (
                        <span className="rounded-md bg-[#eef6e8] px-1.5 py-0.5 text-[11px] text-[#3f6b2a] dark:bg-[#1b2a1a] dark:text-lime-200">默认候选</span>
                      ) : null}
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
              <input className={`${INPUT_CLASS} mt-1`} value={form.name} maxLength={80} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="例如：主站 DeepSeek Flash" />
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
              默认模型（可选，全站实际调用不受此字段影响）
              <input className={`${INPUT_CLASS} mt-1`} value={form.defaultModel} onChange={(event) => setForm((prev) => ({ ...prev, defaultModel: event.target.value }))} placeholder="deepseek-v4-flash" />
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
            <p className="text-[12px] text-[#67695d] dark:text-gray-400">绑定任务（source 必填，taskType 留空表示该来源全部任务；全部留空表示数据库全局兜底。跨运行环境仍需分别配置解密主密钥）</p>
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
