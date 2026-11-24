"use client"

import { useEffect, useState } from 'react'
import styles from './ResearchBook.module.css'

export default function BookNavigation({ title, groups, activeId, onSelect }) {
  const [hash, setHash] = useState('')
  useEffect(() => {
    const update = () => {
      try { setHash(decodeURIComponent(window.location.hash.slice(1))) }
      catch { setHash('') }
    }
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  useEffect(() => {
    if (onSelect) return
    const entries = groups.flatMap(group => group.items)
    const observer = new IntersectionObserver(records => {
      const visible = records.filter(record => record.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setHash(visible[0].target.id)
    }, { rootMargin: '-110px 0px -55% 0px', threshold: 0 })
    entries.forEach(item => {
      const target = document.getElementById(item.id)
      if (target) observer.observe(target)
    })
    return () => observer.disconnect()
  }, [groups, onSelect])
  const current = activeId ?? (hash || groups[0]?.items[0]?.id)
  return <details className={styles.toc} open>
    <summary className={styles.tocHead}><span className={styles.tocHeadZh}>目录</span><span className={styles.tocHeadEn}>{title}</span></summary>
    <nav aria-label={`${title}目录`}>
      {groups.map(group => <div key={group.id} className={styles.tocPart}>
        {group.label ? <p className={styles.tocPartLabel}>{group.label}</p> : null}
        <ul className={styles.tocList}>{group.items.map(item => <li key={item.id}>
          {onSelect ? <button type="button" className={styles.tocButton} aria-current={current === item.id ? 'page' : undefined} onClick={() => onSelect(item.id)}>{item.title}</button>
            : <a className={styles.tocButton} href={`#${item.id}`} aria-current={current === item.id ? 'location' : undefined}>{item.title}</a>}
        </li>)}</ul>
      </div>)}
    </nav>
  </details>
}
