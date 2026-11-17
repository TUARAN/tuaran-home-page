import Link from 'next/link'

import {
  formatStarCount,
  GITHUB_TRENDING_PATH,
  homeGithubTrendingBlurb,
  loadGithubTrending,
  selectHomeGithubTrendingItems,
} from '../../../lib/page-data/githubTrending'
import HomeSectionCouplet from './HomeSectionCouplet'
import { T } from './LocaleProvider'

export default async function HomeGithubTrending() {
  let snapshot
  try {
    snapshot = await loadGithubTrending()
  } catch {
    return null
  }

  const items = selectHomeGithubTrendingItems(snapshot)
  if (!items.length) return null

  return (
    <div className="home-masonry-item">
      <section className="home-work-stack home-github-trending" aria-labelledby="home-github-trending-title">
        <div className="home-work-heading">
          <div>
            <p className="home-kicker">GitHub · {snapshot.selectedDate}</p>
            <h2 id="home-github-trending-title" className="home-section-title">
              <T zh="GitHub 每日热门" en="GitHub trending" />
            </h2>
            <HomeSectionCouplet section="githubTrending" />
          </div>
          <Link
            href={GITHUB_TRENDING_PATH}
            className="home-section-more no-underline"
            data-analytics-event="entry_click"
            data-analytics-surface="home_github_trending"
            data-analytics-destination-kind="page"
            data-analytics-destination-id={GITHUB_TRENDING_PATH}
          >
            <T zh="查看全部" en="View all" /> →
          </Link>
        </div>
        <ol className="home-github-trending-list">
          {items.map((item) => {
            const blurb = homeGithubTrendingBlurb(item)
            return (
              <li key={item.url}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="home-github-trending-item"
                  data-analytics-event="entry_click"
                  data-analytics-surface="home_github_trending"
                  data-analytics-destination-kind="external"
                  data-analytics-destination-id={item.fullName}
                >
                  <span className="home-github-trending-name">{item.fullName}</span>
                  {item.stars != null ? (
                    <span className="home-github-trending-stars">{formatStarCount(item.stars)}</span>
                  ) : null}
                  {blurb ? <span className="home-github-trending-blurb">{blurb}</span> : null}
                </a>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
