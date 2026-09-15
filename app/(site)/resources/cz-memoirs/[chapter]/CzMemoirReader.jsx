'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import styles from './cz-memoir-reader.module.css'

const CZ_MEMOIR_BASE_PATH = '/resources/cz-memoirs'
const FONT_MIN = 16
const FONT_MAX = 22
const FONT_DEFAULT = 18

function czMemoirChapterPath(slug) {
  return `${CZ_MEMOIR_BASE_PATH}/${slug}`
}

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
          <nav aria-label="移动端章节目录">
            {groups.map((group) => (
              <div key={group.id}>
                <strong>{group.period}</strong>
                {group.chapters.map(([title, slug]) => (
                  <Link key={slug} href={czMemoirChapterPath(slug)} aria-current={slug === chapter.slug ? 'page' : undefined}>
                    {title}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </details>
      </div>

      <div className={styles.layout}>
        <aside className={styles.chapterRail}>
          <Link href={CZ_MEMOIR_BASE_PATH} className={styles.bookHome}>
            <span>赵长鹏自传</span>
            <strong>币安人生</strong>
          </Link>
          <nav aria-label="全书章节">
            {groups.map((group) => (
              <section key={group.id}>
                <p>{group.period}</p>
                {group.chapters.map(([title, slug]) => (
                  <Link key={slug} href={czMemoirChapterPath(slug)} aria-current={slug === chapter.slug ? 'page' : undefined}>
                    {title}
                  </Link>
                ))}
              </section>
            ))}
          </nav>
        </aside>

        <main className={styles.mainColumn}>
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
                <strong>返回专题首页</strong>
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
