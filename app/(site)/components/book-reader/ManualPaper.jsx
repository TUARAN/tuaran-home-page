import styles from './manualPaper.module.css'

export default function ManualPaper({ tone = 'yellow', children }) {
  return (
    <div className={`${styles.desk} ${styles[tone]}`} data-x-desk="">
      <div className={styles.sheet} data-x-sheet="">{children}</div>
    </div>
  )
}
