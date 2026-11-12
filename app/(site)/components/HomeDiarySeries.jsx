import Link from 'next/link'

import { T } from './LocaleProvider'

export default function HomeDiarySeries({ preview }) {
  if (!preview?.entries?.length) return null

  return (
    <section className="home-work-stack" aria-labelledby="home-diary-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker">
            <T zh={`从 ${preview.startedOn} 起`} en={`Since ${preview.startedOn}`} />
          </p>
          <h2 id="home-diary-title" className="home-section-title">{preview.title}</h2>
          <p className="home-section-description">{preview.couplet}</p>
        </div>
        <Link
          href="/diary"
          className="home-section-more no-underline"
          data-analytics-event="entry_click"
          data-analytics-surface="home_diary"
          data-analytics-destination-kind="page"
          data-analytics-destination-id="/diary"
        >
          <T zh="全部记录" en="Full series" /> →
        </Link>
      </div>
      <div className="home-work-card-list">
        {preview.entries.map((entry) => (
          <Link
            key={entry.id}
            href={entry.href}
            className="home-work-card"
            data-analytics-event="entry_click"
            data-analytics-surface="home_diary"
            data-analytics-destination-kind="page"
            data-analytics-destination-id={entry.href}
          >
            <span className="home-work-copy">
              <span className="home-work-meta">
                <time dateTime={entry.date}>{entry.span}</time>
                {entry.category ? <span> · {entry.category}</span> : null}
              </span>
              <strong>{entry.label}</strong>
              {entry.lead ? <small>{entry.lead}</small> : null}
              {entry.detail ? <small>{entry.detail}</small> : null}
              {entry.closing ? <small>{entry.closing}</small> : null}
              {entry.sourceNote ? <span className="home-entry-source-note">{entry.sourceNote}</span> : null}
            </span>
            <span className="home-work-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
