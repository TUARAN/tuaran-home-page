import Link from 'next/link'

import { ContactDialogButton } from '../components/ContactCards'
import PageContainer from '../components/PageContainer'
import { SHOP_ITEMS, SHOP_PATH } from '../../../lib/shop/shopCatalog'
import { WECHAT_CONTACT } from '../../../lib/site/contactChannels'

export const dynamic = 'force-static'

const title = '甄选小店 · ChatGPT 与 Claude 代充'
const description =
  '甄选小店：ChatGPT Plus / Pro 代充与 Claude 代充（离线可验证，1:6.9 汇率，可加微信沟通）已开放购买。只放站长自己用过、能对交付负责的商品。'

export const metadata = {
  title,
  description,
  keywords: ['甄选小店', 'ChatGPT 代充', 'ChatGPT Plus', 'Claude 代充', 'Wokey', '小店'],
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
  // 卡片内有微信按钮时，整卡不能再包在 <a> 里。
  const splitActions = Boolean(item.wechat)
  const body = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-1 -top-4 select-none font-serif text-[88px] font-bold leading-none text-[#b7791f]/10 dark:text-[#a8ae82]/10"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="relative flex items-center gap-3">
        <h2 className="mb-0 text-[20px] font-bold leading-tight text-[#15140f] dark:text-gray-100">{item.title}</h2>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <p className="relative mb-0 mt-2.5 text-[15px] leading-7 text-[#3f3f38] dark:text-gray-300">{item.desc}</p>
      {item.highlights?.length ? (
        <ul className="relative mb-0 mt-3 flex list-none flex-wrap gap-2 p-0">
          {item.highlights.map((highlight) => (
            <li
              key={highlight.label}
              className="m-0 inline-flex items-center gap-1.5 rounded-full border border-[#e3c48e] bg-[#fbf1dc] px-3 py-1 text-[13px] font-semibold leading-5 text-[#7a4f12] dark:border-[#4a3c22] dark:bg-[#2a2216] dark:text-[#e6c88f]"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#b7791f] dark:bg-[#e6c88f]" />
              {highlight.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-[#e4e3d8] pt-3.5 dark:border-[#27303a]">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#efeee3] px-2 py-0.5 text-[12px] leading-5 text-[#5c5f50] dark:bg-[#1c2530] dark:text-[#aeb8c6]"
            >
              {tag}
            </span>
          ))}
        </div>
        {available && splitActions ? (
          <div className="flex flex-wrap items-center gap-2">
            {item.wechat ? (
              <ContactDialogButton className="inline-flex items-center gap-1 rounded-full border border-[#3b7053] bg-transparent px-3.5 py-1.5 text-[13px] font-semibold text-[#3b7053] transition hover:bg-[#eef6ef] dark:border-[#b8dfc2] dark:text-[#b8dfc2] dark:hover:bg-[#203329]">
                加微信 {WECHAT_CONTACT.value}
              </ContactDialogButton>
            ) : null}
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              data-analytics-event="shop_item_click"
              data-analytics-destination-id={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#3b7053] px-3.5 py-1.5 text-[13px] font-semibold text-white no-underline transition hover:bg-[#2f5c44] dark:bg-[#b8dfc2] dark:text-[#10241a]"
            >
              去购买
              <span aria-hidden="true" className="font-mono">↗</span>
            </a>
          </div>
        ) : available ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#3b7053] px-3.5 py-1.5 text-[13px] font-semibold text-white transition group-hover:bg-[#2f5c44] dark:bg-[#b8dfc2] dark:text-[#10241a]">
            去购买
            <span aria-hidden="true" className="font-mono">↗</span>
          </span>
        ) : (
          <span className="text-[13px] font-semibold text-[#858876] dark:text-[#8e9ab0]">购买入口准备中</span>
        )}
      </div>
    </>
  )

  if (available && splitActions) {
    return (
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#c7c6bb] border-t-[3px] border-t-[#b7791f] bg-[#faf9f3] p-5 shadow-[0_2px_10px_rgba(60,50,20,0.05)] dark:border-[#33404d] dark:border-t-[#a8ae82] dark:bg-[#141b24]">
        {body}
      </div>
    )
  }

  if (available) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        data-analytics-event="shop_item_click"
        data-analytics-destination-id={item.id}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#c7c6bb] border-t-[3px] border-t-[#b7791f] bg-[#faf9f3] p-5 no-underline shadow-[0_2px_10px_rgba(60,50,20,0.05)] transition hover:-translate-y-0.5 hover:border-[#8a6422] hover:shadow-[0_10px_28px_rgba(60,50,20,0.12)] dark:border-[#33404d] dark:border-t-[#a8ae82] dark:bg-[#141b24] dark:hover:border-[#a8ae82] dark:hover:shadow-none"
      >
        {body}
      </a>
    )
  }

  return (
    <div
      aria-label={`${item.title} 即将上线`}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-[#c7c6bb] bg-transparent p-5 opacity-80 dark:border-[#33404d]"
    >
      {body}
    </div>
  )
}

export default function ShopPage() {
  return (
    <PageContainer className="py-6 md:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <section className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[#d7d6cb] pb-5 dark:border-[#27303a]">
        <div className="flex items-baseline gap-3">
          <h1 className="mb-0 border-b-0 pb-0 font-serif text-[2.2rem] font-bold leading-none tracking-wide text-[#15140f] dark:text-gray-100 md:text-[2.6rem]">
            甄选小店
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09d8c] dark:text-[#6f7a8c]">
            Shop · {String(SHOP_ITEMS.length).padStart(2, '0')}
          </span>
        </div>
        <p className="mb-0 text-[15px] font-medium leading-7 text-[#3f3f38] dark:text-gray-300">
          只放站长自己用过、能对交付负责的商品。
        </p>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        {SHOP_ITEMS.map((item, index) => (
          <ShopItemCard key={item.id} item={item} index={index} />
        ))}
      </section>

      <p className="mb-0 rounded-xl border border-[#d7d6cb] bg-[#f7f6ee] px-5 py-3.5 text-[14px] leading-7 text-[#51514a] dark:border-[#27303a] dark:bg-[#10151d] dark:text-gray-300">
        X 账号等更多商品会陆续上架，订单进度与售后在对应服务页完成。有问题先看
        <Link href="/services" className="mx-1 font-semibold text-[#3b7053] underline-offset-2 hover:underline dark:text-[#b8dfc2]">合作说明</Link>
        ，或通过
        <Link href="/contact" className="mx-1 font-semibold text-[#3b7053] underline-offset-2 hover:underline dark:text-[#b8dfc2]">联系方式</Link>
        找到我。
      </p>
    </PageContainer>
  )
}
