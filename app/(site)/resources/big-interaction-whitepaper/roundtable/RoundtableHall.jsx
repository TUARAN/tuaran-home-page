'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './roundtable.module.css'

const PER_PAGE = 8
function Seat({ person, position }) {
  const [failed, setFailed] = useState(false)
  return <a className={styles.seat} style={position} href={`https://x.com/${person.handle}`} target="_blank" rel="noopener noreferrer" title={`${person.name} · @${person.handle}`}>
    {person.avatar && !failed ? <img src={person.avatar} alt={`${person.name}的头像`} width="64" height="64" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <span className={styles.avatarFallback}>{person.name.slice(0, 2).toUpperCase()}</span>}
    <strong>{person.name}</strong><small>@{person.handle}</small>
  </a>
}
export default function RoundtableHall() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/interaction/roundtable', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('名录暂时无法加载'); return response.json() })
      .then(snapshot => {
        if (!Array.isArray(snapshot.people)) throw new Error('名录数据暂不可用')
        setPeople(snapshot.people.filter(person => /^[A-Za-z0-9_]{1,15}$/.test(person?.handle || '') && typeof person.name === 'string'))
        setLoading(false)
      })
      .catch(error => { if (controller.signal.aborted) return; setError(error.message); setLoading(false) })
    return () => controller.abort()
  }, [attempt])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^@/, '')
    return term ? people.filter(person => `${person.name} ${person.handle}`.toLowerCase().includes(term)) : people
  }, [people, query])
  const count = Math.ceil(filtered.length / 8)
  const pages = Math.ceil(count / PER_PAGE)
  const current = Math.min(page, Math.max(0, pages - 1))
  if (loading) return <p className={styles.noResults} role="status">伙伴们正在入座，请稍候……</p>
  if (error) return <div className={styles.controls} role="alert"><p>{error}</p><button onClick={() => setAttempt(attempt + 1)}>重新加载名录</button></div>
  return <>
    <div className={styles.controls}><label>找一位交流伙伴<input type="search" value={query} placeholder="搜索昵称或 @账号" onChange={event => { setQuery(event.target.value); setPage(0) }} /></label><p role="status">{filtered.length} 位伙伴 · {count} 张圆桌 · 每桌 8 席</p></div>
    {!filtered.length && <p className={styles.noResults}>没有找到匹配的伙伴，试试其他昵称或账号。</p>}
    <div className={styles.hall}>{Array.from({ length: Math.min(PER_PAGE, count - current * PER_PAGE) }, (_, i) => {
      const table = current * PER_PAGE + i
      const seats = filtered.slice(table * 8, table * 8 + 8)
      return <section key={`${query}-${table}`} className={styles.scene} aria-label={`第 ${table + 1} 桌`}>
        <div className={styles.table}><span>圆桌 {String(table + 1).padStart(3, '0')}</span><h2>大互动理论</h2><p>表达 · 倾听 · 反馈 · 行动</p><i aria-hidden="true">✳</i></div>
        {seats.map((person, seat) => { const angle = seat * Math.PI / 4 - Math.PI / 2; return <Seat key={person.handle} person={person} position={{ left: `${50 + Math.cos(angle) * 40}%`, top: `${50 + Math.sin(angle) * 40}%` }} /> })}
      </section>
    })}</div>
    {pages > 0 && <nav className={styles.pagination} aria-label="圆桌分页"><button disabled={current === 0} onClick={() => setPage(current - 1)}>上一组圆桌</button><span>{current + 1} / {pages}</span><button disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>下一组圆桌</button></nav>}
  </>
}
