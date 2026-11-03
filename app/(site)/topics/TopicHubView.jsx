import Link from 'next/link'

import { TOPIC_HUB_GROUPS } from '../../../lib/content/topicHubs'
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

export default function TopicHubView({ hub }) {
  const sections = hubSections(hub)
  return (
    <PageContainer className="py-10 md:py-14">
      <header className="max-w-[44rem] border-b border-[var(--site-line)] pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">{hub.kicker}</p>
        <h1 className="mt-3 font-serif text-[2.15rem] font-semibold leading-tight tracking-wide text-[var(--site-ink)] md:text-[2.65rem]">{hub.title}</h1>
        <p className="mt-4 text-[16px] leading-8 text-[var(--site-muted)]">{hub.description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link href="/editorial" className="text-[13px] text-[var(--site-muted)] underline-offset-4 hover:underline">内容说明</Link>
          <Link href="/about" className="text-[13px] text-[var(--site-muted)] underline-offset-4 hover:underline">关于涂阿燃</Link>
          <WeChatContact />
        </div>
      </header>

      <div className="mt-10 max-w-[44rem] space-y-12">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}`}>
            <div className="mb-1 flex items-baseline justify-between gap-4">
              <h2 id={`${hub.slug}-${section.id}`} className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">{section.title}</h2>
              <span className="font-mono text-[11px] text-[var(--site-faint)]">{section.items.length}</span>
            </div>
            <ol className="border-t border-[var(--site-line)]">
              {section.items.map((lead, index) => (
                <li key={lead.href}>
                  <Link
                    href={lead.href}
                    className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-[var(--site-line)] py-4 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--site-panel)_72%,transparent)]"
                  >
                    <span className="pt-1 font-mono text-[11px] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="block text-[17px] font-semibold leading-7 text-[var(--site-ink)]">{lead.label}</span>
                      <span className="mt-1 block text-[13px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
                    </span>
                    <span className="pt-1.5 text-[13px] text-[var(--site-faint)]" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
