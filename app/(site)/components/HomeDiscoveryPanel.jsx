import Link from 'next/link'
import { T } from './LocaleProvider'

function DiscoveryLink({ item, tone }) {
  const Icon = item.icon
  const className = 'home-entry-link group no-external-arrow'
  const content = (
    <>
      <span className={`home-entry-icon home-entry-icon-${tone}`} aria-hidden="true">
        <Icon size={18} stroke={1.8} />
      </span>
      <span className="home-entry-copy">
        <strong><T zh={item.title} en={item.titleEn} /></strong>
        <small><T zh={item.desc} en={item.descEn} /></small>
      </span>
      <span className="home-explore-arrow" aria-hidden="true">{item.external ? '↗' : '→'}</span>
    </>
  )

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-analytics-event={item.analyticsId ? 'entry_click' : undefined}
        data-analytics-surface={item.analyticsId ? `home_${item.analyticsId}` : 'explore'}
        data-analytics-destination-kind="external"
        data-analytics-destination-id={item.analyticsId || item.id}
      >
        {content}
      </a>
    )
  }

  return (
    <Link
      href={item.href}
      className={className}
      data-analytics-event="entry_click"
      data-analytics-surface="start_path"
      data-analytics-destination-kind="content"
      data-analytics-destination-id={item.id}
    >
      {content}
    </Link>
  )
}

export default function HomeDiscoveryPanel({ groups }) {
  return (
    <section id="start-here" className="home-section home-discovery-panel scroll-mt-24" aria-labelledby="home-discovery-title">
      <div className="home-section-heading compact">
        <div>
          <p className="home-kicker">Explore</p>
          <h2 id="home-discovery-title" className="home-section-title"><T zh="探索" en="Explore" /></h2>
        </div>
      </div>
      <nav className="home-explore-groups" aria-label="站点内容与服务入口">
        {groups.map((group) => group.collapsed ? (
          <details className="home-explore-more" key={group.id}>
            <summary>
              <T zh={`${group.label} · ${group.items.length}`} en={`${group.labelEn} · ${group.items.length}`} />
            </summary>
            <div className="home-entry-list">
              {group.items.map((item) => <DiscoveryLink key={item.href} item={item} tone={group.tone} />)}
            </div>
          </details>
        ) : (
          <section className="home-explore-group" aria-labelledby={`home-explore-${group.id}`} key={group.id}>
            <h3 id={`home-explore-${group.id}`}><T zh={group.label} en={group.labelEn} /></h3>
            <div className="home-entry-list">
              {group.items.map((item) => <DiscoveryLink key={item.href} item={item} tone={group.tone} />)}
            </div>
          </section>
        ))}
      </nav>
    </section>
  )
}
