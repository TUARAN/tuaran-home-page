'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import LibraryMark from '../../components/LibraryMark'
import { LIBRARY_BOOKS, LIBRARY_COUNTS, LIBRARY_COLLECTION_COVER, LIBRARY_GREEN_COVER, LIBRARY_YELLOW_COVER } from '../../../../lib/content/libraryCatalog.mjs'
import styles from './bookShelf.module.css'

const FILTERS = [
  { id: 'all', label: '全部馆藏' },
  { id: 'self', label: '我的作品' },
  { id: 'external', label: '外部资源书' },
]

const TONE_COVER = { yellow: LIBRARY_YELLOW_COVER, green: LIBRARY_GREEN_COVER }
const TONE_CLASS = { yellow: 'coverYellow', green: 'coverGreen' }

function BookCover({ book, index }) {
  const tone = TONE_COVER[book.coverTone] ? book.coverTone : ''
  return (
    <span className={`${styles.cover} ${tone ? styles[TONE_CLASS[tone]] : styles[`cover${index % 6}`]}`}>
      {book.cover ? (
        <Image src={book.cover} alt={`${book.title}封面`} fill sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 190px" className={`${styles.coverImage} ${book.coverCrop ? styles.coverImageCrop : ''}`} />
      ) : (
        <span className={styles.fallbackCover} aria-hidden="true">
          <Image src={TONE_COVER[tone] || LIBRARY_COLLECTION_COVER} alt="" fill sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 190px" className={styles.collectionCoverImage} />
          <span className={styles.collectionBadge}>阿燃典藏</span>
          <span className={styles.coverType}>{book.ownership === 'self' ? '原创作品' : '外部资源书'}</span>
          <span className={styles.coverTitle}>{book.title}</span>
          <span className={styles.coverRule} />
          <span className={styles.coverSource}>{book.creditLabel} · {book.credit}</span>
        </span>
      )}
    </span>
  )
}

function BookSection({ title, description, books, id, number }) {
  if (!books.length) return null
  return (
    <section className={styles.collection} aria-labelledby={id}>
      <div className={styles.collectionHeading}>
        <div className={styles.collectionTitle}><span className={styles.sectionNumber}>{number}</span><div><h2 id={id}>{title}</h2><p>{description}</p></div></div>
        <span className={styles.sectionCount}>{books.length} 本</span>
      </div>
      <div className={styles.grid}>
        {books.map((book, index) => (
          <article key={book.href} className={styles.book}>
            <Link href={book.href} className={styles.coverLink} aria-label={`${book.action}：${book.title}`}><BookCover book={book} index={index} /></Link>
            <div className={styles.bookInfo}>
              <span className={`${styles.bookKind} ${book.ownership === 'self' ? styles.mineKind : styles.externalKind}`}>{book.ownership === 'self' ? `我的作品 · ${book.category}` : `外部资源书 · ${book.kind}`}</span>
              <h3><Link href={book.href}>{book.title}</Link></h3>
              <p className={styles.source}>{book.creditLabel}：{book.credit}</p>
              {book.publisher ? <p className={styles.source}>{book.publisherLabel}：{book.publisher}</p> : null}
              <p className={styles.blurb}>{book.description}</p>
              <Link href={book.href} className={styles.action}>{book.action} <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function BookShelf() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const visibleBooks = useMemo(() => LIBRARY_BOOKS.filter((book) => {
    const matchesFilter = filter === 'all' || book.ownership === filter
    const search = query.trim().toLocaleLowerCase()
    return matchesFilter && (!search || `${book.title} ${book.category} ${book.kind} ${book.credit} ${book.publisher || ''} ${book.description}`.toLocaleLowerCase().includes(search))
  }), [filter, query])
  const myBooks = visibleBooks.filter((book) => book.ownership === 'self')
  const externalBooks = visibleBooks.filter((book) => book.ownership === 'external')

  return (
    <main className={styles.library}>
      <header className={styles.intro}>
        <div className={styles.introCopy}>
          <div className={styles.masthead}>
            <span className={styles.librarySeal}><LibraryMark size={25} stroke={1.5} aria-hidden="true" /></span>
            <div><p className={styles.eyebrow}>阿燃典藏 <span aria-hidden="true">/</span> LIBRARY</p><h1>图书馆</h1></div>
          </div>
          <p className={styles.description}>出版图书、电子小册与在线读本。按创作归属陈列，每本书都标明作者或来源。</p>
        </div>
        <div className={styles.stats} aria-label="馆藏归属">
          <span><strong>{LIBRARY_COUNTS.self}</strong> 我的作品</span>
          <span><strong>{LIBRARY_COUNTS.external}</strong> 外部资源书</span>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.filters} role="group" aria-label="按作品归属筛选">
          {FILTERS.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <label className={styles.search}>
          <span className="sr-only">搜索书名、作者或来源</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4.3 4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书名、作者或来源" />
        </label>
      </div>

      <p className={styles.resultCount} role="status">当前显示 {visibleBooks.length} 本</p>
      {visibleBooks.length ? (
        <>
          <BookSection id="my-books" number="01" title="我的作品" description="出版社图书 · 电子小册 · 指南手册 · 其他原创资源" books={myBooks} />
          <BookSection id="external-books" number="02" title="外部资源书" description="原作者或来源机构标在每本书下；本站提供阅读或资料入口。" books={externalBooks} />
        </>
      ) : <p className={styles.empty}>没有找到匹配的书。试试别的书名或分类。</p>}
    </main>
  )
}
