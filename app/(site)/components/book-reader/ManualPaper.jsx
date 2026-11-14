import styles from './manualPaper.module.css'

export default function ManualPaper({ tone = 'yellow', children }) {
  return <div className={`${styles.paper} ${styles[tone]}`}>{children}</div>
}
