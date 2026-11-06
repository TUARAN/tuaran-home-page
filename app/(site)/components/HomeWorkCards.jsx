import Image from 'next/image'
import Link from 'next/link'
import LibraryMark from './LibraryMark'

import { getDownloadItemsByDate } from '../../../lib/site/downloadItems'
import { getOpenClawContributionLabel, OPENCLAW_ACHIEVEMENTS, OPENCLAW_ACHIEVEMENT_COUNT } from '../../../lib/site/openClawAchievements'
import { PUBLISHED_WORKS } from '../../../lib/site/publishedWorks'
import { T } from './LocaleProvider'

const DOWNLOAD_KIND = {
  extension: { zh: '浏览器扩展', en: 'Browser extension' },
  desktop: { zh: '桌面应用', en: 'Desktop app' },
}

function CardLink({ href, children, className }) {
  if (href.startsWith('http')) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} no-external-arrow`}>{children}</a>
  }
  return <Link href={href} className={className}>{children}</Link>
}

export function HomeBookCards() {
  return (
    <section className="home-work-stack home-book-stack" aria-labelledby="home-books-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker hidden md:block">Books · {PUBLISHED_WORKS.length}</p>
          <h2 id="home-books-title" className="home-section-title"><T zh="站长著作" en="Published books" /></h2>
        </div>
        <Link href="/resources/books" className="home-section-more inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] px-2.5 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" title="进入图书馆"><LibraryMark size={20} stroke={1.7} aria-hidden="true" /><span className="text-[11px] font-semibold"><T zh="图书馆" en="Library" /></span></Link>
      </div>
      <div className="home-work-card-list">
        {PUBLISHED_WORKS.map((book) => (
          <CardLink key={book.title} href={book.href} className="home-work-card home-book-card">
            <span className="home-book-cover">
              <Image src={book.image} alt={`${book.title}封面`} fill sizes="(max-width: 640px) 56px, 92px" className="object-contain" />
            </span>
            <span className="home-work-copy">
              <span className="home-work-meta">{book.year} · {book.type}{book.publisher ? ` · ${book.publisher}` : ''} · {book.status}</span>
              <strong>{book.title}</strong>
              <small>{book.description}</small>
            </span>
            <span className="home-work-arrow" aria-hidden="true">↗</span>
          </CardLink>
        ))}
      </div>
    </section>
  )
}

export function HomeOpenClawCards() {
  const featured = OPENCLAW_ACHIEVEMENTS.slice(0, 3)
  return (
    <section className="home-work-stack" aria-labelledby="home-openclaw-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker">OpenClaw · {OPENCLAW_ACHIEVEMENT_COUNT} merged</p>
          <h2 id="home-openclaw-title" className="home-section-title"><T zh="开源贡献" en="Open source" /></h2>
        </div>
        <Link href="/about#openclaw-contributions" className="home-section-more no-underline"><T zh="全部 PR" en="All PRs" /> →</Link>
      </div>
      <div className="home-work-card-list">
        {featured.map((pr, index) => (
          <CardLink key={pr.number} href={pr.url} className={`home-work-card home-pr-card ${index === 0 ? 'is-featured' : ''}`}>
            {index === 0 ? (
              <span className="home-pr-preview">
                <Image src={pr.image} alt={`OpenClaw PR #${pr.number} 合并记录`} fill sizes="(max-width: 1024px) 100vw, 36vw" className="object-cover object-top" />
              </span>
            ) : null}
            <span className="home-work-copy">
              <span className="home-work-meta">{getOpenClawContributionLabel(pr)} · MERGED · PR #{pr.number}</span>
              <strong>{pr.title.split(' · ')[1] || pr.title}</strong>
              <small>{pr.summary}</small>
            </span>
            <span className="home-work-arrow" aria-hidden="true">↗</span>
          </CardLink>
        ))}
      </div>
    </section>
  )
}

export function HomeDownloadCards() {
  const items = getDownloadItemsByDate()
  return (
    <section className="home-download-section" aria-labelledby="home-downloads-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker">Downloads · {items.length}</p>
          <h2 id="home-downloads-title" className="home-section-title"><T zh="客户端下载" en="Downloads" /></h2>
        </div>
        <Link href="/tools#downloads" className="home-section-more no-underline"><T zh="查看全部" en="View all" /> →</Link>
      </div>
      <div className="home-download-grid">
        {items.map((item) => {
          const kind = DOWNLOAD_KIND[item.downloadType] || DOWNLOAD_KIND.desktop
          const platforms = Array.isArray(item.platforms) ? item.platforms.slice(0, 3).join(' / ') : ''
          return (
            <CardLink key={item.id} href={item.href} className="home-download-card">
              <span className="home-work-meta">
                <T zh={kind.zh} en={kind.en} />
                {platforms ? ` · ${platforms}` : ''}
              </span>
              <strong>{item.title}</strong>
              <small>{item.summary}</small>
              <span className="home-download-action"><T zh={item.actionLabel || '查看下载'} en="Open" /> →</span>
            </CardLink>
          )
        })}
      </div>
    </section>
  )
}
