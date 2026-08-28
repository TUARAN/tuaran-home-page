import Link from 'next/link'
import { IconArrowUpRight, IconNetwork } from '@tabler/icons-react'

import { SECONDARY_SITES } from '../../../lib/secondarySites'
import { getDomainRecord } from '../../../lib/domainRegistry'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '二级站点',
  description: '前端周看、AI 分发大师、AI 排行榜、中国诗词与 WorkBuddy 资源入口。',
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
          浏览技术周刊、使用创作工具、查阅诗词和学习资源。迁移中的站点保留原站入口。
        </p>
        <p className="mt-3 max-w-[820px] border-l-2 border-[var(--site-green)] pl-4 text-[13px] leading-7 text-[var(--site-muted)]">
          各站的账号与燃币支持范围见对应说明。AI 分发大师保留原账号权益，燃币余额与签到使用主站账户。
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

      <section className="divide-y divide-[var(--site-line)] py-6 md:py-8" aria-label="二级站点列表">
        {SECONDARY_SITES.map((site, index) => {
          const infrastructure = getDomainRecord(site.domain)
          const isActive = infrastructure?.status === 'active'
          return (
          <a
            key={site.id}
            href={site.href}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow group relative grid gap-4 py-5 pr-12 no-underline transition-colors hover:bg-[color-mix(in_srgb,var(--site-green)_4%,transparent)] md:grid-cols-[52px_minmax(170px,0.8fr)_minmax(260px,1.3fr)_auto] md:items-center md:px-4 md:py-6"
          >
            <p className="font-mono text-[10px] tracking-[0.16em] text-[var(--site-faint)]">
              {String(index + 1).padStart(2, '0')}
            </p>

            <div>
              <p className="text-[10px] font-medium text-[var(--site-green)]">{site.category}</p>
              <h2 className="mt-1 text-[19px] font-semibold text-[var(--site-ink)]">{site.label}</h2>
              <p className="mt-0.5 font-mono text-[10px] text-[var(--site-faint)]">{site.domain}</p>
            </div>

            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-6 text-[var(--site-ink)]">{site.desc}</p>
              <p className="mt-1 line-clamp-1 text-[12px] leading-5 text-[var(--site-muted)]">{site.detail}</p>
              {site.accessNote && <p className="mt-2 text-[12px] leading-6 text-[var(--site-muted)]">{site.accessNote}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-[var(--site-faint)]">
                <span className={isActive ? 'text-[var(--site-green)]' : 'text-[#8a5a14] dark:text-[#d6b56f]'}>
                  ● {isActive ? '已上线' : '子域待启用'}
                </span>
                <span>{site.actionLabel || '打开子站'}</span>
              </div>
            </div>

            <span className="absolute right-0 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--site-line)] text-[var(--site-muted)] transition group-hover:border-[var(--site-green)] group-hover:bg-[var(--site-green)] group-hover:text-white md:static">
              <IconArrowUpRight size={16} stroke={1.7} aria-hidden="true" />
            </span>
          </a>
          )
        })}
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
