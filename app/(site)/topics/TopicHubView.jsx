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
    author: { '@type': 'Person', name: '涂阿燃', alternateName: 'TUARAN', url: 'https://2aran.com/about' },
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

function TopicLink({ lead, index }) {
  return (
    <Link href={lead.href} className="group grid grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] items-start gap-3 border-b border-[var(--site-line)] py-5 no-underline transition-colors hover:bg-[var(--site-panel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--site-ink)] sm:grid-cols-[3rem_minmax(0,1fr)_2rem] sm:gap-5 sm:px-4 sm:py-6">
      <span aria-hidden="true" className="pt-1 font-mono text-[12px] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span>
      <span>
        <span className="block font-serif text-[1.2rem] font-semibold leading-snug text-[var(--site-ink)] sm:text-[1.4rem]">{lead.label}</span>
        <span className="mt-1.5 block text-[14px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
      </span>
      <span aria-hidden="true" className="pt-1 text-lg text-[var(--site-muted)] transition-transform group-hover:translate-x-1">↗</span>
    </Link>
  )
}

export default function TopicHubView({ hub }) {
  const featured = hub.leads.find((lead) => lead.group === 'essay') || hub.leads[0]
  const sections = TOPIC_HUB_GROUPS.map((group) => ({
    ...group,
    items: hub.leads.filter((lead) => lead.group === group.id && lead !== featured),
  })).filter((group) => group.items.length)

  return (
    <PageContainer className="pb-16 pt-6 md:pb-24 md:pt-12">
      <header className="border-b border-[var(--site-line)] pb-10 md:pb-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--site-muted)]">内容专题 <span aria-hidden="true">/</span> TUARAN</p>
        <div className="mt-7 grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] md:items-end md:gap-16">
          <div>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,5.5rem)] font-semibold leading-[1.1] tracking-tight text-[var(--site-ink)]">{hub.title}</h1>
            <p className="mt-6 max-w-[42rem] text-[16px] leading-8 text-[var(--site-muted)] md:text-[18px]">{hub.description}</p>
          </div>
          <p className="border-l-2 border-[var(--site-ink)] pl-4 text-[13px] leading-6 text-[var(--site-muted)]">{hub.standing}</p>
        </div>
      </header>

      <nav aria-label="同主线" className="border-b border-[var(--site-line)] py-5">
        <p className="mb-3 font-mono text-[11px] tracking-[0.12em] text-[var(--site-faint)]">探索其他专题</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {SITE_AUTHORITY_LINKS.map((item) => {
            const current = item.href === hub.path
            return <Link key={item.href} href={item.href} aria-current={current ? 'page' : undefined} className={`border-b-2 pb-1 text-[13px] font-medium no-underline transition-colors ${current ? 'border-[var(--site-ink)] text-[var(--site-ink)]' : 'border-transparent text-[var(--site-muted)] hover:border-[var(--site-line-strong)] hover:text-[var(--site-ink)]'}`}>{item.label}</Link>
          })}
        </div>
      </nav>

      <section aria-labelledby={`${hub.slug}-start`} className="grid gap-4 border-b border-[var(--site-line)] py-10 md:grid-cols-[minmax(10rem,1fr)_minmax(0,2fr)] md:gap-12 md:py-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.17em] text-[var(--site-faint)]">01 / 推荐起点</p>
          <h2 id={`${hub.slug}-start`} className="mt-2 font-serif text-[1.7rem] font-semibold text-[var(--site-ink)]">从这里开始</h2>
        </div>
        <Link href={featured.href} className="group block rounded-[1.25rem] bg-[var(--site-ink)] p-6 text-[var(--page-bg)] no-underline transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] sm:p-8">
          <span className="font-mono text-[11px] tracking-[0.14em] opacity-70">精选阅读 <span aria-hidden="true">↗</span></span>
          <span className="mt-5 block font-serif text-[1.7rem] font-semibold leading-snug sm:text-[2.2rem]">{featured.label}</span>
          <span className="mt-3 block text-[14px] leading-7 opacity-80">{featured.note}</span>
          <span className="mt-7 inline-block border-b border-current pb-1 text-[13px] font-semibold">开始阅读 <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
        </Link>
      </section>

      <div className="space-y-12 pt-10 md:space-y-16 md:pt-14">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}`} id={`${hub.slug}-${section.id}`} className="grid gap-4 md:grid-cols-[minmax(10rem,1fr)_minmax(0,2fr)] md:gap-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.17em] text-[var(--site-faint)]">{section.id === 'essay' ? '02' : section.id === 'record' ? '03' : '04'} / {String(section.items.length).padStart(2, '0')} 条</p>
              <h2 id={`${hub.slug}-${section.id}`} className="mt-2 font-serif text-[1.7rem] font-semibold text-[var(--site-ink)]">{section.title}</h2>
              <p className="mt-2 max-w-xs text-[13px] leading-6 text-[var(--site-muted)]">{section.note}</p>
            </div>
            <div className="border-t border-[var(--site-line)]">
              {section.items.map((lead, index) => <TopicLink key={lead.href} lead={lead} index={index} />)}
            </div>
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
