import { Suspense } from 'react'

import RssBlogroll from '../../resources/rss/RssBlogroll'
import { RSS_FEEDS_SEED } from '../../../../lib/rssFeedsSeed'
import CryptoResearchSubnav from '../CryptoResearchSubnav'
import SiteRssSubscribeCard from '../SiteRssSubscribeCard'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'RSS 订阅 · 加密调研',
  description: '订阅 2aran.com，并阅读站长收录的 RSS 源更新。',
  alternates: { canonical: '/crypto-research/rss' },
}

export default function CryptoResearchRssPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <CryptoResearchSubnav active="rss" />
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#16745b] dark:text-[#65c8a9]">CRYPTO RSS</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">RSS 订阅</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#66706c] dark:text-[#a9b5b0]">
          订阅本站更新，或直接在这里读后台收录源的最新条目。点标题去原站看全文。
        </p>
      </header>
      <div className="grid gap-8">
        <SiteRssSubscribeCard />
        <section>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#16745b] dark:text-[#65c8a9]">FEEDS</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">已收录的源</h2>
          <p className="mt-2 mb-5 max-w-2xl text-sm leading-6 text-[#66706c] dark:text-[#a9b5b0]">
            这些是站长在后台加入的订阅。展开即可看最近更新，也可以复制 feed 到你自己的阅读器。
          </p>
          <Suspense fallback={<p className="text-sm text-[#66706c] dark:text-[#a9b5b0]">正在加载订阅墙…</p>}>
            <RssBlogroll fallback={RSS_FEEDS_SEED} />
          </Suspense>
        </section>
      </div>
    </main>
  )
}
