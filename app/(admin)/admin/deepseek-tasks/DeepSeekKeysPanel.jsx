'use client'

import { useCallback, useEffect, useState } from 'react'

import { DEEPSEEK_EXTERNAL_SOURCES, DEEPSEEK_SITE_SOURCES, DEEPSEEK_SITE_MODEL } from '../../../../lib/ai/deepseekKeysCore'
import { AdminButton, EmptyState, Section, StatusPill } from '../../components/ui'

const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const INPUT_CLASS = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-6 text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'
const SOURCE_LABELS = {
  'a-share-research': 'A 股研究自动化',
  'crypto-research': '加密调研自动化',
  'admin-model-dispatch': 'AI 规划台',
  'engagement-bot': '站内互动机器人',
  'stock-analysis': '股票横向分析',
  'x-daily-greeting': 'X 每日问候文案',
  'juejin-interaction-extension': '掘金互动插件',
  'x-reply-clipboard-extension': 'X 回复插件',
  'xhs-interaction-extension': '小红书互动插件',
}
const KNOWN_SOURCES = [...DEEPSEEK_SITE_SOURCES, ...DEEPSEEK_EXTERNAL_SOURCES]
const sourceLabel = (source) => SOURCE_LABELS[source] ? `${SOURCE_LABELS[source]} · ${source}` : source
const DEEPSEEK_SHARED_USES = [
  { name: 'AI 规划台', runtime: 'Admin · admin.2aran.com', source: 'admin-model-dispatch', taskTypes: ['planning', 'planning-stream'] },
  { name: '股票横向分析', runtime: '后台 · Owner-only', source: 'stock-analysis', taskTypes: ['horizontal-analysis'] },
]
const DEEPSEEK_GITHUB_ACTIONS_USES = [
  {
    name: '更新日志自动归纳',
    schedule: '每周三、周六 · 北京时间 09:37',
    workflow: 'changelog-update.yml',
    taskType: 'changelog',
  },
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
    name: '加密调研自动化',
    schedule: '每天 · 北京时间 01:30',
    workflow: 'crypto-research.yml',
    source: 'crypto-research',
    taskTypes: ['daily-draft'],
  },
  {
    name: '站内互动评论',
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

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // 浏览器失去用户激活时，回退到可选中的临时输入框。
    }
  }
  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('浏览器未允许复制，请使用“查看 Key”后手动复制。')
}

function BindingChips({ bindings }) {
  if (!bindings?.length) {
    return <span className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 text-[11px] text-[#82847a] dark:bg-[#1b2532] dark:text-gray-400">全局兜底</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {bindings.map((binding, index) => (
        <span key={`${binding.source}-${binding.taskType}-${index}`} className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">
          {sourceLabel(binding.source)}{binding.taskType ? ` · ${binding.taskType}` : ' · 全部任务'}
        </span>
      ))}
    </div>
  )
}

function keyScope(bindings) {
  if (!bindings?.length) return '全局兜底'
  const hasSite = bindings.some((binding) => DEEPSEEK_SITE_SOURCES.includes(binding.source))
  const hasExternal = bindings.some((binding) => DEEPSEEK_EXTERNAL_SOURCES.includes(binding.source))
  if (hasSite && hasExternal) return '站内及站外共用'
  if (hasSite) return '站内任务'
  if (hasExternal) return '站外插件'
  return '其他来源'
}

export default function DeepSeekKeysPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showKey, setShowKey] = useState(false)
  const [formVisible, setFormVisible] = useState(false)
  const [revealed, setRevealed] = useState(null)
  const [revealingId, setRevealingId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!revealed) return undefined
    const timer = window.setTimeout(() => setRevealed(null), 30000)
    return () => window.clearTimeout(timer)
  }, [revealed])

  async function accessKey(id, copy = false) {
    setRevealingId(id)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/deepseek-keys', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin',
        body: JSON.stringify({ id }),
      })
      const result = await safeJson(response)
      if (!response.ok) throw new Error(result?.detail || result?.error || `HTTP_${response.status}`)
      if (!result?.key) throw new Error('密钥为空。')
      if (copy) {
        await copyText(result.key)
        setRevealed(null)
        setNotice('DeepSeek API Key 已复制。')
      } else {
        setRevealed({ id, key: result.key })
      }
    } catch (accessError) {
      setError(accessError?.message || '密钥读取或复制失败。')
    } finally {
      setRevealingId('')
    }
  }

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

  return (
    <>
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}
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
        description="Admin、公开站和 GitHub Actions 的运行环境彼此隔离；共享 D1 中的密钥按任务绑定选择。这里仅能检测当前 Admin 环境，不能确认公开站实际使用的 Key。"
        className="mb-4"
        actions={<span className="text-[12px] text-[#82847a]">{DEEPSEEK_SHARED_USES.length + DEEPSEEK_GITHUB_ACTIONS_USES.length + DEEPSEEK_GITHUB_TRIGGERED_USES.length} 个使用场景</span>}
      >
        <div className="mb-3 rounded-lg border border-[#e6e7df] p-3 text-[12px] leading-6 text-[#67695d] dark:border-[#243041] dark:text-gray-300">
          <div className="font-medium text-[#3f4039] dark:text-gray-200">密钥来源总览</div>
          <p>{loading ? '正在读取 D1 与当前 Admin 环境…' : `D1：${keys.length} 条记录（${activeKeys.length} 条启用）；当前 Admin 环境变量：${data?.envKeyConfigured ? '1 个已配置' : '未配置'}。`} GitHub Actions 仓库：1 个 DEEPSEEK_API_KEY Secret，供下列 {DEEPSEEK_GITHUB_ACTIONS_USES.length} 个扫描/归纳工作流共用。</p>
          <p>公开站环境变量未在此检测。各位置可能保存同一串 Key，不能将这些记录相加当作不同 API Key 的数量；下方 D1 列表显示每条记录绑定的任务。</p>
        </div>
        <div className="space-y-3">
          <article className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="success" size="sm">已配置</StatusPill>
              <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">GitHub Actions 仓库密钥</span>
              <code className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">DEEPSEEK_API_KEY</code>
              <span className="text-[11px] text-[#82847a] dark:text-gray-400">仓库配置已核验 · 2026-10-12</span>
            </div>
            <div className="mt-3 text-[12px] font-medium text-[#67695d] dark:text-gray-300">直接读取仓库 DEEPSEEK_API_KEY</div>
            <p className="mt-1 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">以下 {DEEPSEEK_GITHUB_ACTIONS_USES.length} 个工作流共用这 1 个仓库 Secret，在 GitHub Actions 内直接调用 DeepSeek。</p>
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
            <div className="mb-2 text-[12px] font-medium text-[#67695d] dark:text-gray-300">当前 Admin 运行环境</div>
            <div className="flex flex-wrap items-center gap-2">
              {loading ? (
                <>
                  <StatusPill tone="neutral" size="sm">读取中</StatusPill>
                  <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">正在确认当前 Admin 环境</span>
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
                  <StatusPill tone="neutral" size="sm">未检测到环境变量</StatusPill>
                  <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">当前 Admin 环境未配置 DEEPSEEK_API_KEY</span>
                </>
              )}
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">
              Admin 可见 {keys.length} 条 D1 密钥记录，其中 {activeKeys.length} 条启用。站内任务按绑定选择 D1 密钥，未匹配时回退到各自运行环境的 DEEPSEEK_API_KEY；站外插件使用手动复制的 Key。公开站的环境变量与解密能力需在公开站单独核验。
            </p>
            {data?.envKeyConfigured ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#67695d] dark:text-gray-300">
                <span>当前 Admin 环境变量 DEEPSEEK_API_KEY：{data.envKeyHint}</span>
                <AdminButton type="button" size="sm" variant="ghost" onClick={() => accessKey('env:DEEPSEEK_API_KEY')} disabled={Boolean(revealingId)}>查看</AdminButton>
                <AdminButton type="button" size="sm" variant="ghost" onClick={() => accessKey('env:DEEPSEEK_API_KEY', true)} disabled={Boolean(revealingId)}>复制</AdminButton>
              </div>
            ) : null}
            {revealed?.id === 'env:DEEPSEEK_API_KEY' ? (
              <div className="mt-3 flex items-center gap-2">
                <input readOnly aria-label="DeepSeek 环境变量密钥" value={revealed.key} className={`${INPUT_CLASS} font-mono`} />
                <AdminButton type="button" size="sm" onClick={() => setRevealed(null)}>隐藏</AdminButton>
              </div>
            ) : null}
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
        description="一条 D1 密钥记录可以绑定多个任务，即多个任务共用同一 Key。选择顺序为精确任务绑定、来源绑定、全局兜底，再回退到当前运行环境变量。Key 加密存储在共享 D1，列表只显示掩码；主动查看后 30 秒自动隐藏。调用统计仅包含经过站点 API 的请求，浏览器插件直连 DeepSeek 不计入。跨项目使用还要求各 Cloudflare 项目配置相同的 DEEPSEEK_KEYS_ENC_SECRET。"
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
                      <StatusPill tone="neutral" size="sm">{keyScope(key.bindings)}</StatusPill>
                      <span className="text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{key.name || '未命名密钥'}</span>
                      <code className="rounded-md bg-[#f0f1e9] px-1.5 py-0.5 font-mono text-[11px] text-[#67695d] dark:bg-[#1b2532] dark:text-gray-300">{key.keyHint}</code>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#82847a]">
                      <span>{key.usage.calls.toLocaleString()} 次调用</span>
                      <span>{key.usage.totalTokens.toLocaleString()} tokens</span>
                      <span>最近使用 {formatDate(key.lastUsedAt)}</span>
                      {key.baseUrl ? <span className="font-mono">{key.baseUrl}</span> : null}
                      {keyScope(key.bindings) !== '站外插件' ? <span className="font-mono">站点任务默认模型 {DEEPSEEK_SITE_MODEL}</span> : null}
                      {key.defaultModel && key.defaultModel !== DEEPSEEK_SITE_MODEL ? (
                        <span>密钥备注模型 {key.defaultModel}（不再生效）</span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <BindingChips bindings={key.bindings} />
                    </div>
                    {key.note ? <p className="mt-1.5 text-[12px] text-[#67695d] dark:text-gray-400">{key.note}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminButton type="button" variant="ghost" onClick={() => accessKey(key.id)} disabled={Boolean(revealingId)}>查看 Key</AdminButton>
                    <AdminButton type="button" variant="ghost" onClick={() => accessKey(key.id, true)} disabled={Boolean(revealingId)}>复制 Key</AdminButton>
                    <AdminButton href={`/admin/ops?tab=calls&key=${encodeURIComponent(key.id)}&scope=cloud`} variant="ghost">查看调用</AdminButton>
                    <AdminButton type="button" variant="ghost" onClick={() => startEdit(key)} disabled={saving}>编辑</AdminButton>
                    <AdminButton type="button" variant="ghost" onClick={() => toggleKey(key)} disabled={saving}>
                      {key.status === 'active' ? '停用' : '启用'}
                    </AdminButton>
                  </div>
                </div>
                {revealed?.id === key.id ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input readOnly aria-label={`${key.name} 的 DeepSeek API Key`} value={revealed.key} className={`${INPUT_CLASS} font-mono`} />
                    <AdminButton type="button" size="sm" onClick={() => setRevealed(null)}>隐藏</AdminButton>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Section>

      {formVisible ? (
        <Section
          title={editingId ? '编辑密钥' : '新增密钥'}
          description={editingId ? 'Key 留空表示保持不变；修改绑定后只影响后续调用。' : '明文提交时加密落库；站长可按需查看或复制。'}
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
            <p className="text-[12px] text-[#67695d] dark:text-gray-400">绑定任务（source 必填，taskType 留空表示该来源全部任务；全部留空表示数据库全局兜底。站外插件直接使用复制的 Key，选择对应插件来源；站内互动机器人使用 engagement-bot。跨运行环境仍需分别配置解密主密钥）</p>
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
                    <optgroup label="站内任务">
                      {DEEPSEEK_SITE_SOURCES.map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}
                    </optgroup>
                    <optgroup label="站外互动插件">
                      {DEEPSEEK_EXTERNAL_SOURCES.map((source) => <option key={source} value={source}>{sourceLabel(source)}</option>)}
                    </optgroup>
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
