import styles from './manualPaper.module.css'

export default function ManualPaper({ tone = 'yellow', children }) {
  return (
    <div className={`${styles.desk} ${styles[tone]}`}>
      <div className={styles.sheet}>{children}</div>
    </div>
  )
}
