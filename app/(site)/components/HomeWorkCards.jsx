import Image from 'next/image'
import Link from 'next/link'

import { OPENCLAW_ACHIEVEMENTS, OPENCLAW_ACHIEVEMENT_COUNT } from '../../../lib/site/openClawAchievements'
import { PUBLISHED_WORKS } from '../../../lib/site/publishedWorks'
import { T } from './LocaleProvider'

function CardLink({ href, children, className }) {
  if (href.startsWith('http')) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} no-external-arrow`}>{children}</a>
  }
  return <Link href={href} className={className}>{children}</Link>
}

export function HomeBookCards() {
  return (
    <section className="home-work-stack" aria-labelledby="home-books-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker">Books · {PUBLISHED_WORKS.length}</p>
          <h2 id="home-books-title" className="home-section-title"><T zh="站长著作" en="Published books" /></h2>
        </div>
        <Link href="/publications" className="home-section-more no-underline"><T zh="查看全部" en="View all" /> →</Link>
      </div>
      <div className="home-work-card-list">
        {PUBLISHED_WORKS.map((book) => (
          <CardLink key={book.title} href={book.href} className="home-work-card home-book-card">
            <span className="home-book-cover">
              <Image src={book.image} alt={`${book.title}封面`} fill sizes="(max-width: 640px) 78px, 92px" className="object-cover" />
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
              <span className="home-work-meta">MERGED · PR #{pr.number}</span>
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
