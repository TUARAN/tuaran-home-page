import Link from 'next/link'

import { T } from './LocaleProvider'
import {
  YEAR_SUMMARY_ARTICLES,
  YEAR_SUMMARY_COLUMN,
  getYearSummaryStats,
} from '../articles/year-summary/yearSummaryData'

export default function HomeYearSummaryCard() {
  const stats = getYearSummaryStats()
  const preview = YEAR_SUMMARY_ARTICLES.slice(0, 4)

  return (
    <section className="home-work-stack" aria-labelledby="home-year-summary-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker">2020–2025 · {stats.articles}</p>
          <h2 id="home-year-summary-title" className="home-section-title">
            <T zh={YEAR_SUMMARY_COLUMN.title} en="Year notes" />
          </h2>
          <p className="home-section-description">
            <T zh={YEAR_SUMMARY_COLUMN.subtitle} en="Mid-2020 through year-end 2025." />
          </p>
        </div>
        <Link href="/articles/year-summary" className="home-section-more no-underline">
          <T zh="时间线" en="Timeline" /> →
        </Link>
      </div>
      <div className="home-work-card-list">
        {preview.map((article) => (
          <Link
            key={article.id}
            href={`/articles/year-summary#summary-${article.id}`}
            className="home-work-card"
            data-analytics-event="entry_click"
            data-analytics-surface="home_year_summary"
            data-analytics-destination-kind="page"
            data-analytics-destination-id="/articles/year-summary"
          >
            <span className="home-work-copy">
              <span className="home-work-meta">{article.date} · {article.phase}</span>
              <strong>{article.title}</strong>
            </span>
            <span className="home-work-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
