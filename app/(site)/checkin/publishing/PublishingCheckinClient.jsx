'use client'

import Link from 'next/link'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendarMonth,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconFlame,
  IconLink,
  IconSparkles,
  IconTargetArrow,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  PUBLISHING_PLATFORMS,
  REQUIRED_PUBLISHING_KEYS,
  groupPublishingRecords,
  isPublishingDayComplete,
} from '../../../../lib/publishingCheckins'
import { useSessionAccount } from '../../components/SessionProvider'
import styles from './publishing.module.css'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const ERROR_LABELS = {
  INVALID_DATE: '只能记录今天或过去的日期',
  INVALID_URL: '请输入以 http:// 或 https:// 开头的发布链接',
  INVALID_PLATFORM: '暂不支持这个平台',
  UNAUTHORIZED: '请先登录再保存打卡',
}

function localToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

function monthLabel(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  return `${year} 年 ${monthNumber} 月`
}

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
  return date.toISOString().slice(0, 7)
}

function buildCalendar(month) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7
  const total = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return [
    ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `before-${index}` })),
    ...Array.from({ length: total }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`
      return { key: date, date, number: index + 1 }
    }),
  ]
}

function readableDay(day) {
  const date = new Date(`${day}T00:00:00+08:00`)
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'Asia/Shanghai' }).format(date)
  return `${Number(day.slice(5, 7))} 月 ${Number(day.slice(8, 10))} 日 · ${weekday}`
}

export default function PublishingCheckinClient() {
  const account = useSessionAccount()
  const initialToday = useMemo(localToday, [])
  const [today, setToday] = useState(initialToday)
  const [month, setMonth] = useState(initialToday.slice(0, 7))
  const [selectedDay, setSelectedDay] = useState(initialToday)
  const [records, setRecords] = useState([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [pending, setPending] = useState({})
  const [draftUrls, setDraftUrls] = useState({})
  const [message, setMessage] = useState('')

  const load = useCallback(async (targetMonth) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/publishing-checkins?month=${encodeURIComponent(targetMonth)}`, {
        cache: 'no-store', credentials: 'same-origin',
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
      setRecords(payload?.records || [])
      setStreak(Number(payload?.streak || 0))
      if (payload?.today) setToday(payload.today)
    } catch (error) {
      setMessage('记录加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(month) }, [load, month])

  const days = useMemo(() => groupPublishingRecords(records), [records])
  const calendar = useMemo(() => buildCalendar(month), [month])
  const selectedRecords = days[selectedDay] || {}
  const requiredDone = REQUIRED_PUBLISHING_KEYS.filter((key) => selectedRecords[key]).length
  const completedThisMonth = Object.values(days).filter(isPublishingDayComplete).length
  const currentMonth = today.slice(0, 7)
  const isFutureMonth = month >= currentMonth
  const canEdit = Boolean(account.user && selectedDay <= today)

  async function persist(platform, completed, postUrl) {
    const response = await fetch('/api/publishing-checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ date: selectedDay, platform, completed, postUrl }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) throw new Error(ERROR_LABELS[payload?.error] || payload?.error || '保存失败')
    return payload
  }

  async function togglePlatform(platform) {
    if (!canEdit || pending[platform.key]) return
    const existing = selectedRecords[platform.key]
    const completed = !existing
    const postUrl = draftUrls[`${selectedDay}:${platform.key}`] ?? existing?.postUrl ?? ''
    const before = records
    setPending((current) => ({ ...current, [platform.key]: true }))
    setMessage('')
    setRecords((current) => completed
      ? [...current.filter((item) => !(item.checkinDate === selectedDay && item.platform === platform.key)), { checkinDate: selectedDay, platform: platform.key, postUrl }]
      : current.filter((item) => !(item.checkinDate === selectedDay && item.platform === platform.key)))
    try {
      await persist(platform.key, completed, postUrl)
    } catch (error) {
      setRecords(before)
      setMessage(String(error?.message || error))
    } finally {
      setPending((current) => ({ ...current, [platform.key]: false }))
    }
  }

  async function saveUrl(platform) {
    const existing = selectedRecords[platform.key]
    const key = `${selectedDay}:${platform.key}`
    const postUrl = String(draftUrls[key] ?? existing?.postUrl ?? '').trim()
    if (!canEdit || !existing || postUrl === existing.postUrl) return
    setPending((current) => ({ ...current, [platform.key]: true }))
    setMessage('')
    try {
      await persist(platform.key, true, postUrl)
      setRecords((current) => current.map((item) => (
        item.checkinDate === selectedDay && item.platform === platform.key ? { ...item, postUrl } : item
      )))
      setMessage(postUrl ? '发布链接已保存' : '发布链接已清空')
    } catch (error) {
      setMessage(String(error?.message || error))
    } finally {
      setPending((current) => ({ ...current, [platform.key]: false }))
    }
  }

  async function completeRequired() {
    if (!canEdit) return
    const missing = PUBLISHING_PLATFORMS.filter((platform) => platform.required && !selectedRecords[platform.key])
    if (!missing.length) return
    setBulkBusy(true)
    setMessage('')
    try {
      await Promise.all(missing.map((platform) => persist(
        platform.key,
        true,
        draftUrls[`${selectedDay}:${platform.key}`] || ''
      )))
      await load(month)
      setMessage('今天的四个必发平台已完成')
    } catch (error) {
      await load(month)
      setMessage(String(error?.message || error))
    } finally {
      setBulkBusy(false)
    }
  }

  function changeMonth(delta) {
    const next = shiftMonth(month, delta)
    if (next > currentMonth) return
    setMonth(next)
    setSelectedDay(next === currentMonth ? today : `${next}-01`)
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><IconSparkles size={14} /> PUBLISH EVERY DAY</p>
          <h1>发文打卡</h1>
          <blockquote>“如果你想成为拳王，不每天早上早起练拳，那基本是不可能的。”</blockquote>
          <p className={styles.heroNote}>每天完成四个平台，再把更多渠道当作加练。月历会留下每次出拳。</p>
        </div>
        <div className={styles.heroStats}>
          <div><IconFlame size={19} /><span>连续完成</span><strong>{loading ? '—' : streak}</strong><small>天</small></div>
          <div><IconCalendarMonth size={19} /><span>本月达标</span><strong>{loading ? '—' : completedThisMonth}</strong><small>天</small></div>
          <div><IconTargetArrow size={19} /><span>选中日期</span><strong>{requiredDone}</strong><small>/ 4</small></div>
        </div>
      </header>

      {message ? <div className={styles.message} role="status">{message}</div> : null}

      <div className={styles.workspace}>
        <section className={styles.calendarPanel} aria-labelledby="publishing-calendar-title">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>MONTHLY RHYTHM</p>
              <h2 id="publishing-calendar-title">{monthLabel(month)}</h2>
            </div>
            <div className={styles.monthControls}>
              <button type="button" onClick={() => changeMonth(-1)} aria-label="上个月"><IconChevronLeft size={18} /></button>
              <button type="button" onClick={() => changeMonth(1)} disabled={isFutureMonth} aria-label="下个月"><IconChevronRight size={18} /></button>
            </div>
          </div>
          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAYS.map((day) => <span key={day}>周{day}</span>)}
          </div>
          <div className={styles.calendarGrid}>
            {calendar.map((item) => {
              if (!item.date) return <span key={item.key} className={styles.emptyDay} />
              const dayRecords = days[item.date] || {}
              const done = REQUIRED_PUBLISHING_KEYS.filter((key) => dayRecords[key]).length
              const complete = done === REQUIRED_PUBLISHING_KEYS.length
              const future = item.date > today
              const selected = item.date === selectedDay
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.calendarDay} ${complete ? styles.completeDay : ''} ${selected ? styles.selectedDay : ''}`}
                  disabled={future}
                  onClick={() => setSelectedDay(item.date)}
                  aria-label={`${item.date}，必发平台完成 ${done} 个`}
                  aria-pressed={selected}
                >
                  <span>{item.number}</span>
                  <span className={styles.dayProgress} style={{ '--progress': `${done / 4 * 100}%` }}>
                    {complete ? <IconCheck size={13} stroke={2.6} /> : done || ''}
                  </span>
                </button>
              )
            })}
          </div>
          <div className={styles.legend}>
            <span><i className={styles.legendComplete} />四个平台均已发布</span>
            <span><i className={styles.legendPartial} />已有进度</span>
          </div>
        </section>

        <section className={styles.dayPanel} aria-labelledby="selected-day-title">
          <div className={styles.dayHeading}>
            <div>
              <p className={styles.eyebrow}>DAILY PUBLISHING</p>
              <h2 id="selected-day-title">{readableDay(selectedDay)}</h2>
              <p>{requiredDone === 4 ? '今日必发任务已完成，可以继续加练。' : `还差 ${4 - requiredDone} 个必发平台。`}</p>
            </div>
            {account.user && requiredDone < 4 && selectedDay <= today ? (
              <button type="button" className={styles.completeButton} disabled={bulkBusy} onClick={completeRequired}>
                <IconCheck size={16} /> {bulkBusy ? '保存中…' : '一键完成必发'}
              </button>
            ) : null}
          </div>

          {!account.loading && !account.user ? (
            <div className={styles.loginPrompt}>
              <IconTargetArrow size={25} />
              <div><strong>登录后开始记录</strong><p>打卡数据会跟随账号保存，可以按月回看。</p></div>
              <Link href={`/login?callbackUrl=${encodeURIComponent('/checkin/publishing')}`}>登录 / 注册 <IconArrowRight size={15} /></Link>
            </div>
          ) : null}

          <PlatformGroup
            title="每日必发"
            hint="全部完成后，当天会在日历中点亮。"
            platforms={PUBLISHING_PLATFORMS.filter((platform) => platform.required)}
            selectedDay={selectedDay}
            records={selectedRecords}
            draftUrls={draftUrls}
            setDraftUrls={setDraftUrls}
            pending={pending}
            canEdit={canEdit}
            onToggle={togglePlatform}
            onSaveUrl={saveUrl}
          />
          <PlatformGroup
            title="可选加练"
            hint="知乎、头条等平台不影响当天达标。"
            platforms={PUBLISHING_PLATFORMS.filter((platform) => !platform.required)}
            selectedDay={selectedDay}
            records={selectedRecords}
            draftUrls={draftUrls}
            setDraftUrls={setDraftUrls}
            pending={pending}
            canEdit={canEdit}
            onToggle={togglePlatform}
            onSaveUrl={saveUrl}
          />
        </section>
      </div>

      <Link href="/checkin" className={styles.backLink}><IconArrowLeft size={15} /> 返回签到中心</Link>
    </main>
  )
}

function PlatformGroup({ title, hint, platforms, selectedDay, records, draftUrls, setDraftUrls, pending, canEdit, onToggle, onSaveUrl }) {
  return (
    <div className={styles.platformGroup}>
      <div className={styles.groupTitle}><h3>{title}</h3><span>{hint}</span></div>
      <div className={styles.platformList}>
        {platforms.map((platform) => {
          const record = records[platform.key]
          const checked = Boolean(record)
          const inputKey = `${selectedDay}:${platform.key}`
          const value = draftUrls[inputKey] ?? record?.postUrl ?? ''
          return (
            <article key={platform.key} className={`${styles.platformCard} ${checked ? styles.checkedCard : ''}`}>
              <button
                type="button"
                className={styles.platformToggle}
                onClick={() => onToggle(platform)}
                disabled={!canEdit || pending[platform.key]}
                aria-pressed={checked}
              >
                <span className={styles.platformMark} style={{ '--brand': platform.color }}>{platform.short}</span>
                <span><strong>{platform.label}</strong><small>{platform.required ? '必发' : '可选'}</small></span>
                <i>{checked ? <IconCheck size={15} stroke={2.8} /> : null}</i>
              </button>
              <label className={styles.urlField}>
                <IconLink size={14} />
                <span className="sr-only">{platform.label}发布链接</span>
                <input
                  type="url"
                  value={value}
                  disabled={!canEdit}
                  placeholder={checked ? '粘贴发布链接（可选）' : '完成后可补发布链接'}
                  onChange={(event) => setDraftUrls((current) => ({ ...current, [inputKey]: event.target.value }))}
                  onBlur={() => onSaveUrl(platform)}
                />
                {record?.postUrl ? <a href={record.postUrl} target="_blank" rel="noreferrer" aria-label={`打开${platform.label}发布链接`}><IconExternalLink size={14} /></a> : null}
              </label>
            </article>
          )
        })}
      </div>
    </div>
  )
}
