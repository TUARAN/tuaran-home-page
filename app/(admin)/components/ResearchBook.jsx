'use client'

import styles from './ResearchBook.module.css'
import BookNavigation from './BookNavigation'

export const BOOK = {
  title: '人的判断永远珍贵',
  subtitle: '如何更好地运用 AI 调研',
  edition: '站长手册 · 第一版',
  line: 'AI 把材料摊得更开、排得更快；哪些事实重要、哪些缺口值得追、结论能走多远，由人决定。',
}

const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

export function chapterNumber(index) {
  return NUMERALS[index] || String(index + 1).padStart(2, '0')
}

export function folioFor(index) {
  return String(6 + index * 8).padStart(2, '0')
}

export function chapterLabel(index, title) {
  return `第${chapterNumber(index)}章 · ${title}`
}

/** 书籍根容器：CSS 变量（纸色、墨色、金线）都挂在这个类上，必须包住封面与内页。 */
export function BookShell({ children }) {
  return <div className={styles.book}>{children}</div>
}

export function BookSpread({ children }) {
  return <div className={styles.spread}>{children}</div>
}

export function BookCover({ title = BOOK.title, subtitle = BOOK.subtitle, edition = BOOK.edition, spine = '调研方法', line = BOOK.line }) {
  return (
    <header className={styles.cover}>
      <div className={styles.spine} aria-hidden="true">
        <span className={styles.spineText}>{spine}</span>
      </div>
      <div className={styles.coverBody}>
        <p className={styles.coverEyebrow}>TUARAN · {edition}</p>
        <h2 className={styles.coverTitle}>{title}</h2>
        <p className={styles.coverSubtitle}>{subtitle}</p>
        {line ? <p className={styles.coverLine}>{line}</p> : null}
      </div>
      <div className={styles.coverStamp} aria-hidden="true">
        {spine}
      </div>
    </header>
  )
}

export function BookToc({ groups, method, onSelect, onOverview }) {
  return <BookNavigation title="调研方法" activeId={method || 'overview'} onSelect={id => id === 'overview' ? onOverview() : onSelect(id)} groups={[
    { id: 'preface', label: '序 · 全书概览', items: [{ id: 'overview', title: '翻开这本书' }] },
    ...groups,
  ]} />
}

export function PaperPage({ chapter, title, summary, folio, running = BOOK.title, children }) {
  return (
    <article className={styles.paper}>
      <div className={styles.runningHead}>
        <span>{running}</span>
        <span>{chapter || '序'}</span>
      </div>
      {title ? (
        <header className={styles.chapterHead}>
          <p className={styles.chapterKicker}>{chapter}</p>
          <h2 className={styles.chapterTitle}>{title}</h2>
          {summary ? <p className={styles.chapterSummary}>{summary}</p> : null}
        </header>
      ) : null}
      <div className={styles.paperBody}>{children}</div>
      {folio !== false ? <div className={styles.folio}>− {folio || '00'} −</div> : null}
    </article>
  )
}

export function LeafGrid({ left, right }) {
  return (
    <div className={styles.leafGrid}>
      <div className={styles.leafLeft}>{left}</div>
      <div className={styles.leafRight}>{right}</div>
    </div>
  )
}

export function LeafTitle({ children }) {
  return <p className={styles.leafTitle}>{children}</p>
}

export function PullQuote({ children, cite }) {
  return (
    <blockquote className={styles.quote}>
      <p>{children}</p>
      {cite ? <cite>{cite}</cite> : null}
    </blockquote>
  )
}

export function PrefaceLead({ children }) {
  return <p className={styles.prefaceLead}>{children}</p>
}

export function ChapterCards({ items, onSelect, startIndex = 0 }) {
  return (
    <div className={styles.chapterCards}>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={styles.chapterCard}
          onClick={() => onSelect(item.id)}
        >
          <span className={styles.chapterCardHead}>
            <span className={styles.chapterCardNum}>{chapterNumber(startIndex + index)}</span>
            <span className={styles.chapterCardTitle}>{item.title}</span>
          </span>
          <span className={styles.chapterCardSummary}>{item.summary}</span>
        </button>
      ))}
    </div>
  )
}

/** 给嵌入的旧组件包一层，把它的 app 风格小节标题收敛成书页语言。 */
export function BookProse({ children }) {
  return <div className={styles.bookProse}>{children}</div>
}

/* 章内体例：节 / 段 / 点 / 表 / 图 -------------------------------------- */

/** 节：章下面的分节，用中文数字编号。 */
export function BookSection({ num, title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionHead}>
        <span className={styles.sectionNum}>{num}</span>
        <span className={styles.sectionTitle}>{title}</span>
      </h3>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  )
}

/** 段：书页正文段落，首行缩进。 */
export function BookPara({ children }) {
  return <p className={styles.para}>{children}</p>
}

/** 点：分条列举，ordered 用汉字序号，否则用圆点。 */
export function BookPoints({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={`${styles.points} ${ordered ? styles.pointsOrdered : styles.pointsPlain}`}>
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </Tag>
  )
}

/**
 * 表：书页表格，带「表一 · 标题」题注。rows 为二维数组；
 * 传 onSelect 时整行可点（用于切换写法），activeRow 高亮当前行。
 */
export function BookTable({ label, title, head, rows, onSelect, activeRow, note }) {
  const interactive = typeof onSelect === 'function'
  return (
    <figure className={styles.tableFigure}>
      <figcaption className={styles.figureCaption}>
        {label ? <span className={styles.figureLabel}>{label}</span> : null}
        <span>{title}</span>
      </figcaption>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>{head.map((cell, i) => <th key={i} scope="col">{cell}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={r}
                className={`${interactive ? styles.tableRowButton : ''} ${activeRow === r ? styles.tableRowActive : ''}`}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-pressed={interactive ? activeRow === r : undefined}
                onClick={interactive ? () => onSelect(r) : undefined}
                onKeyDown={interactive ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(r)
                  }
                } : undefined}
              >
                {row.map((cell, c) => <td key={c}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? <p className={styles.figureNote}>{note}</p> : null}
    </figure>
  )
}

/** 图：书页插图，带「图一 · 标题」题注。 */
export function BookFigure({ label, title, children, note }) {
  return (
    <figure className={styles.figure}>
      <div className={styles.figureArt}>{children}</div>
      <figcaption className={styles.figureCaption}>
        {label ? <span className={styles.figureLabel}>{label}</span> : null}
        <span>{title}</span>
      </figcaption>
      {note ? <p className={styles.figureNote}>{note}</p> : null}
    </figure>
  )
}
