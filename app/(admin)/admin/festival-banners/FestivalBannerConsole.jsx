'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconCopy, IconDeviceFloppy, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react'

import { AdminButton, AdminPage } from '../../components/ui'

const THEMES = [
  ['red-gold', '中国红 / 金色'],
  ['spring', '新春暖红'],
  ['warm', '暖金节庆'],
  ['cool', '清爽蓝绿'],
  ['neutral', '素雅中性'],
]

function newBanner() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return {
    id: '', festivalKey: '', name: '', enabled: true,
    startAt: start.getTime(), endAt: end.getTime(),
    title: '', compactTitle: '', subtitle: '', badgeValue: '', badgeLabel: '',
    leftImage: '', rightImage: '', theme: 'red-gold', animateLeft: false, priority: 0,
  }
}

function toLocalInput(value) {
  const date = new Date(Number(value))
  if (!Number.isFinite(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function fromLocalInput(value) {
  return new Date(value).getTime()
}

function yearToChinese(year) {
  const digits = '〇一二三四五六七八九'
  return String(year).replace(/\d/g, (digit) => digits[Number(digit)])
}

function copyToNextYear(source) {
  const start = new Date(source.startAt)
  const end = new Date(source.endAt)
  const oldYear = start.getFullYear()
  const targetYear = oldYear + 1
  start.setFullYear(targetYear)
  end.setFullYear(targetYear)
  const badge = /^\d+$/.test(source.badgeValue) ? String(Number(source.badgeValue) + 1) : source.badgeValue
  const subtitle = source.subtitle
    .replace(String(oldYear), String(targetYear))
    .replace(new RegExp(`${yearToChinese(oldYear)}(?!.*${yearToChinese(oldYear)})`), yearToChinese(targetYear))
  return {
    ...source,
    id: '',
    name: source.name.includes(String(oldYear)) ? source.name.replace(String(oldYear), String(targetYear)) : `${source.name} ${targetYear}`,
    startAt: start.getTime(),
    endAt: end.getTime(),
    subtitle,
    badgeValue: badge,
    enabled: false,
  }
}

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

export default function FestivalBannerConsole() {
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(newBanner)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/festival-banners', { cache: 'no-store' })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setItems(Array.isArray(data?.banners) ? data.banners : [])
    } catch (reason) {
      setError(reason?.message || '读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    setMessage('')
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/festival-banners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner: draft }),
      })
      const data = await readJson(response)
      if (!response.ok || !data?.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      setDraft(data.banner)
      setMessage('横幅已保存，首页会自动读取当前生效项。')
      await load()
    } catch (reason) {
      setError(reason?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`确定删除“${item.name}”吗？历史记录将无法恢复。`)) return
    const response = await fetch(`/api/admin/festival-banners?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
    const data = await readJson(response)
    if (!response.ok || !data?.ok) { setError(data?.error || '删除失败'); return }
    if (draft.id === item.id) setDraft(newBanner())
    setMessage('横幅已删除。')
    await load()
  }

  const now = Date.now()
  const activeId = useMemo(() => items
    .filter((item) => item.enabled && item.startAt <= now && item.endAt >= now)
    .sort((a, b) => b.priority - a.priority || b.updatedAt - a.updatedAt)[0]?.id, [items, now])

  return (
    <AdminPage
      title="节日横幅"
      description="管理首页固定节日提示位。每年保留独立记录，可复制上一年配置后调整并重新启用。"
      actions={<><AdminButton onClick={load} disabled={loading}><IconRefresh size={15} />刷新</AdminButton><AdminButton variant="primary" onClick={save} disabled={saving}><IconDeviceFloppy size={15} />{saving ? '保存中…' : '保存横幅'}</AdminButton></>}
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Panel title="历史与排期" description="时间重叠时，首页展示优先级最高的一条。">
          <AdminButton onClick={() => setDraft(newBanner())}><IconPlus size={15} />新建横幅</AdminButton>
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <div key={item.id} className={`rounded-lg border p-3 ${draft.id === item.id ? 'border-[#8b7a43] bg-[#faf7ec] dark:border-[#877640] dark:bg-[#19170f]' : 'border-[#e1e2d8] dark:border-[#29333f]'}`}>
                <button type="button" onClick={() => setDraft(item)} className="w-full text-left">
                  <span className="flex items-center justify-between gap-3"><strong className="text-sm text-[#292a24] dark:text-gray-100">{item.name}</strong><span className={`text-[11px] ${item.id === activeId ? 'text-emerald-600' : item.enabled ? 'text-[#8a7440]' : 'text-[#999]'}`}>{item.id === activeId ? '展示中' : item.enabled ? '已排期' : '未启用'}</span></span>
                  <span className="mt-1 block text-xs text-[#818376] dark:text-gray-400">{new Date(item.startAt).toLocaleString('zh-CN')} — {new Date(item.endAt).toLocaleString('zh-CN')}</span>
                </button>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setDraft(copyToNextYear(item))} className={miniButtonClass}><IconCopy size={13} />复用到下一年</button>
                  <button type="button" onClick={() => remove(item)} className={`${miniButtonClass} text-rose-600`}><IconTrash size={13} />删除</button>
                </div>
              </div>
            ))}
            {!loading && !items.length ? <p className="py-8 text-center text-sm text-[#858779]">还没有节日横幅</p> : null}
          </div>
        </Panel>

        <Panel title={draft.id ? '编辑横幅' : '新建横幅'} description="图片可填写站内 /public 路径或 HTTPS 地址；建议使用透明 WebP。">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="内部名称"><input className={inputClass} value={draft.name} onChange={(e) => update('name', e.target.value)} placeholder="例如：国庆节 2027" /></Field>
            <Field label="节日标识"><input className={inputClass} value={draft.festivalKey} onChange={(e) => update('festivalKey', e.target.value)} placeholder="national-day" /></Field>
            <Field label="开始展示"><input type="datetime-local" className={inputClass} value={toLocalInput(draft.startAt)} onChange={(e) => { const value = fromLocalInput(e.target.value); if (Number.isFinite(value)) update('startAt', value) }} /></Field>
            <Field label="结束展示"><input type="datetime-local" className={inputClass} value={toLocalInput(draft.endAt)} onChange={(e) => { const value = fromLocalInput(e.target.value); if (Number.isFinite(value)) update('endAt', value) }} /></Field>
            <Field label="主标题"><input className={inputClass} value={draft.title} onChange={(e) => update('title', e.target.value)} /></Field>
            <Field label="手机短标题"><input className={inputClass} value={draft.compactTitle} onChange={(e) => update('compactTitle', e.target.value)} /></Field>
            <Field label="副标题 / 年份"><input className={inputClass} value={draft.subtitle} onChange={(e) => update('subtitle', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="大号数字"><input className={inputClass} value={draft.badgeValue} onChange={(e) => update('badgeValue', e.target.value)} /></Field><Field label="数字单位"><input className={inputClass} value={draft.badgeLabel} onChange={(e) => update('badgeLabel', e.target.value)} /></Field></div>
            <Field label="左侧图片"><input className={inputClass} value={draft.leftImage} onChange={(e) => update('leftImage', e.target.value)} placeholder="/images/...webp" /></Field>
            <Field label="右侧图片"><input className={inputClass} value={draft.rightImage} onChange={(e) => update('rightImage', e.target.value)} placeholder="/images/...webp" /></Field>
            <Field label="配色"><select className={inputClass} value={draft.theme} onChange={(e) => update('theme', e.target.value)}>{THEMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="优先级"><input type="number" min="-999" max="999" className={inputClass} value={draft.priority} onChange={(e) => update('priority', Number(e.target.value))} /></Field>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Toggle title="启用横幅" description="关闭后即使处于时间范围也不展示。" checked={draft.enabled} onChange={(value) => update('enabled', value)} />
            <Toggle title="左图飘动" description="适合旗帜、丝带等动态素材。" checked={draft.animateLeft} onChange={(value) => update('animateLeft', value)} />
          </div>
        </Panel>
      </div>
    </AdminPage>
  )
}

const inputClass = 'mt-1 h-10 w-full rounded-lg border border-[#d7d8ce] bg-white px-3 text-sm text-[#292a24] outline-none focus:border-[#818472] dark:border-[#34404d] dark:bg-[#0c1118] dark:text-gray-100'
const miniButtonClass = 'inline-flex items-center gap-1 rounded-md border border-[#dcded3] px-2 py-1 text-[11px] text-[#66685e] hover:bg-white dark:border-[#34404d] dark:text-gray-300 dark:hover:bg-[#111923]'

function Panel({ title, description, children }) { return <section className="rounded-xl border border-[#d9dbd0] bg-white p-5 shadow-sm dark:border-[#252e39] dark:bg-[#10161f]"><h2 className="text-base font-semibold text-[#20211c] dark:text-gray-100">{title}</h2><p className="mb-5 mt-1 text-xs leading-5 text-[#77796d] dark:text-gray-400">{description}</p>{children}</section> }
function Field({ label, children }) { return <label className="block text-xs font-medium text-[#55574e] dark:text-gray-300">{label}{children}</label> }
function Toggle({ title, description, checked, onChange }) { return <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e3e4da] p-3 dark:border-[#303946]"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-[#8c7435]" /><span><strong className="block text-sm text-[#303129] dark:text-gray-100">{title}</strong><span className="mt-1 block text-xs text-[#808277] dark:text-gray-400">{description}</span></span></label> }
function Notice({ tone, children }) { const style = tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'; return <div className={`mb-5 rounded-lg border px-3 py-2 text-sm ${style}`}>{children}</div> }
