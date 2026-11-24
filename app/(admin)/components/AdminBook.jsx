import { BookShell, BookCover, BookSpread, PaperPage } from './ResearchBook'
import BookNavigation from './BookNavigation'
import styles from './ResearchBook.module.css'

/** 后台展示页统一阅读外壳；章节内容可由服务端渲染。 */
export default function AdminBook({ title, description, groups, children }) {
  return <BookShell>
    <BookCover title={title} subtitle={description} edition="站长手册" spine={title} line="" />
    <BookSpread>
      <BookNavigation title={title} groups={groups} />
      <div className={styles.chapters}>{children}</div>
    </BookSpread>
  </BookShell>
}

export function AdminBookChapter({ id, title, description, children, actions }) {
  return <section id={id} className={styles.bookChapter}>
    <PaperPage title={title} summary={description} running="站长手册" folio={false}>
      {actions ? <div className="mb-4">{actions}</div> : null}
      {children}
    </PaperPage>
  </section>
}
