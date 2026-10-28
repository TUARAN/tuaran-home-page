'use client'

import { useEffect, useState } from 'react'

import styles from './whitepaper.module.css'

export default function ChapterNav({ chapters }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id || '')
  const [progress, setProgress] = useState(0)
  const chapterKey = chapters.map((chapter) => chapter.id).join('|')

  useEffect(() => {
    const ids = chapterKey ? chapterKey.split('|') : []
    let frame = 0

    const update = () => {
      frame = 0
      const line = window.scrollY + Math.min(168, window.innerHeight * 0.3)
      let current = ids[0] || ''
      for (const id of ids) {
        const node = document.getElementById(id)
        if (node && node.offsetTop <= line) current = id
      }
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? window.scrollY / max : 0
      setActiveId(current)
      setProgress(Math.max(0, Math.min(100, Math.round(ratio * 100))))
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [chapterKey])

  const active = chapters.find((chapter) => chapter.id === activeId) || chapters[0]

  return (
    <nav className={styles.chapterNav} aria-label="章节目录">
      <p className={styles.chapterNavTitle}>目录</p>
      <p className={styles.readingStat}>{active ? `${active.number} · ${active.title}` : '目录'}</p>
      <div
        className={styles.navProgress}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`阅读进度 ${progress}%`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <ol>
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              aria-current={chapter.id === activeId ? 'true' : undefined}
              className={chapter.id === activeId ? styles.chapterActive : undefined}
            >
              <span>{chapter.number}</span>
              {chapter.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
