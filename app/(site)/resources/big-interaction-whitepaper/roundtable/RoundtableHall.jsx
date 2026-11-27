'use client'

import { useEffect, useMemo, useState } from 'react'

import { findInteractionAgent } from '../../../../../lib/interaction/agentPool.js'
import InteractionAccountSelect from '../InteractionAccountSelect'
import {
  canonicalDailyTopSubject,
  dailyTopSubjectKey,
  DAILY_TOP_SUBJECT,
  isDailyTopSubject,
} from '../../../../../lib/interaction/dailyTop/model.js'
import styles from './roundtable.module.css'

const PER_PAGE = 8
const DEFAULT_ACCOUNT = DAILY_TOP_SUBJECT

function readAccountFromQuery() {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT
  const account = canonicalDailyTopSubject(new URLSearchParams(window.location.search).get('account') || DEFAULT_ACCOUNT)
  return isDailyTopSubject(account) ? account : DEFAULT_ACCOUNT
}

function Seat({ person, position }) {
  const [failed, setFailed] = useState(false)
  const interactionHint = person.interactionCount > 0 ? ` · 日历累计互动 ${person.interactionCount}` : ''
  return (
    <a
      className={styles.seat}
      style={position}
      href={`https://x.com/${person.handle}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${person.name} · @${person.handle}${interactionHint}`}
    >
      {person.avatar && !failed ? (
        <img
          src={person.avatar}
          alt={`${person.name}的头像`}
          width="64"
          height="64"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.avatarFallback}>{person.name.slice(0, 2).toUpperCase()}</span>
      )}
      <strong>{person.name}</strong>
      <small>@{person.handle}</small>
    </a>
  )
}

export default function RoundtableHall() {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT)
  const accountKey = dailyTopSubjectKey(account)
  const [people, setPeople] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emptyMessage, setEmptyMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const nextAccount = readAccountFromQuery()
    setAccount(nextAccount)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setEmptyMessage('')
    const handle = canonicalDailyTopSubject(account)
    const url = `/api/interaction/roundtable?account=${encodeURIComponent(handle)}`
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (response.status === 404) {
          setPeople([])
          setMeta(null)
          setEmptyMessage(body.message || '该账号还没有圆桌名录。')
          setLoading(false)
          return
        }
        if (!response.ok) throw new Error(body.error === 'INVALID_ACCOUNT' ? '账号不在大互动池内' : '名录暂时无法加载')
        if (!Array.isArray(body.people)) throw new Error('名录数据暂不可用')
        setPeople(body.people)
        setMeta({
          count: body.count,
          updatedAt: body.updatedAt || body.capturedAt,
          complete: body.complete,
        })
        setLoading(false)
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return
        setError(fetchError.message)
        setLoading(false)
      })
    return () => controller.abort()
  }, [account, attempt])

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
    setQuery('')
  }, [accountKey])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^@/, '')
    return term ? people.filter((person) => `${person.name} ${person.handle}`.toLowerCase().includes(term)) : people
  }, [people, query])

  const tableCount = Math.ceil(filtered.length / 8)
  const pages = Math.ceil(tableCount / PER_PAGE)
  const current = Math.min(page, Math.max(0, pages - 1))
  const activeAgent = findInteractionAgent(account)

  function syncAccount(nextAccount) {
    const url = new URL(window.location.href)
    url.searchParams.set('account', canonicalDailyTopSubject(nextAccount))
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  function chooseAccount(next) {
    const handle = canonicalDailyTopSubject(next)
    if (!isDailyTopSubject(handle) || dailyTopSubjectKey(handle) === accountKey) return
    setAccount(handle)
    syncAccount(handle)
  }

  const updatedLabel = meta?.updatedAt
    ? new Date(meta.updatedAt).toISOString().replace('T', ' ').slice(0, 16)
  : null

  return (
    <>
      <div className={styles.accountPanel}>
        <InteractionAccountSelect
          account={account}
          onChoose={chooseAccount}
          ariaLabel="圆桌认证粉丝名录账号"
          label="圆桌账号"
        />
      </div>
      {loading && <p className={styles.noResults} role="status">伙伴们正在入座，请稍候……</p>}
      {!loading && error && (
        <div className={styles.controls} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt(attempt + 1)}>重新加载名录</button>
        </div>
      )}
      {!loading && !error && emptyMessage && (
        <p className={styles.noResults} role="status">{emptyMessage}</p>
      )}
      {!loading && !error && !emptyMessage && (
        <>
          <div className={styles.controls}>
            <label>
              找一位交流伙伴
              <input
                type="search"
                value={query}
                placeholder="搜索昵称或 @账号"
                onChange={(event) => { setQuery(event.target.value); setPage(0) }}
              />
            </label>
            <p role="status">
              {activeAgent?.name || account} · {meta?.count?.toLocaleString('en-US') ?? filtered.length} 位伙伴
              {updatedLabel ? ` · 名录更新 ${updatedLabel} UTC` : ''}
              {meta?.complete === false ? ' · 采集未完成' : ''}
              {' · '}
              {filtered.length} 位在席 · {tableCount} 张圆桌 · 席位按日历累计互动量从前到后排列
            </p>
          </div>
          {!filtered.length && <p className={styles.noResults}>没有找到匹配的伙伴，试试其他昵称或账号。</p>}
          <div className={styles.hall}>
            {Array.from({ length: Math.min(PER_PAGE, tableCount - current * PER_PAGE) }, (_, i) => {
              const table = current * PER_PAGE + i
              const seats = filtered.slice(table * 8, table * 8 + 8)
              return (
                <section key={`${accountKey}-${query}-${table}`} className={styles.scene} aria-label={`第 ${table + 1} 桌`}>
                  <div className={styles.table}>
                    <span>圆桌 {String(table + 1).padStart(3, '0')}</span>
                    <h2>大互动理论</h2>
                    <p>表达 · 倾听 · 反馈 · 行动</p>
                    <i aria-hidden="true">✳</i>
                  </div>
                  {seats.map((person, seat) => {
                    const angle = seat * Math.PI / 4 - Math.PI / 2
                    return (
                      <Seat
                        key={person.handle}
                        person={person}
                        position={{ left: `${50 + Math.cos(angle) * 40}%`, top: `${50 + Math.sin(angle) * 40}%` }}
                      />
                    )
                  })}
                </section>
              )
            })}
          </div>
          {pages > 0 && (
            <nav className={styles.pagination} aria-label="圆桌分页">
              <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>上一组圆桌</button>
              <span>{current + 1} / {pages}</span>
              <button type="button" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>下一组圆桌</button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
