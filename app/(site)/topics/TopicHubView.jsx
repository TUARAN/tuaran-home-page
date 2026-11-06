import Link from 'next/link'

import { TOPIC_HUB_GROUPS } from '../../../lib/content/topicHubs'
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
    items: hub.leads.filter((lead) => lead.group === group.id),
  })).filter((group) => group.items.length)
}

function TopicLink({ lead, featured = false }) {
  return (
    <Link
      href={lead.href}
      className={`group flex h-full flex-col justify-between rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5 no-underline transition-colors hover:border-[var(--site-line-strong)] hover:bg-[var(--site-panel-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] ${featured ? 'md:p-7' : ''}`}
    >
      <span>
        <span className={`block font-semibold leading-snug text-[var(--site-ink)] ${featured ? 'font-serif text-[1.3rem] md:text-[1.5rem]' : 'text-[1rem]'}`}>
          {lead.label}
        </span>
        <span className="mt-3 block text-[14px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
      </span>
      <span aria-hidden="true" className="mt-6 self-end text-xl text-[var(--site-muted)] transition-transform group-hover:translate-x-1">↗</span>
    </Link>
  )
}

export default function TopicHubView({ hub }) {
  const sections = hubSections(hub)

  return (
    <PageContainer className="pb-16 pt-6 md:pb-24 md:pt-10">
      <nav aria-label="同主线" className="flex flex-wrap gap-2 border-b border-[var(--site-line)] pb-6">
        {SITE_AUTHORITY_LINKS.map((item) => {
          const current = item.href === hub.path
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium no-underline transition-colors ${current ? 'border-[var(--site-ink)] bg-[var(--site-ink)] text-[var(--page-bg)]' : 'border-[var(--site-line)] text-[var(--site-muted)] hover:border-[var(--site-ink)] hover:text-[var(--site-ink)]'}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <header className="grid gap-4 border-b border-[var(--site-line)] py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 md:py-10">
        <div className="max-w-3xl">
          <h1 className="sr-only">{hub.title}</h1>
          <p className="max-w-2xl text-[16px] leading-8 text-[var(--site-muted)]">{hub.description}</p>
        </div>
        <p className="whitespace-nowrap font-mono text-[12px] text-[var(--site-muted)]">{hub.leads.length} 个阅读入口</p>
      </header>

      <div className="space-y-14 pt-10 md:space-y-16 md:pt-14">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}`} id={`${hub.slug}-${section.id}`}>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div className="flex items-baseline gap-3">
                <h2 className="font-serif text-[1.4rem] font-semibold text-[var(--site-ink)] md:text-[1.6rem]">{section.title}</h2>
                <span className="font-mono text-[12px] text-[var(--site-faint)]">{String(section.items.length).padStart(2, '0')}</span>
              </div>
              <p className="text-[13px] text-[var(--site-muted)]">{section.note}</p>
            </div>
            <ul className={`grid gap-3 md:gap-4 ${section.id === 'essay' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {section.items.map((lead, index) => (
                <li key={lead.href} className={section.id === 'essay' && index === 0 ? 'md:col-span-2' : ''}>
                  <TopicLink lead={lead} featured={section.id === 'essay' && index === 0} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--site-line)] pt-6 text-[13px] text-[var(--site-muted)]">
        <Link href="/articles" className="hover:text-[var(--site-ink)]">浏览全部内容 ↗</Link>
        <Link href="/about" className="hover:text-[var(--site-ink)]">关于作者 ↗</Link>
        <Link href="/contact" className="hover:text-[var(--site-ink)]">联系 ↗</Link>
      </footer>
    </PageContainer>
  )
}
