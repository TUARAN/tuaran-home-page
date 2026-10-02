'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconCalendarEvent,
  IconCirclePlus,
  IconDeviceFloppy,
  IconLock,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'

import {
  defaultHolidayJournal,
  HOLIDAY_JOURNAL_LOCAL_STORAGE_KEY,
  normalizeHolidayJournal,
} from '../../../../lib/holidayJournal'
import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'

function readLocalJournal() {
  try {
    const raw = window.localStorage.getItem(HOLIDAY_JOURNAL_LOCAL_STORAGE_KEY)
    return raw ? normalizeHolidayJournal(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function writeLocalJournal(journal) {
  window.localStorage.setItem(HOLIDAY_JOURNAL_LOCAL_STORAGE_KEY, JSON.stringify(journal))
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nextDayLabel(index) {
  const chinese = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return `第${chinese[index] || index + 1}天`
}

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

export default function HolidayJournalClient() {
  const [journal, setJournal] = useState(() => defaultHolidayJournal())
  const [activeId, setActiveId] = useState('2026-national-day')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [persistent, setPersistent] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const activeHoliday = useMemo(
    () => journal.holidays.find((holiday) => holiday.id === activeId) || journal.holidays[0],
    [activeId, journal.holidays],
  )

  const applyJournal = useCallback((nextJournal, options = {}) => {
    const normalized = normalizeHolidayJournal(nextJournal)
    setJournal(normalized)
    setActiveId((current) => normalized.holidays.some((item) => item.id === current)
      ? current
      : normalized.holidays[0].id)
    if (!options.keepDirty) setDirty(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/admin/holiday-journal', { cache: 'no-store', credentials: 'same-origin' })
        const data = await readJson(response)
        if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
        if (cancelled) return
        const local = data.persistent === false ? readLocalJournal() : null
        applyJournal(local || data.journal)
        setPersistent(data.persistent !== false)
      } catch (reason) {
        if (cancelled) return
        const local = readLocalJournal()
        if (local) {
          applyJournal(local)
          setPersistent(false)
          setMessage('当前使用此浏览器的本地副本。')
        } else {
          setError(reason?.message || '读取失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [applyJournal])

  const mutate = useCallback((updater) => {
    setJournal((current) => normalizeHolidayJournal(updater(current)))
    setDirty(true)
    setMessage('')
    setError('')
  }, [])

  const updateHoliday = useCallback((patch) => {
    if (!activeHoliday) return
    mutate((current) => ({
      ...current,
      holidays: current.holidays.map((holiday) => holiday.id === activeHoliday.id
        ? { ...holiday, ...patch }
        : holiday),
    }))
  }, [activeHoliday, mutate])

  const updateDay = useCallback((dayId, patch) => {
    if (!activeHoliday) return
    updateHoliday({
      days: activeHoliday.days.map((day) => day.id === dayId ? { ...day, ...patch } : day),
    })
  }, [activeHoliday, updateHoliday])

  const addDay = useCallback(() => {
    if (!activeHoliday) return
    const index = activeHoliday.days.length
    updateHoliday({
      days: [...activeHoliday.days, {
        id: makeId('day'),
        date: '',
        label: nextDayLabel(index),
        keywords: [],
        note: '',
      }],
    })
  }, [activeHoliday, updateHoliday])

  const addHoliday = useCallback(() => {
    const year = new Date().getFullYear()
    const id = makeId('holiday')
    mutate((current) => ({
      ...current,
      holidays: [{
        id,
        title: `${year} 新节假日`,
        year,
        dateRange: '',
        status: 'recording',
        visibility: 'owner',
        days: [],
      }, ...current.holidays],
    }))
    setActiveId(id)
  }, [mutate])

  const removeDay = useCallback((dayId) => {
    if (!activeHoliday || !window.confirm('删除这一天的记录？')) return
    updateHoliday({ days: activeHoliday.days.filter((day) => day.id !== dayId) })
  }, [activeHoliday, updateHoliday])

  const save = useCallback(async () => {
    setSaving(true)
    setError('')
    setMessage('')
    const normalized = normalizeHolidayJournal(journal)
    try {
      const response = await fetch('/api/admin/holiday-journal', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journal: normalized }),
      })
      const data = await readJson(response)
      if (!response.ok) throw new Error(data?.error || `HTTP_${response.status}`)
      applyJournal(data.journal)
      setPersistent(true)
      window.localStorage.removeItem(HOLIDAY_JOURNAL_LOCAL_STORAGE_KEY)
      setMessage('已保存到私有记录。')
    } catch (reason) {
      writeLocalJournal(normalized)
      setPersistent(false)
      setDirty(true)
      setMessage('云端暂不可用，已保存到此浏览器。')
      setError(reason?.message === 'DB_UNAVAILABLE' ? '' : (reason?.message || '保存失败'))
    } finally {
      setSaving(false)
    }
  }, [applyJournal, journal])

  return (
    <AdminPage
      title="生活记录"
      description="按大型节假日留下日常片段。记录默认处于私密区，不参与公开内容索引。"
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="neutral"><IconLock size={13} />仅站长可见</StatusPill>
          <AdminButton variant="primary" onClick={save} disabled={loading || saving || !dirty}>
            <IconDeviceFloppy size={16} />{saving ? '保存中…' : '保存记录'}
          </AdminButton>
        </div>
      )}
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[#d8dacd] bg-[linear-gradient(135deg,#f5f0df_0%,#edf2e7_50%,#e7edf2_100%)] p-5 dark:border-[#2c3744] dark:bg-[linear-gradient(135deg,#201d16_0%,#151d18_50%,#141b22_100%)] md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f8863]">Holiday journal</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#272920] dark:text-gray-100">把假期过成可以回看的生活</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#65685e] dark:text-gray-300">不要求完整，也不追求总结。想到什么就补一段，琐碎的小事也值得留下。</p>
            </div>
            <AdminButton onClick={addHoliday}><IconCirclePlus size={16} />新增节假日</AdminButton>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <Section title="节假日档案" description="以后新增的节假日会留在这里。">
            <div className="space-y-2">
              {journal.holidays.map((holiday) => (
                <button
                  key={holiday.id}
                  type="button"
                  onClick={() => setActiveId(holiday.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${holiday.id === activeHoliday?.id
                    ? 'border-[#8e9675] bg-[#f0f2e9] dark:border-[#687457] dark:bg-[#182018]'
                    : 'border-[#e0e1d8] bg-white hover:border-[#bfc3b2] dark:border-[#283340] dark:bg-[#0f161f]'}`}
                >
                  <span className="block text-sm font-semibold text-[#33362d] dark:text-gray-100">{holiday.title}</span>
                  <span className="mt-1 block text-xs text-[#85877d] dark:text-gray-400">{holiday.dateRange || '日期待补'} · {holiday.days.length} 天</span>
                </button>
              ))}
            </div>
          </Section>

          {activeHoliday ? (
            <div className="space-y-4">
              <Section
                title="档案信息"
                description="标题和日期范围可以随时调整。"
                actions={<StatusPill tone={activeHoliday.status === 'complete' ? 'success' : 'warning'} size="sm">{activeHoliday.status === 'complete' ? '已完成' : '记录中'}</StatusPill>}
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_9rem]">
                  <label className="text-xs font-medium text-[#67695d] dark:text-gray-400">节假日名称
                    <input value={activeHoliday.title} onChange={(event) => updateHoliday({ title: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-[#d7d9cf] bg-white px-3 text-sm text-[#2e3029] outline-none focus:border-[#8b9274] dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-100" />
                  </label>
                  <label className="text-xs font-medium text-[#67695d] dark:text-gray-400">日期范围
                    <input value={activeHoliday.dateRange} onChange={(event) => updateHoliday({ dateRange: event.target.value })} placeholder="10月1日—10月7日" className="mt-1.5 h-10 w-full rounded-lg border border-[#d7d9cf] bg-white px-3 text-sm text-[#2e3029] outline-none focus:border-[#8b9274] dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-100" />
                  </label>
                  <label className="text-xs font-medium text-[#67695d] dark:text-gray-400">状态
                    <select value={activeHoliday.status} onChange={(event) => updateHoliday({ status: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-[#d7d9cf] bg-white px-3 text-sm text-[#2e3029] dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-100">
                      <option value="recording">记录中</option>
                      <option value="complete">已完成</option>
                    </select>
                  </label>
                </div>
              </Section>

              {activeHoliday.days.map((day, index) => (
                <Section
                  key={day.id}
                  title={day.label || `第 ${index + 1} 天`}
                  description={day.date || '日期待补'}
                  actions={(
                    <button type="button" onClick={() => removeDay(day.id)} aria-label={`删除${day.label}`} className="rounded-lg p-2 text-[#929487] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30">
                      <IconTrash size={16} />
                    </button>
                  )}
                >
                  <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <label className="text-xs font-medium text-[#67695d] dark:text-gray-400">日期
                      <input type="date" value={day.date} onChange={(event) => updateDay(day.id, { date: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-[#d7d9cf] bg-white px-3 text-sm dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-100" />
                    </label>
                    <label className="text-xs font-medium text-[#67695d] dark:text-gray-400">当天标题
                      <input value={day.label} onChange={(event) => updateDay(day.id, { label: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-[#d7d9cf] bg-white px-3 text-sm dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-100" />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs font-medium text-[#67695d] dark:text-gray-400">关键词（用顿号或逗号分开）
                    <input
                      value={day.keywords.join('、')}
                      onChange={(event) => updateDay(day.id, { keywords: event.target.value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean) })}
                      className="mt-1.5 h-10 w-full rounded-lg border border-[#d7d9cf] bg-white px-3 text-sm dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-100"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {day.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#eff1e8] px-2.5 py-1 text-[11px] text-[#6c735a] dark:bg-[#192219] dark:text-[#b8c1a5]">#{keyword}</span>)}
                  </div>
                  <label className="mt-3 block text-xs font-medium text-[#67695d] dark:text-gray-400">当天记录
                    <textarea value={day.note} onChange={(event) => updateDay(day.id, { note: event.target.value })} rows={6} className="mt-1.5 w-full resize-y rounded-xl border border-[#d7d9cf] bg-white px-3 py-2.5 text-sm leading-7 text-[#36382f] outline-none focus:border-[#8b9274] dark:border-[#2c3744] dark:bg-[#0d141c] dark:text-gray-200" />
                  </label>
                </Section>
              ))}

              <button type="button" onClick={addDay} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfd2c5] py-4 text-sm font-medium text-[#6e725f] transition hover:border-[#8c9473] hover:bg-[#f4f5ef] dark:border-[#34404d] dark:text-gray-400 dark:hover:bg-[#111922]">
                <IconPlus size={17} />增补一天
              </button>
            </div>
          ) : null}
        </div>

        {loading ? <p className="text-sm text-[#777a6f]">正在读取私密记录…</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p> : null}
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p> : null}
        {!persistent ? <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300"><IconCalendarEvent size={14} />当前数据保存在此浏览器；恢复 D1 后再次保存即可同步到云端。</p> : null}
      </div>
    </AdminPage>
  )
}
