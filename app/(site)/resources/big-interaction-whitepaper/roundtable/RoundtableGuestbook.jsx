'use client'

import { useCallback, useEffect, useState } from 'react'

import { useSessionAccount } from '../../../components/SessionProvider'
import styles from './roundtable.module.css'

const ARTICLE_KEY = 'resource:big-interaction-roundtable'
const STARTER_NOTES = [
  {
    id: 'starter-zhou',
    name: '游客 · 小周',
    time: '2026-11-01T21:36:00+08:00',
    text: '我的理解是，把想法拿出来跟人聊，再根据反馈去试。一直自己琢磨，很容易觉得自己都对。',
  },
  {
    id: 'starter-amu',
    name: '游客 · 路过的阿木',
    time: '2026-10-31T12:18:00+08:00',
    text: '我觉得关键在聊完之后。听到不同意见，愿不愿意改、有没有去做，这才是大互动理论有用的地方。',
  },
]

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${pick('month')} 月 ${pick('day')} 日 ${pick('hour')}:${pick('minute')}`
}

function errorText(code) {
  if (code === 'RATE_LIMITED') return '写得太密了，稍后再发。'
  if (code === 'MESSAGE_TOO_LONG') return '留言最多 1000 字。'
  if (code === 'EMPTY_MESSAGE') return '先写一点内容。'
  if (code === 'USER_BLOCKED') return '这个账号暂时不能留言。'
  return '留言没有发出去，请再试一次。'
}

export default function RoundtableGuestbook() {
  const { user, loading: userLoading } = useSessionAccount()
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({ articleKey: ARTICLE_KEY, limit: '50' })
      const res = await fetch(`/api/comments?${params}`, { cache: 'no-store', credentials: 'same-origin' })
      const data = await res.json().catch(() => null)
      if (!res.ok) return
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch {
      // The two existing notes stay visible when the list cannot be loaded.
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function submit(event) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleKey: ARTICLE_KEY, message: trimmed }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorText(data?.error))
      setMessage('')
      await refresh()
    } catch (err) {
      setError(err?.message || errorText())
    } finally {
      setSending(false)
    }
  }

  const total = items.length + STARTER_NOTES.length
  const displayName = user?.name || user?.login || ''

  return (
    <section className={styles.guestbook} aria-labelledby="guestbook-title">
      <div className={styles.guestbookHeading}>
        <h2 id="guestbook-title">游客留言</h2>
        <span>{total} 条留言</span>
      </div>
      <p className={styles.guestbookIntro}>你怎么理解大互动理论？说说你的看法。</p>
      <form className={styles.guestForm} onSubmit={submit}>
        <label className={styles.guestLabel} htmlFor="roundtable-guestbook">
          {userLoading ? '写一条留言' : displayName ? `以 ${displayName} 的身份留言` : '游客可以直接写，登录后这条留言会归到你的账号'}
        </label>
        <textarea
          id="roundtable-guestbook"
          className={styles.guestInput}
          value={message}
          maxLength={1000}
          rows={4}
          placeholder="写下你的看法"
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className={styles.guestActions}>
          <span>{1000 - message.trim().length} 字</span>
          <button type="submit" disabled={sending || !message.trim()}>
            {sending ? '发送中…' : '写下留言'}
          </button>
        </div>
        {error ? <p className={styles.guestError}>{error}</p> : null}
      </form>
      <ol className={styles.guestComments}>
        {items.map((item) => (
          <li key={item.id}>
            <header>
              <strong>{item.user_name || '游客'}</strong>
              <time dateTime={new Date(Number(item.created_at)).toISOString()}>{formatStamp(Number(item.created_at))}</time>
            </header>
            <p>{item.message}</p>
          </li>
        ))}
        {STARTER_NOTES.map((item) => (
          <li key={item.id}>
            <header>
              <strong>{item.name}</strong>
              <time dateTime={item.time}>{formatStamp(item.time)}</time>
            </header>
            <p>{item.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
