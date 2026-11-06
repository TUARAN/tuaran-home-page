import Link from 'next/link'

import styles from './bookIdentity.module.css'

export default function BookIdentity({ kind = '书籍', compact = false }) {
  return (
    <div className={`${styles.identity} ${compact ? styles.compact : ''}`}>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 4.5h7.2c1.1 0 1.9.4 2.8 1.2.9-.8 1.7-1.2 2.8-1.2H20v14.3h-3.2c-1.1 0-2 .3-2.8 1.1-.8-.8-1.7-1.1-2.8-1.1H4V4.5Zm10 1.2v14.2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
      </span>
      <Link href="/resources/books" className={styles.link}>资源 <span aria-hidden="true">／</span> 书籍</Link>
      <span className={styles.kind}>{kind}</span>
    </div>
  )
}
