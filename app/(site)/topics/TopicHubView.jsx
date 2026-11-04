import Link from 'next/link'

import { TOPIC_HUB_GROUPS } from '../../../lib/content/topicHubs'
import { SITE_AUTHORITY_LINKS } from '../../../lib/site/siteNav'
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

function readingGuide(sections) {
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]))
  const picked = []
  const push = (section, lead) => {
    if (!section || !lead || picked.some((item) => item.lead.href === lead.href)) return
    picked.push({ section, lead })
  }
  push(byId.essay, byId.essay?.items[0])
  push(byId.essay, byId.essay?.items[1])
  push(byId.record, byId.record?.items[0])
  if (picked.length < 2) push(byId.entry, byId.entry?.items[0])
  return picked.slice(0, 3)
}

function LeadLink({ lead, index }) {
  return (
    <Link
      href={lead.href}
      className="group grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-3 border-b border-[var(--site-line)] py-3.5 no-underline"
    >
      <span className="font-mono text-[11px] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span>
      <span className="min-w-0">
        <span className="block text-[16px] font-semibold leading-6 text-[var(--site-ink)] group-hover:underline group-hover:decoration-[var(--site-line-strong)] group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4">{lead.label}</span>
        <span className="mt-0.5 block text-[13px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
      </span>
    </Link>
  )
}

function ReadingGuide({ hub, guide }) {
  if (guide.length < 2) return null
  return (
    <section aria-labelledby={`${hub.slug}-guide`} className="mt-8 border-l-2 border-[var(--site-ink)] pl-4">
      <h2 id={`${hub.slug}-guide`} className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">导读</h2>
      <ol className="mt-3">
        {guide.map(({ section, lead }, index) => (
          <li key={`${section.id}-${lead.href}`} className={index === 0 ? '' : 'mt-3 border-t border-[var(--site-line)] pt-3'}>
            <Link href={lead.href} className="group block no-underline">
              <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--site-faint)]">{section.title}</span>
              <span className={index === 0
                ? 'mt-1 block font-serif text-[1.35rem] font-semibold leading-snug text-[var(--site-ink)] group-hover:underline group-hover:decoration-[var(--site-line-strong)] group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4 md:text-[1.5rem]'
                : 'mt-1 block text-[16px] font-semibold leading-6 text-[var(--site-ink)] group-hover:underline group-hover:decoration-[var(--site-line-strong)] group-hover:underline-offset-4 group-focus-visible:underline group-focus-visible:underline-offset-4'}>
                {lead.label}
              </span>
              <span className="mt-1 block text-[13px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

function TopicRail({ hub, sections, entries }) {
  return (
    <aside
      aria-label="本线索引"
      className="mt-12 border-t border-[var(--site-line)] pt-8 lg:sticky lg:top-[calc(var(--site-header-height)+1.25rem)] lg:mt-0 lg:max-h-[calc(100dvh-var(--site-header-height)-2.5rem)] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">量级</p>
        <p className="mt-2 font-serif text-[2.4rem] font-semibold leading-none text-[var(--site-ink)]">
          {hub.leads.length}
          <span className="ml-2 align-middle font-sans text-[13px] font-medium tracking-normal text-[var(--site-muted)]">条</span>
        </p>
        <ul className="mt-3">
          {sections.map((section) => (
            <li key={section.id} className="border-b border-[var(--site-line)]">
              <a href={`#${hub.slug}-${section.id}`} className="flex items-baseline justify-between gap-3 py-2 text-[14px] text-[var(--site-ink)] no-underline hover:underline hover:underline-offset-4">
                <span>{section.title}</span>
                <span className="font-mono text-[12px] text-[var(--site-faint)]">{section.items.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-[var(--site-line)] pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">作者</p>
        <p className="mt-2 text-[15px] font-semibold text-[var(--site-ink)]">涂阿燃</p>
        <p className="font-mono text-[11px] tracking-[0.14em] text-[var(--site-faint)]">TUARAN</p>
        {hub.standing ? <p className="mt-2 text-[13px] leading-6 text-[var(--site-muted)]">{hub.standing}</p> : null}
        <Link href="/about" className="mt-2 inline-block text-[13px] text-[var(--site-ink)] underline-offset-4 hover:underline focus-visible:underline">关于</Link>
        <div className="mt-3">
          <WeChatContact />
        </div>
      </div>

      <nav aria-label="相关入口" className="mt-6 border-t border-[var(--site-line)] pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">相关入口</p>
        <ul className="mt-2">
          {entries.map((lead) => (
            <li key={lead.href} className="border-b border-[var(--site-line)]">
              <Link href={lead.href} className="block py-2 no-underline">
                <span className="block text-[14px] font-semibold leading-6 text-[var(--site-ink)] hover:underline hover:underline-offset-4">{lead.label}</span>
                <span className="mt-0.5 block text-[12px] leading-5 text-[var(--site-muted)]">{lead.note}</span>
              </Link>
            </li>
          ))}
          <li className="border-b border-[var(--site-line)]">
            <Link href="/articles" className="block py-2 text-[14px] text-[var(--site-ink)] no-underline hover:underline hover:underline-offset-4">内容库</Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default function TopicHubView({ hub }) {
  const sections = hubSections(hub)
  const guide = readingGuide(sections)
  const entries = sections.find((section) => section.id === 'entry')?.items || []

  return (
    <PageContainer className="py-8 md:py-10">
      <nav aria-label="同主线" className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-[var(--site-line)] pb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--site-faint)]">同主线</span>
        {SITE_AUTHORITY_LINKS.map((item) => {
          const current = item.href === hub.path
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={current
                ? 'text-[14px] font-semibold text-[var(--site-ink)] underline decoration-[var(--site-ink)] underline-offset-4'
                : 'text-[14px] text-[var(--site-muted)] underline-offset-4 hover:text-[var(--site-ink)] hover:underline focus-visible:underline'}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-x-12 xl:gap-x-16">
        <div className="min-w-0">
          <header>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">{hub.kicker}</p>
            <h1 className="mt-3 font-serif text-[2.15rem] font-semibold leading-[1.12] tracking-wide text-[var(--site-ink)] md:text-[2.7rem]">{hub.title}</h1>
            <p className="mt-4 text-[16px] leading-7 text-[var(--site-muted)]">{hub.description}</p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-[var(--site-faint)] lg:hidden">
              <span>共 {hub.leads.length} 条</span>
              {sections.map((section) => (
                <span key={section.id}>{section.title} {section.items.length}</span>
              ))}
            </p>
          </header>

          <ReadingGuide hub={hub} guide={guide} />

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}`}>
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <h2 id={`${hub.slug}-${section.id}`} className="text-[15px] font-semibold tracking-wide text-[var(--site-ink)]">{section.title}</h2>
                  <span className="font-mono text-[11px] text-[var(--site-faint)]">{String(section.items.length).padStart(2, '0')}</span>
                </div>
                <p className="mb-1 text-[13px] leading-6 text-[var(--site-faint)]">{section.note}</p>
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
        </div>

        <TopicRail hub={hub} sections={sections} entries={entries} />
      </div>
    </PageContainer>
  )
}
