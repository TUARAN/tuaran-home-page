import Link from 'next/link'

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

export default function TopicHubView({ hub }) {
  return (
    <PageContainer className="py-8 sm:py-10">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--site-muted)]">{hub.kicker}</p>
      <h1 className="mb-3 text-[28px] font-semibold leading-tight text-[var(--site-ink)]">{hub.title}</h1>
      <p className="mb-4 max-w-[720px] text-[15px] leading-7 text-[var(--site-muted)]">{hub.description}</p>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <WeChatContact />
        <Link href="/about" className="text-[13px] text-[var(--site-muted)] underline-offset-4 hover:underline">关于涂阿燃</Link>
        <Link href="/editorial" className="text-[13px] text-[var(--site-muted)] underline-offset-4 hover:underline">内容说明</Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {hub.leads.map((lead) => (
          <li key={lead.href}>
            <Link
              href={lead.href}
              className="block h-full rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-4 no-underline transition hover:-translate-y-0.5 hover:border-[var(--site-line-strong)]"
            >
              <span className="block text-[16px] font-semibold text-[var(--site-ink)]">{lead.label}</span>
              <span className="mt-1 block text-[13px] leading-6 text-[var(--site-muted)]">{lead.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
