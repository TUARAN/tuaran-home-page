import Link from 'next/link'

import { T } from './LocaleProvider'

export default function HomeDiarySeries({ preview }) {
  if (!preview?.entries?.length) return null

  return (
    <section className="diary-sheet home-diary" aria-labelledby="home-diary-title">
      <header className="diary-sheet-header">
        <p className="diary-sheet-kicker">
          <T zh={`从 ${preview.startedOn} 起`} en={`Since ${preview.startedOn}`} />
        </p>
        <div className="diary-sheet-heading">
          <h2 id="home-diary-title" className="diary-sheet-title">{preview.title}</h2>
          <Link
            href="/diary"
            className="diary-sheet-more"
            data-analytics-event="entry_click"
            data-analytics-surface="home_diary"
            data-analytics-destination-kind="page"
            data-analytics-destination-id="/diary"
          >
            <T zh="全部记录" en="Full series" />
          </Link>
        </div>
        <p className="diary-sheet-note">
          <T
            zh={preview.note}
            en="These entries are mostly the site owner's spoken accounts, arranged by bots, then published."
          />
        </p>
        <p className="diary-sheet-couplet">{preview.couplet}</p>
      </header>
      <ol className="home-diary-list">
        {preview.entries.map((entry, index) => (
          <li key={entry.id} className={index === 0 ? 'home-diary-entry is-latest' : 'home-diary-entry'}>
            <Link
              href={entry.href}
              data-analytics-event="entry_click"
              data-analytics-surface="home_diary"
              data-analytics-destination-kind="page"
              data-analytics-destination-id={entry.href}
            >
              <span className="home-diary-meta">
                <time dateTime={entry.date}>{entry.span}</time>
                {entry.category ? <span>{entry.category}</span> : null}
              </span>
              <strong>{entry.label}</strong>
              {entry.lead ? <p>{entry.lead}</p> : null}
              {entry.closing ? <p className="home-diary-closing">{entry.closing}</p> : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
