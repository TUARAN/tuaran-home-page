import Link from 'next/link'
import { IconArrowUpRight, IconExternalLink, IconNetwork } from '@tabler/icons-react'

import { SECONDARY_SITES } from '../../../lib/secondarySites'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '二级站点',
  description: '2aran.com 的公开子域站点入口：AI 排行榜、GPT Plus 充值与中国诗词。',
  alternates: { canonical: '/sites' },
}

const siteListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'TUARAN 二级站点',
  numberOfItems: SECONDARY_SITES.length,
  itemListElement: SECONDARY_SITES.map((site, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: site.label,
    url: site.href,
  })),
}

export default function SecondarySitesPage() {
  return (
    <PageContainer className="py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteListSchema) }} />

      <header className="border-b border-[var(--site-line)] pb-9 md:pb-11">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--site-green)]">
            <IconNetwork size={18} stroke={1.7} aria-hidden="true" />
            TUARAN SITE NETWORK
          </div>
          <Link href="/help#about-site" className="text-[12px] text-[var(--site-muted)] no-underline hover:text-[var(--site-ink)]">
            返回站点帮助 →
          </Link>
        </div>
        <h1 className="mt-4 font-serif text-[36px] font-semibold leading-tight text-[var(--site-ink)] md:text-[48px]">
          二级站点
        </h1>
        <p className="mt-4 max-w-[760px] text-[15px] leading-8 text-[var(--site-muted)]">
          2aran.com 下可公开访问的子域站点。仅收录面向访客的内容与服务站点，不包含后台、内部工具和接口域名。
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-1.5 font-mono text-[11px] text-[var(--site-muted)]">
            {SECONDARY_SITES.length} 个公开站点
          </span>
          {[...new Set(SECONDARY_SITES.map((site) => site.category))].map((category) => (
            <span key={category} className="rounded-full border border-[var(--site-line)] px-3 py-1.5 text-[11px] text-[var(--site-faint)]">
              {category}
            </span>
          ))}
        </div>
      </header>

      <section className="grid gap-4 py-8 md:grid-cols-2 md:py-10" aria-label="二级站点列表">
        {SECONDARY_SITES.map((site, index) => (
          <a
            key={site.id}
            href={site.href}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow group flex min-h-[250px] flex-col rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-6 no-underline transition hover:-translate-y-0.5 hover:border-[var(--site-line-strong)] hover:shadow-[0_18px_48px_rgba(36,40,32,0.08)] md:p-7 dark:hover:shadow-[0_18px_48px_rgba(0,0,0,0.24)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--site-faint)]">
                  {String(index + 1).padStart(2, '0')} · {site.category}
                </p>
                <h2 className="mt-3 text-[23px] font-semibold text-[var(--site-ink)]">{site.label}</h2>
                <p className="mt-1 font-mono text-[11px] text-[var(--site-faint)]">{site.domain}</p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--site-line)] text-[var(--site-muted)] transition group-hover:border-[var(--site-green)] group-hover:bg-[var(--site-green)] group-hover:text-white">
                <IconArrowUpRight size={19} stroke={1.7} aria-hidden="true" />
              </span>
            </div>

            <p className="mt-5 text-[15px] font-medium leading-7 text-[var(--site-ink)]">{site.desc}</p>
            <p className="mt-2 flex-1 text-[13px] leading-7 text-[var(--site-muted)]">{site.detail}</p>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--site-line)] pt-4">
              {site.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-[color-mix(in_srgb,var(--site-green)_8%,transparent)] px-2 py-1 text-[10px] text-[var(--site-muted)]">
                  {tag}
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[var(--site-accent)]">
                访问站点 <IconExternalLink size={13} stroke={1.7} aria-hidden="true" />
              </span>
            </div>
          </a>
        ))}
      </section>

      <footer className="border-t border-[var(--site-line)] pt-6 text-[13px] leading-7 text-[var(--site-muted)]">
        2aran.com 是内容与个人信息的总入口。产品合作与技术服务可查看{' '}
        <Link href="/services" className="font-medium text-[var(--site-ink)] underline underline-offset-4">
          合作说明
        </Link>
        。
      </footer>
    </PageContainer>
  )
}
