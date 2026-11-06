import Link from 'next/link'

import styles from './bookIdentity.module.css'

export default function BookIdentity({ kind = '书籍', compact = false }) {
  return (
    <nav aria-label="书籍路径" className={`${styles.identity} ${compact ? styles.compact : ''}`}>
      <Link href="/resources" className={styles.link}>资源</Link>
      <span className={styles.separator} aria-hidden="true">/</span>
      <Link href="/resources/books" className={styles.link}>图书馆</Link>
      <span className={styles.separator} aria-hidden="true">/</span>
      <span className={styles.kind}>{kind}</span>
    </nav>
  )
}
