'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconDeviceFloppy, IconRefresh, IconSearch } from '@tabler/icons-react'

import { AdminButton, AdminPage } from '../../components/ui'

const SOURCE_META = {
  feed: { label: '灵感', description: '短内容、动态和最近记录' },
  column: { label: '创作', description: '原创文章与精选长文' },
  research: { label: '分析', description: '公司、事项与专题调研' },
  resources: { label: '资源', description: '资料库、工具和长期整理' },
}

const EMPTY_SETTINGS = {
  enabled: true,
  batchSize: 10,
  rotationMode: 'random',
  avoidImmediateRepeats: true,
  sources: Object.fromEntries(Object.keys(SOURCE_META).map((key) => [key, { enabled: true, weight: 2 }])),
  pinnedIds: [],
}

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

export default function RecommendationConsole() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS)
  const [catalog, setCatalog] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/recommendations', { cache: 'no-store', credentials: 'same-origin' })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setSettings({ ...EMPTY_SETTINGS, ...data.settings, sources: { ...EMPTY_SETTINGS.sources, ...data.settings?.sources } })
      setCatalog(Array.isArray(data.catalog) ? data.catalog : [])
      setDirty(false)
    } catch (reason) {
      setError(reason?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function update(patch) {
    setSettings((current) => ({ ...current, ...patch }))
    setDirty(true)
    setMessage('')
  }

  function updateSource(source, patch) {
    setSettings((current) => ({
      ...current,
      sources: { ...current.sources, [source]: { ...current.sources[source], ...patch } },
    }))
    setDirty(true)
    setMessage('')
  }

  function togglePinned(id) {
    const exists = settings.pinnedIds.includes(id)
    const next = exists ? settings.pinnedIds.filter((item) => item !== id) : [...settings.pinnedIds, id]
    update({ pinnedIds: next.slice(0, 12) })
  }

  async function save() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ settings }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setSettings(data.settings)
      setDirty(false)
      setMessage('推荐规则已保存，首页会在 1 分钟内读取新配置。')
    } catch (reason) {
      setError(reason?.message || 'SAVE_FAILED')
    } finally {
      setSaving(false)
    }
  }

  const sourceCounts = useMemo(() => Object.fromEntries(Object.keys(SOURCE_META).map((source) => [
    source,
    catalog.filter((item) => item.section === source).length,
  ])), [catalog])
  const filteredCatalog = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const sorted = [...catalog].sort((a, b) => {
      const pinDiff = Number(settings.pinnedIds.includes(b.id)) - Number(settings.pinnedIds.includes(a.id))
      return pinDiff || String(b.sortKey || '').localeCompare(String(a.sortKey || ''))
    })
    if (!keyword) return sorted
    return sorted.filter((item) => `${item.title} ${item.sectionLabel} ${item.tagLabel || ''}`.toLowerCase().includes(keyword))
  }, [catalog, query, settings.pinnedIds])

  const enabledCandidates = catalog.filter((item) => settings.sources[item.section]?.enabled !== false).length

  return (
    <AdminPage
      title="推荐管理"
      description="统一管理首页“先读这几篇”的候选来源、换一批策略和人工置顶。规则保存在 D1，调整后无需重新构建站点。"
      actions={(
        <>
          <AdminButton onClick={load} disabled={loading || saving}><IconRefresh size={15} />重新读取</AdminButton>
          <AdminButton variant="primary" onClick={save} disabled={loading || saving || !dirty}>
            <IconDeviceFloppy size={15} />{saving ? '保存中…' : '保存规则'}
          </AdminButton>
        </>
      )}
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Panel title="基础规则" description={`当前启用来源共有 ${enabledCandidates} 条候选内容。`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleCard
                title="启用首页推荐"
                description="关闭后首页隐藏整个推荐区。"
                checked={settings.enabled}
                disabled={loading}
                onChange={(enabled) => update({ enabled })}
              />
              <ToggleCard
                title="避免连续重复"
                description="换一批时优先排除上一批内容。"
                checked={settings.avoidImmediateRepeats}
                disabled={loading}
                onChange={(avoidImmediateRepeats) => update({ avoidImmediateRepeats })}
              />
              <Field label="每批展示数量" help="允许 10–12 条">
                <input type="number" min="10" max="12" value={settings.batchSize} onChange={(event) => update({ batchSize: Number(event.target.value) })} className={inputClass} />
              </Field>
              <Field label="换一批策略" help="随机模式会结合来源权重">
                <select value={settings.rotationMode} onChange={(event) => update({ rotationMode: event.target.value })} className={inputClass}>
                  <option value="random">按权重随机</option>
                  <option value="ordered">按发布时间轮换</option>
                </select>
              </Field>
            </div>
          </Panel>

          <Panel title="来源与权重" description="关闭某个来源后，其内容不会进入推荐；权重越高，在随机模式下越容易出现。">
            <div className="divide-y divide-[#e7e4da] dark:divide-[#27313d]">
              {Object.entries(SOURCE_META).map(([source, meta]) => (
                <div key={source} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={settings.sources[source]?.enabled !== false} onChange={(event) => updateSource(source, { enabled: event.target.checked })} className="mt-1 h-4 w-4 accent-[#15140f]" />
                    <span>
                      <strong className="block text-sm text-[#25251f] dark:text-gray-100">{meta.label} <span className="font-normal text-[#919386]">· {sourceCounts[source] || 0} 条</span></strong>
                      <span className="mt-1 block text-xs text-[#74766b] dark:text-gray-400">{meta.description}</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#74766b] dark:text-gray-400">
                    权重
                    <input type="number" min="1" max="10" value={settings.sources[source]?.weight || 1} disabled={settings.rotationMode !== 'random' || settings.sources[source]?.enabled === false} onChange={(event) => updateSource(source, { weight: Number(event.target.value) })} className="h-8 w-16 rounded-lg border border-[#d7d8ce] bg-transparent px-2 text-center text-sm text-[#292a24] disabled:opacity-40 dark:border-[#34404d] dark:text-gray-100" />
                  </label>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="人工置顶" description={`最多置顶 12 条；置顶内容优先占用每批展示名额。已选 ${settings.pinnedIds.length} 条。`}>
          <label className="relative block">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929487]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、来源或标签" className={`${inputClass} pl-9`} />
          </label>
          <div className="mt-4 max-h-[690px] divide-y divide-[#e7e4da] overflow-y-auto border-y border-[#e7e4da] dark:divide-[#27313d] dark:border-[#27313d]">
            {filteredCatalog.map((item) => {
              const checked = settings.pinnedIds.includes(item.id)
              return (
                <label key={item.id} className="flex cursor-pointer items-start gap-3 py-3 pr-2">
                  <input type="checkbox" checked={checked} disabled={!checked && settings.pinnedIds.length >= 12} onChange={() => togglePinned(item.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#15140f]" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium leading-5 text-[#292a24] dark:text-gray-100">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-[#858779] dark:text-gray-500">{item.sectionLabel} · {item.tagLabel || '未分类'}{item.date ? ` · ${item.date}` : ''}</span>
                  </span>
                </label>
              )
            })}
            {!loading && !filteredCatalog.length ? <p className="py-8 text-center text-sm text-[#858779]">没有匹配的内容</p> : null}
          </div>
        </Panel>
      </div>
    </AdminPage>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-[#d7d8ce] bg-white px-3 text-sm text-[#292a24] outline-none transition focus:border-[#818472] dark:border-[#34404d] dark:bg-[#0c1118] dark:text-gray-100'

function Panel({ title, description, children }) {
  return (
    <section className="rounded-xl border border-[#d9dbd0] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]">
      <h2 className="text-base font-semibold text-[#20211c] dark:text-gray-100">{title}</h2>
      {description ? <p className="mb-5 mt-1 text-xs leading-5 text-[#77796d] dark:text-gray-400">{description}</p> : null}
      {children}
    </section>
  )
}

function Field({ label, help, children }) {
  return <label className="block text-xs font-medium text-[#55574e] dark:text-gray-300">{label}<span className="mb-1 mt-0.5 block font-normal text-[#94968a]">{help}</span>{children}</label>
}

function ToggleCard({ title, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#ece7dc] bg-[#faf8f1] p-3 dark:border-[#252e39] dark:bg-[#0c1118]">
      <div><div className="text-sm font-medium text-[#2f3029] dark:text-gray-200">{title}</div><p className="mt-1 text-xs leading-5 text-[#77786d] dark:text-[#9aa6b6]">{description}</p></div>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-7 w-12 shrink-0 rounded-full border transition disabled:opacity-50 ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-[#c8cabc] bg-[#e9ebdf] dark:border-[#384351] dark:bg-[#1b2530]'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function Notice({ tone, children }) {
  const style = tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
  return <div className={`mb-5 rounded-lg border px-3 py-2 text-sm ${style}`}>{children}</div>
}
