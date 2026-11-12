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

function TopicLead({ lead, groupTitle }) {
  return (
    <Link
      href={lead.href}
      className="group block border-b border-[var(--site-line)] bg-transparent no-underline transition-colors last:border-b-0 hover:bg-white/80 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] dark:hover:bg-[#151d27]"
    >
      <div className="px-[0.9rem] py-[0.7rem] md:px-5 md:py-4">
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="shrink-0 text-sm text-[var(--site-faint)]">▪</span>
          {lead.date ? (
            <span className="shrink-0 whitespace-nowrap text-xs text-[var(--site-faint)] dark:text-gray-400">{lead.date}</span>
          ) : null}
          {lead.section ? (
            <span className="inline-flex rounded-full border border-[#d8d5ce] bg-transparent px-2 py-[2px] text-[11px] text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]">
              {lead.section}
            </span>
          ) : null}
          <span className="inline-flex rounded-full border border-[#d8d5ce] bg-transparent px-2 py-[2px] text-[11px] text-[#6f6b63] dark:border-[#373d48] dark:text-[#aeb5c0]">
            {groupTitle}
          </span>
        </div>
        <h3 className="text-[16px] font-semibold leading-snug text-[var(--site-ink)] transition-colors group-hover:text-[var(--site-accent-strong)] md:ml-5 md:text-[17px] md:leading-7">
          {lead.label}
        </h3>
        {lead.note ? (
          <p className="mt-1 line-clamp-1 text-[13px] leading-5 text-[var(--site-muted)] md:ml-5 md:mt-2 md:line-clamp-2 md:text-sm md:leading-relaxed">
            {lead.note}
          </p>
        ) : null}
        <p className="mt-1 text-[11px] text-[var(--site-faint)] md:ml-5 md:mt-2 md:text-[13px]">打开 →</p>
      </div>
    </Link>
  )
}

export default function TopicHubView({ hub }) {
  const sections = hubSections(hub)

  return (
    <PageContainer className="grid gap-8 py-8 md:py-10 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
      <AuthorityIndex current={hub.path} />
      <div className="min-w-0">
        <header className="mb-8 border-b border-[var(--site-line)] pb-6">
          <p className="text-[13px] text-[var(--site-faint)]">主线</p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-wide text-[var(--site-ink)] md:text-3xl">{hub.title}</h1>
            <p className="font-mono text-[12px] text-[var(--site-faint)]">{hub.leads.length} 条</p>
          </div>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--site-muted)]">{hub.description}</p>
          <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[var(--site-ink)]">{hub.standing}</p>
        </header>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}-title`} id={`${hub.slug}-${section.id}`}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--site-line)] pb-2">
                <h2 id={`${hub.slug}-${section.id}-title`} className="text-[17px] font-bold text-[var(--site-ink)]">{section.title}</h2>
                <p className="text-[12px] text-[var(--site-faint)]">{section.note} · {section.items.length} 条</p>
              </div>
              <ul className="m-0 list-none p-0">
                {section.items.map((lead) => (
                  <li key={lead.href}>
                    <TopicLead lead={lead} groupTitle={section.title} />
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
