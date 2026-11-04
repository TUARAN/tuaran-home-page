import Link from 'next/link'

import { TOPIC_HUB_GROUPS, TOPIC_HUB_LIST } from '../../../lib/content/topicHubs'
import PageContainer from '../components/PageContainer'
import WeChatContact from '../components/WeChatContact'

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

function pickFeatured(sections) {
  for (const section of sections) {
    if (section.items[0]) return { sectionId: section.id, item: section.items[0] }
  }
  return null
}

function LeadLink({ lead, index, featured = false }) {
  return (
    <Link
      href={lead.href}
      className={featured
        ? 'group block border-y border-[var(--site-line)] py-8 no-underline'
        : 'group grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 border-b border-[var(--site-line)] py-5 no-underline'}
    >
      {featured ? (
        <>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">先读</p>
          <p className="mt-3 max-w-[36rem] font-serif text-[1.65rem] font-semibold leading-tight text-[var(--site-ink)] md:text-[2rem]">{lead.label}</p>
          <p className="mt-3 max-w-[36rem] border-l-2 border-[var(--site-ink)] pl-4 text-[15px] leading-7 text-[var(--site-muted)]">{lead.note}</p>
          <p className="mt-4 font-mono text-[12px] text-[var(--site-faint)]">打开</p>
        </>
      ) : (
        <>
          <span className="pt-1 font-mono text-[11px] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span>
          <span className="min-w-0">
            <span className="block text-[17px] font-semibold leading-7 text-[var(--site-ink)] group-hover:underline group-hover:decoration-[var(--site-line-strong)] group-hover:underline-offset-4">{lead.label}</span>
            <span className="mt-1 block max-w-[36rem] text-[14px] leading-7 text-[var(--site-muted)]">{lead.note}</span>
          </span>
        </>
      )}
    </Link>
  )
}

export default function TopicHubView({ hub }) {
  const sections = hubSections(hub).map((section) => ({ ...section, items: [...section.items] }))
  const featured = pickFeatured(sections)
  if (featured) {
    const section = sections.find((item) => item.id === featured.sectionId)
    section.items = section.items.filter((lead) => lead.href !== featured.item.href)
  }
  const visibleSections = sections.filter((section) => section.items.length)
  const siblings = TOPIC_HUB_LIST.filter((item) => item.path !== hub.path)

  return (
    <PageContainer className="py-12 md:py-16">
      <header className="max-w-[40rem]">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">{hub.kicker}</p>
        <h1 className="mt-4 font-serif text-[2.4rem] font-semibold leading-[1.15] tracking-wide text-[var(--site-ink)] md:text-[3.1rem]">{hub.title}</h1>
        <p className="mt-5 text-[17px] leading-8 text-[var(--site-muted)]">{hub.description}</p>
        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[12px] text-[var(--site-faint)]">
          <span>共 {hub.leads.length} 条</span>
          {sections.map((section) => (
            <span key={section.id}>{section.title} {section.items.length + (featured?.sectionId === section.id ? 1 : 0)}</span>
          ))}
        </p>
      </header>

      {featured ? (
        <div className="mt-10 max-w-[44rem]">
          <LeadLink lead={featured.item} featured />
        </div>
      ) : null}

      <div className="mt-14 max-w-[44rem] space-y-14">
        {visibleSections.map((section) => (
          <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}`}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 id={`${hub.slug}-${section.id}`} className="text-[15px] font-semibold tracking-wide text-[var(--site-ink)]">{section.title}</h2>
              <span className="font-mono text-[11px] text-[var(--site-faint)]">{String(section.items.length).padStart(2, '0')}</span>
            </div>
            <p className="mb-2 max-w-[32rem] text-[13px] leading-6 text-[var(--site-faint)]">{section.note}</p>
            <ol>
              {section.items.map((lead, index) => (
                <li key={lead.href}>
                  <LeadLink lead={lead} index={index} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <footer className="mt-16 max-w-[44rem] border-t border-[var(--site-line)] pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">同主线</p>
        <nav aria-label="同主线" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {siblings.map((item) => (
            <Link key={item.path} href={item.path} className="text-[14px] text-[var(--site-ink)] underline-offset-4 hover:underline">
              {item.title}
            </Link>
          ))}
          <Link href="/articles" className="text-[14px] text-[var(--site-muted)] underline-offset-4 hover:underline">内容库</Link>
        </nav>
        <div className="mt-5">
          <WeChatContact />
        </div>
      </footer>
    </PageContainer>
  )
}
