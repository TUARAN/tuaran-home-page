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
        <span className={`block font-semibold leading-snug text-[var(--site-ink)] ${featured ? 'font-serif text-[1.55rem] md:text-[1.9rem]' : 'text-[1.08rem]'}`}>
          {lead.label}
        </span>
        <span className="mt-3 block text-[14px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
      </span>
      <span aria-hidden="true" className="mt-6 self-end text-xl text-[var(--site-muted)] transition-transform group-hover:translate-x-1">↗</span>
    </Link>
  )
}

function AgentReadingPath({ hub }) {
  const essays = hub.leads.filter((lead) => lead.group === 'essay')
  const further = hub.leads.filter((lead) => lead.group !== 'essay')
  const first = essays[0]

  return (
    <div className="pb-16 md:pb-24">
      <div className="border-b border-[var(--site-line)] py-6">
        <PageContainer>
          <nav aria-label="同主线" className="flex flex-wrap gap-2">
            {SITE_AUTHORITY_LINKS.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.href === hub.path ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-[13px] font-medium no-underline transition-colors ${item.href === hub.path ? 'bg-[var(--site-ink)] text-[var(--page-bg)]' : 'text-[var(--site-muted)] hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </PageContainer>
      </div>

      <PageContainer>
        <header className="grid gap-8 py-12 md:grid-cols-[minmax(0,1fr)_minmax(230px,300px)] md:items-end md:gap-12 md:py-16">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[var(--site-muted)]">主线阅读 · AI AGENTS</p>
            <h1 className="mt-5 font-serif text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[1.08] tracking-tight text-[var(--site-ink)]">{hub.title}</h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[var(--site-muted)] md:text-[18px]">{hub.description}</p>
          </div>
          <div className="border-l-2 border-[var(--site-ink)] pl-5 text-[14px] leading-7 text-[var(--site-muted)]">
            <p className="font-semibold text-[var(--site-ink)]">建议从记忆机制开始</p>
            <p>再看判断结构、开源协作和具体修复。四篇文章组成一条由方法走向实践的阅读路径。</p>
          </div>
        </header>

        <main>
          <section aria-labelledby="agent-reading-heading" className="rounded-[1.75rem] border border-[var(--site-line)] bg-[var(--site-panel)] p-5 sm:p-7 md:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--site-line)] pb-7">
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-[var(--site-muted)]">CURATED READING PATH</p>
                <h2 id="agent-reading-heading" className="mt-2 font-serif text-[1.9rem] font-semibold text-[var(--site-ink)] md:text-[2.4rem]">主线阅读推荐</h2>
              </div>
              <span className="rounded-full border border-[var(--site-line)] px-4 py-2 font-mono text-[12px] text-[var(--site-muted)]">{essays.length} 篇 · 按顺序阅读</span>
            </div>

            <div className="grid gap-5 pt-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
              <Link href={first.href} className="group flex min-h-[300px] flex-col justify-between rounded-2xl bg-[var(--site-ink)] p-7 text-[var(--page-bg)] no-underline transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] md:p-9">
                <span className="font-mono text-[12px] tracking-[0.16em] opacity-70">01 / 从这里开始</span>
                <span>
                  <span className="block font-serif text-[1.9rem] font-semibold leading-tight md:text-[2.4rem]">{first.label}</span>
                  <span className="mt-4 block text-[14px] leading-7 opacity-75">{first.note}。先理解智能体怎样保存、检索和使用信息。</span>
                </span>
                <span className="flex items-center justify-between border-t border-current/20 pt-5 text-[13px] font-semibold">开始阅读 <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">↗</span></span>
              </Link>
              <ol className="divide-y divide-[var(--site-line)]">
                {essays.slice(1).map((lead, index) => (
                  <li key={lead.href}>
                    <Link href={lead.href} className="group flex items-start gap-5 py-5 no-underline first:pt-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)]">
                      <span className="pt-1 font-mono text-[13px] text-[var(--site-muted)]">{String(index + 2).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[1.3rem] font-semibold leading-snug text-[var(--site-ink)] group-hover:underline">{lead.label}</span>
                        <span className="mt-2 block text-[13px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
                      </span>
                      <span aria-hidden="true" className="text-lg text-[var(--site-muted)] transition-transform group-hover:translate-x-1">↗</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section aria-labelledby="agent-further-heading" className="pt-14 md:pt-20">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-[var(--site-muted)]">EXPLORE FURTHER</p>
                <h2 id="agent-further-heading" className="mt-2 font-serif text-[1.8rem] font-semibold text-[var(--site-ink)]">继续探索</h2>
              </div>
              <p className="text-[13px] text-[var(--site-muted)]">贡献记录、著作与完整目录</p>
            </div>
            <ul className="grid gap-3 md:grid-cols-3">
              {further.map((lead) => <li key={lead.href}><TopicLink lead={lead} /></li>)}
            </ul>
          </section>
        </main>
      </PageContainer>
    </div>
  )
}

export default function TopicHubView({ hub }) {
  if (hub.slug === 'ai-agents') return <AgentReadingPath hub={hub} />
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

      <header className="grid gap-6 border-b border-[var(--site-line)] py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 md:py-14">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">主线专题 / {hub.kicker}</p>
          <h1 className="mt-4 font-serif text-[2.7rem] font-semibold leading-tight text-[var(--site-ink)] md:text-[4rem]">{hub.title}</h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[var(--site-muted)]">{hub.description}</p>
        </div>
        <p className="whitespace-nowrap font-mono text-[12px] text-[var(--site-muted)]">{hub.leads.length} 个阅读入口</p>
      </header>

      <div className="space-y-14 pt-10 md:space-y-16 md:pt-14">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`${hub.slug}-${section.id}`} id={`${hub.slug}-${section.id}`}>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div className="flex items-baseline gap-3">
                <h2 className="font-serif text-[1.65rem] font-semibold text-[var(--site-ink)] md:text-[1.9rem]">{section.title}</h2>
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
