'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import BookIdentity from '../../components/book-reader/BookIdentity'
import { RESOURCE_BOOKS } from '../../../../lib/content/resourceBooks.mjs'
import { PUBLISHED_WORKS } from '../../../../lib/site/publishedWorks'
import styles from './bookShelf.module.css'

const FILTERS = [
  { id: 'all', label: '全部馆藏' },
  { id: 'published', label: '出版图书' },
  { id: 'online', label: '在线阅读' },
  { id: 'manual', label: '使用手册' },
]

const published = PUBLISHED_WORKS.map((work) => ({
  href: work.href,
  title: work.title.replace(/[《》]/g, ''),
  kind: work.type,
  source: work.publisher,
  description: work.description,
  cover: work.image,
  group: 'published',
  action: '查看出版信息',
}))

const online = RESOURCE_BOOKS.map((book) => ({
  ...book,
  group: book.kind === '使用手册' ? 'manual' : 'online',
  action: '在线阅读',
}))

const BOOKS = [...published, ...online]

function BookCover({ book, index }) {
  return (
    <span className={`${styles.cover} ${styles[`cover${index % 6}`]}`}>
      {book.cover ? (
        <Image src={book.cover} alt={`${book.title}封面`} fill sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 190px" className={styles.coverImage} />
      ) : (
        <span className={styles.fallbackCover} aria-hidden="true">
          <span className={styles.coverType}>TUARAN · 资源书籍</span>
          <span className={styles.coverTitle}>{book.title}</span>
          <span className={styles.coverRule} />
          <span className={styles.coverSource}>{book.source}</span>
        </span>
      )}
    </span>
  )
}

export default function BookShelf() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const visibleBooks = useMemo(() => BOOKS.filter((book) => {
    const matchesFilter = filter === 'all' || book.group === filter
    const search = query.trim().toLocaleLowerCase()
    return matchesFilter && (!search || `${book.title} ${book.kind} ${book.source} ${book.description}`.toLocaleLowerCase().includes(search))
  }), [filter, query])

  return (
    <main className={styles.library}>
      <div className={styles.intro}>
        <BookIdentity kind="馆藏目录" />
        <p className={styles.eyebrow}>THE READING ROOM · 2ARAN</p>
        <h1>书籍馆藏</h1>
        <p className={styles.description}>已出版的图书、电子小册与站内可读的原著、白皮书、使用手册，按书陈列。选择封面进入作品详情或正文。</p>
        <div className={styles.stats} aria-label="馆藏数量">
          <span><strong>{PUBLISHED_WORKS.length}</strong> 本出版与发布作品</span>
          <span><strong>{RESOURCE_BOOKS.length}</strong> 本站内可读资源</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters} role="group" aria-label="筛选馆藏">
          {FILTERS.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <label className={styles.search}>
          <span className="sr-only">搜索书名、类型或来源</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索馆藏" />
        </label>
      </div>

      <section className={styles.collection}>
        <div className={styles.collectionHeading}><h2>{FILTERS.find((item) => item.id === filter)?.label}</h2><span role="status">{visibleBooks.length} 本</span></div>
        {visibleBooks.length ? (
          <div className={styles.grid}>
            {visibleBooks.map((book, index) => (
              <article key={book.href} className={styles.book}>
                <Link href={book.href} className={styles.coverLink} aria-label={`${book.action}：${book.title}`}><BookCover book={book} index={index} /></Link>
                <div className={styles.bookInfo}>
                  <span className={styles.bookKind}>{book.group === 'published' ? '已出版 / 已发布' : '资源 · 书籍'} · {book.kind}</span>
                  <h3><Link href={book.href}>{book.title}</Link></h3>
                  <p className={styles.source}>{book.source}</p>
                  <p className={styles.blurb}>{book.description}</p>
                  <Link href={book.href} className={styles.action}>{book.action} <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        ) : <p className={styles.empty}>没有找到匹配的书。试试别的书名或分类。</p>}
      </section>
    </main>
  )
}
