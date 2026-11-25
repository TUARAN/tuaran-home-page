import Link from 'next/link'

import { TOPIC_HUB_GROUPS } from '../../../lib/content/topicHubs'
import { latestHubDate, listHubRecent } from '../../../lib/content/topicHubRecent'
import { SITE_AUTHORITY_LINKS } from '../../../lib/site/siteNav'
import PageContainer from '../components/PageContainer'

export function topicHubJsonLd(hub) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.title,
    description: hub.description,
    url: `https://2aran.com${hub.path}`,
    author: {
      '@type': 'Person',
      name: '涂阿燃',
      alternateName: 'TUARAN',
      url: 'https://2aran.com/about',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: hub.leads.map((lead, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: lead.label,
        url: lead.href.startsWith('http') ? lead.href : `https://2aran.com${lead.href.split('#')[0]}`,
      })),
    },
  }
}

function hubSections(hub) {
  return TOPIC_HUB_GROUPS.map((group) => ({
    ...group,
    items: hub.leads
      .filter((lead) => lead.group === group.id)
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
  })).filter((group) => group.items.length)
}

function AuthorityIndex({ current }) {
  return (
    <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start" aria-label="主线目录">
      <nav className="border-l border-[var(--site-line-strong)] pl-4" aria-label="主线目录">
        <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--site-faint)]">主线目录</p>
        <ol className="m-0 grid list-none gap-1 p-0">
          {SITE_AUTHORITY_LINKS.map((item, index) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={item.href === current ? 'page' : undefined}
                className={`block rounded-md px-3 py-2 no-underline transition-colors ${item.href === current ? 'bg-[var(--site-panel)] text-[var(--site-ink)]' : 'text-[var(--site-muted)] hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]'}`}>
                <span className="mr-2 font-mono text-[10px] opacity-60">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-[13px] font-semibold">{item.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  )
}

function TopicLead({ lead }) {
  return (
    <Link
      href={lead.href}
      className="group flex h-full flex-col rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-4 no-underline transition hover:-translate-y-0.5 hover:border-[var(--site-line-strong)] hover:shadow-[0_8px_22px_rgba(60,50,20,0.08)] hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)]"
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] text-[var(--site-faint)]">
        {lead.date ? <span className="font-mono">{lead.date}</span> : null}
        {lead.section ? (
          <span className="rounded-full bg-black/5 px-2 py-[1px] dark:bg-white/10">{lead.section}</span>
        ) : null}
      </div>
      <h3 className="mb-0 text-[16px] font-semibold leading-snug text-[var(--site-ink)] transition-colors group-hover:text-[var(--site-accent-strong)]">
        {lead.label}
      </h3>
      {lead.note ? (
        <p className="mb-0 mt-1.5 line-clamp-2 text-[13px] leading-6 text-[var(--site-muted)]">{lead.note}</p>
      ) : null}
    </Link>
  )
}

function RecentStrip({ items }) {
  if (!items.length) return null
  return (
    <section className="mb-8" aria-label="最近更新">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="inline-block h-2 w-2 rounded-full bg-[#d9772f]" aria-hidden="true" />
        <h2 className="mb-0 text-[17px] font-bold text-[var(--site-ink)]">最近更新</h2>
        <span className="text-[12px] text-[var(--site-faint)]">按发布时间，持续追加</span>
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex h-full flex-col rounded-xl border border-[#e4d3b4] border-l-[3px] border-l-[#d9772f] bg-[#fff8ec] p-4 no-underline transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(120,80,20,0.12)] hover:no-underline dark:border-[#5a4630] dark:border-l-[#f29a55] dark:bg-[#241b12]"
            >
              <span className="mb-1.5 font-mono text-[11px] text-[#a0763a] dark:text-[#d6a56b]">{item.date}</span>
              <span className="text-[15px] font-semibold leading-snug text-[#2a2214] group-hover:underline dark:text-[#f1e2c8]">{item.label}</span>
              {item.note ? (
                <span className="mt-1.5 line-clamp-2 text-[12.5px] leading-6 text-[#6a5a40] dark:text-[#bda987]">{item.note}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function TopicHubView({ hub }) {
  const sections = hubSections(hub)
  const recent = listHubRecent(hub.slug)
  const latest = latestHubDate(hub, recent)

  return (
    <PageContainer className="grid gap-8 py-6 md:py-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
      <AuthorityIndex current={hub.path} />
      <div className="min-w-0">
        <header className="mb-6 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-faint)]">主线 · Topic</p>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--site-muted)]">
              <span className="rounded-full border border-[var(--site-line)] px-2.5 py-0.5">{hub.leads.length} 条收录</span>
              {latest ? <span className="rounded-full border border-[#e4d3b4] bg-[#fff8ec] px-2.5 py-0.5 text-[#8a5a1a] dark:border-[#5a4630] dark:bg-[#241b12] dark:text-[#d6a56b]">最近更新 {latest}</span> : null}
            </div>
          </div>
          <h1 className="mb-0 mt-3 border-b-0 pb-0 font-serif text-[1.9rem] font-bold leading-tight tracking-wide text-[var(--site-ink)] md:text-[2.3rem]">{hub.title}</h1>
          <p className="mb-0 mt-2 max-w-3xl text-[14.5px] leading-7 text-[var(--site-muted)]">{hub.description}</p>
        </header>

        <RecentStrip items={recent} />

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}-title`} id={`${hub.slug}-${section.id}`}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 id={`${hub.slug}-${section.id}-title`} className="text-[17px] font-bold text-[var(--site-ink)]">{section.title}</h2>
                <p className="text-[12px] text-[var(--site-faint)]">{section.note} · {section.items.length} 条</p>
              </div>
              <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
                {section.items.map((lead) => (
                  <li key={lead.href}>
                    <TopicLead lead={lead} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--site-line)] pt-6 text-[13px] text-[var(--site-muted)]">
          <Link href="/articles" className="hover:text-[var(--site-ink)]">浏览全部内容 ↗</Link>
          <Link href="/about" className="hover:text-[var(--site-ink)]">关于作者 ↗</Link>
          <Link href="/contact" className="hover:text-[var(--site-ink)]">联系 ↗</Link>
        </footer>
      </div>
    </PageContainer>
  )
}
