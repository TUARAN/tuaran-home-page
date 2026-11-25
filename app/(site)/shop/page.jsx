import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import { SHOP_ITEMS, SHOP_PATH } from '../../../lib/shop/shopCatalog'

export const dynamic = 'force-static'

const title = '甄选小店 · ChatGPT 代充与更多服务'
const description =
  '甄选小店：站长自营与甄选的服务入口，目前提供 ChatGPT Plus / Pro 代充，Claude 中转与更多商品陆续上线。'

export const metadata = {
  title,
  description,
  keywords: ['甄选小店', 'ChatGPT 代充', 'ChatGPT Plus', 'Claude 中转', '小店'],
  alternates: { canonical: SHOP_PATH },
  openGraph: {
    title,
    description,
    url: SHOP_PATH,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '甄选小店',
  description,
  url: `https://2aran.com${SHOP_PATH}`,
  hasPart: SHOP_ITEMS.filter((item) => item.status === 'available').map((item) => ({
    '@type': 'Service',
    name: item.title,
    description: item.desc,
    url: item.href,
  })),
}

const STATUS_BADGE = {
  available: { label: '开放购买', className: 'border-[#b8d4bf] bg-[#eef6ef] text-[#3b7053] dark:border-[#355444] dark:bg-[#203329] dark:text-[#b8dfc2]' },
  coming: { label: '即将上线', className: 'border-[#d9d8ce] bg-[#f4f3ea] text-[#858876] dark:border-[#33404d] dark:bg-[#1c2530] dark:text-[#8e9ab0]' },
}

function ShopItemCard({ item, index }) {
  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.coming
  const available = item.status === 'available' && item.href
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="font-mono text-[12px] tracking-[0.16em] text-[#b7791f] dark:text-[#a8ae82]">
          {String(index + 1).padStart(2, '0')}
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-4">
        <h2 className="mb-2 text-[18px] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</h2>
        <p className="mb-0 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">{item.desc}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="text-[12px] leading-5 text-[#606358] before:mr-2 before:text-[#b7791f] before:content-['/'] dark:text-[#aeb8c6] dark:before:text-[#a8ae82]"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 text-[13px] font-semibold">
        {available ? (
          <span className="inline-flex items-center gap-1 text-[#3b7053] dark:text-[#b8dfc2]">
            去购买
            <span aria-hidden="true" className="font-mono">↗</span>
          </span>
        ) : (
          <span className="text-[#858876] dark:text-[#8e9ab0]">购买入口准备中</span>
        )}
      </div>
    </>
  )

  if (available) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        data-analytics-event="shop_item_click"
        data-analytics-destination-id={item.id}
        className="group flex flex-col rounded-2xl border border-[#c7c6bb] bg-[#faf9f3] p-6 no-underline transition hover:-translate-y-0.5 hover:border-[#8a6422] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-[#33404d] dark:bg-[#141b24] dark:hover:border-[#a8ae82] dark:hover:shadow-none"
      >
        {body}
      </a>
    )
  }

  return (
    <div
      aria-label={`${item.title} 即将上线`}
      className="flex flex-col rounded-2xl border border-dashed border-[#c7c6bb] bg-transparent p-6 opacity-80 dark:border-[#33404d]"
    >
      {body}
    </div>
  )
}

export default function ShopPage() {
  return (
    <PageContainer className="py-9 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <section className="mb-10 border-b border-[#d7d6cb] pb-8 dark:border-[#27303a] md:mb-14 md:pb-10">
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:items-end">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0]">
              Shop
            </p>
            <h1 className="mb-0 border-b-0 pb-0 font-serif text-[2rem] font-semibold leading-tight tracking-wide text-[#15140f] dark:text-gray-100 md:text-[2.45rem]">
              甄选小店
            </h1>
          </div>
          <div className="max-w-[560px] md:justify-self-end">
            <p className="mb-0 text-[14px] leading-7 text-[#56564e] dark:text-[#aeb8c6]">
              站长自营与甄选的服务入口。已开放的商品点进去就能下单，还在准备中的商品会先挂在这里占位，上线后补上购买入口。
            </p>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              Catalog
            </p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-[1.55rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
              商品目录
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#9a988e] dark:text-[#6f7a8c]">
            {String(1).padStart(2, '0')} - {String(SHOP_ITEMS.length).padStart(2, '0')}
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {SHOP_ITEMS.map((item, index) => (
            <ShopItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#d7d6cb] bg-[#f7f6ee] p-6 dark:border-[#27303a] dark:bg-[#10151d] md:p-8">
        <h2 className="mb-3 text-[16px] font-semibold text-[#15140f] dark:text-gray-100">关于小店</h2>
        <p className="mb-3 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
          小店只放站长自己用过、能对交付负责的商品。X 账号等更多商品会陆续上架，已购订单的进度与售后都在对应服务页完成。
        </p>
        <p className="mb-0 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
          有问题可以先看
          <Link href="/services" className="mx-1 font-semibold text-[#3b7053] underline-offset-2 hover:underline dark:text-[#b8dfc2]">合作说明</Link>
          或通过
          <Link href="/contact" className="mx-1 font-semibold text-[#3b7053] underline-offset-2 hover:underline dark:text-[#b8dfc2]">联系方式</Link>
          找到我。
        </p>
      </section>
    </PageContainer>
  )
}
