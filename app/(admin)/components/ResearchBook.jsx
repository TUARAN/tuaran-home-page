'use client'

import styles from './ResearchBook.module.css'

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

export function BookSpread({ children }) {
  return <div className={styles.spread}>{children}</div>
}

export function BookCover() {
  return (
    <header className={styles.cover}>
      <div className={styles.spine} aria-hidden="true">
        <span className={styles.spineText}>调研方法</span>
      </div>
      <div className={styles.coverBody}>
        <p className={styles.coverEyebrow}>TUARAN · {BOOK.edition}</p>
        <h2 className={styles.coverTitle}>{BOOK.title}</h2>
        <p className={styles.coverSubtitle}>{BOOK.subtitle}</p>
        <p className={styles.coverLine}>{BOOK.line}</p>
      </div>
      <div className={styles.coverStamp} aria-hidden="true">
        调研<br />手册
      </div>
    </header>
  )
}

export function BookToc({ groups, method, onSelect, onOverview }) {
  let cursor = 0
  return (
    <nav className={styles.toc} aria-label="调研方法目录">
      <div className={styles.tocHead}>
        <p className={styles.tocHeadEn}>CONTENTS</p>
        <p className={styles.tocHeadZh}>目录</p>
      </div>

      <div className={styles.tocPart}>
        <p className={styles.tocPartLabel}>序 · 全书概览</p>
        <ul className={styles.tocList}>
          <li>
            <button
              type="button"
              className={styles.tocButton}
              aria-current={method ? undefined : 'page'}
              onClick={onOverview}
            >
              <span className={styles.tocNum}>序</span>
              <span className={styles.tocLabel}>翻开这本书</span>
              <span className={styles.tocDots} aria-hidden="true" />
              <span className={styles.tocFolio}>00</span>
            </button>
          </li>
        </ul>
      </div>

      {groups.map((group, groupIndex) => (
        <div key={group.id} className={styles.tocPart}>
          <p className={styles.tocPartLabel}>卷{'一二'[groupIndex] || groupIndex + 1} · {group.label}</p>
          <ul className={styles.tocList}>
            {group.items.map((item) => {
              const index = cursor++
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={styles.tocButton}
                    aria-current={item.id === method ? 'page' : undefined}
                    onClick={() => onSelect(item.id)}
                  >
                    <span className={styles.tocNum}>{chapterNumber(index)}</span>
                    <span className={styles.tocLabel}>{item.title}</span>
                    <span className={styles.tocDots} aria-hidden="true" />
                    <span className={styles.tocFolio}>{folioFor(index)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <p className={styles.tocFoot}>材料由 AI 摊开，判断由人写下。本册只对站长可见。</p>
    </nav>
  )
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
      <div className={styles.folio}>− {folio || '00'} −</div>
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

export function ChapterCards({ items, onSelect }) {
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
            <span className={styles.chapterCardNum}>{chapterNumber(index)}</span>
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
