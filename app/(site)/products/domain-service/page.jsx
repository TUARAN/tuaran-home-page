import Image from 'next/image'
import Link from 'next/link'
import { IconArrowLeft, IconBrandWechat, IconWorld } from '@tabler/icons-react'

import PageContainer from '../../components/PageContainer'
import { DOMAIN_SERVICE_DOMAINS } from '../../../../lib/workItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '域名服务',
  description: '查看 TUARAN 当前持有的域名；如有购买意向，可扫码添加微信咨询。',
  keywords: ['域名服务', '域名购买', '域名资产', 'TUARAN'],
  alternates: {
    canonical: '/products/domain-service',
  },
}

export default function DomainServicePage() {
  return (
    <PageContainer className="py-5 md:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/works"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--site-muted)] no-underline transition hover:text-[var(--site-ink)]"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          返回产品集
        </Link>

        <header className="grid gap-8 border-b border-[var(--site-line)] pb-10 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a6422] dark:text-[#d4ae66]">
              Domain Portfolio
            </p>
            <h1 className="mb-4 text-[42px] font-black tracking-[-0.05em] text-[var(--site-ink)] md:text-[64px]">
              域名服务
            </h1>
            <p className="mb-0 max-w-2xl text-[16px] leading-8 text-[var(--site-muted)]">
              当前持有 {DOMAIN_SERVICE_DOMAINS.length} 个独立域名，覆盖个人品牌、内容产品、创作者服务与品牌实验。有购买意向可扫码添加微信咨询。
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--site-line)] bg-white/60 p-4 dark:bg-[#111821]/70">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#17181c] text-white dark:bg-[#d9deca] dark:text-[#151713]">
              <IconWorld size={24} stroke={1.7} aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1 text-[11px] text-[var(--site-faint)]">当前持有</p>
              <p className="mb-0 font-mono text-[26px] font-bold leading-none">{DOMAIN_SERVICE_DOMAINS.length}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <section aria-labelledby="domain-list-title">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--site-faint)]">Holdings</p>
                <h2 id="domain-list-title" className="mb-0 border-0 p-0 text-[24px] font-bold">持有域名</h2>
              </div>
              <span className="text-[12px] text-[var(--site-faint)]">不含子域名</span>
            </div>

            <div className="divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
              {DOMAIN_SERVICE_DOMAINS.map((item, index) => (
                <article key={item.domain} className="grid gap-2 py-5 sm:grid-cols-[38px_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                  <span className="font-mono text-[10px] text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="mb-1 border-0 p-0 font-mono text-[16px] font-bold text-[var(--site-ink)]">{item.domain}</h3>
                    <p className="mb-0 text-[12px] leading-5 text-[var(--site-muted)]">{item.role}</p>
                  </div>
                  <span className="w-fit rounded-full border border-[var(--site-line)] px-2.5 py-1 text-[10px] font-semibold text-[var(--site-muted)]">
                    {item.use}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-[var(--site-line)] bg-white/70 p-6 text-center shadow-[0_16px_45px_rgba(34,31,25,0.08)] dark:bg-[#111821]/80 lg:sticky lg:top-[calc(var(--site-header-height)+24px)]">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-[#07a443]/10 px-3 py-1.5 text-[11px] font-bold text-[#078c3a] dark:text-[#4bd17a]">
              <IconBrandWechat size={15} aria-hidden="true" />
              购买咨询
            </div>
            <h2 className="mb-2 border-0 p-0 text-[21px] font-bold">扫码加我微信</h2>
            <p className="mb-5 text-[12px] leading-6 text-[var(--site-muted)]">
              请备注“域名 + 感兴趣的域名”。具体是否出售及价格，以沟通结果为准。
            </p>
            <div className="mx-auto w-fit rounded-2xl border border-[#e1e2dc] bg-white p-3">
              <Image
                src="/qrcodewechat3.png"
                alt="域名购买咨询微信二维码"
                width={180}
                height={180}
                unoptimized
                className="h-[180px] w-[180px] rounded-lg"
              />
            </div>
            <p className="mb-0 mt-4 font-mono text-[12px] font-semibold text-[var(--site-ink)]">微信：atar24</p>
          </aside>
        </div>
      </div>
    </PageContainer>
  )
}
