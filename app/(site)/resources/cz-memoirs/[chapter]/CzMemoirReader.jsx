'use client'

import Link from 'next/link'
import BookIdentity from '../../../components/book-reader/BookIdentity'
import BookToc from '../../../components/book-reader/BookToc'
import { useEffect, useRef, useState } from 'react'

import { CZ_MEMOIR_BASE_PATH, czMemoirChapterPath } from '../../../../../lib/page-data/czMemoirs'
import styles from './cz-memoir-reader.module.css'

const FONT_MIN = 16
const FONT_MAX = 22
const FONT_DEFAULT = 18

export default function CzMemoirReader({ chapter, groups, outline, previous, next, children }) {
  const articleRef = useRef(null)
  const [fontSize, setFontSize] = useState(FONT_DEFAULT)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('cz-memoir-font-size'))
    if (saved >= FONT_MIN && saved <= FONT_MAX) setFontSize(saved)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('cz-memoir-font-size', String(fontSize))
  }, [fontSize])

  useEffect(() => {
    function updateProgress() {
      const article = articleRef.current
      if (!article) return
      const start = article.getBoundingClientRect().top + window.scrollY
      const distance = Math.max(1, article.offsetHeight - window.innerHeight)
      setProgress(Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100)))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [chapter.slug])

  const tocGroups = groups.map((group) => ({
    heading: group.period,
    items: group.chapters.map(([title, slug]) => ({ href: czMemoirChapterPath(slug), label: title })),
  }))

  const chapterPosition = groups
    .flatMap((group) => group.chapters)
    .findIndex(([, slug]) => slug === chapter.slug) + 1

  return (
    <div className={styles.reader} style={{ '--memoir-font-size': `${fontSize}px` }}>
      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.mobileBar}>
        <details>
          <summary>第 {chapterPosition} / 28 篇 · {chapter.title}</summary>
          <BookToc groups={tocGroups} title="全书目录" caption="资源 · 书籍" />
        </details>
      </div>

      <div className={styles.layout}>
        <aside className={styles.chapterRail}>
          <Link href={CZ_MEMOIR_BASE_PATH} className={styles.bookHome}>
            <span>赵长鹏自传</span>
            <strong>币安人生</strong>
          </Link>
          <BookToc groups={tocGroups} title="全书目录" caption="资源 · 书籍" />
        </aside>

        <main className={styles.mainColumn}>
          <BookIdentity kind="逐章阅读" compact />
          <header className={styles.readerHeader}>
            <div>
              <Link href={CZ_MEMOIR_BASE_PATH}>《币安人生》</Link>
              <span aria-hidden="true"> / </span>
              <span>第 {chapterPosition} 篇</span>
            </div>
            <div className={styles.fontControls} aria-label="正文字号">
              <button type="button" onClick={() => setFontSize((size) => Math.max(FONT_MIN, size - 1))} disabled={fontSize === FONT_MIN} aria-label="减小字号">
                A−
              </button>
              <span>{fontSize}</span>
              <button type="button" onClick={() => setFontSize((size) => Math.min(FONT_MAX, size + 1))} disabled={fontSize === FONT_MAX} aria-label="增大字号">
                A＋
              </button>
            </div>
          </header>

          <article ref={articleRef} id="cz-memoir-article" className={styles.article}>
            {children}
          </article>

          <nav className={styles.pager} aria-label="章节翻页">
            {previous ? (
              <Link href={czMemoirChapterPath(previous.slug)}>
                <span>上一篇</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={czMemoirChapterPath(next.slug)}>
                <span>下一篇</span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <Link href={CZ_MEMOIR_BASE_PATH}>
                <span>阅读完成</span>
                <strong>回到开头</strong>
              </Link>
            )}
          </nav>

          <p className={styles.sourceNote}>
            原著作者：赵长鹏（CZ） · 简体中文 Web 项目内容已完整归档于本站
          </p>
        </main>

        <aside className={styles.outlineRail}>
          {outline.length ? (
            <nav aria-label="本篇目录">
              <p>本篇目录</p>
              {outline.map((item) => <a key={item.id} href={`#${item.id}`}>{item.title}</a>)}
            </nav>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
