import PageContainer from '../components/PageContainer'
import FeedClient from './FeedClient'
import { getAllFeedItems, getFeedTypesPresent } from './data'

export const dynamic = 'force-static'

export const metadata = {
  title: '灵感 · 短平快的图片 / 视频 / 资源 / 观点',
  description:
    '涂阿燃（tuaran）的「灵感」流：短平快地分享有审美的图片、视频、值得一看的资源与一句话观点。AI 影像、设计、工具与碎片灵感的聚合地。',
  keywords: ['灵感', '涂阿燃', 'tuaran', 'AI 影像', 'Midjourney', '设计灵感', '资源分享', '短视频', '审美'],
  alternates: { canonical: '/feed' },
  openGraph: {
    title: '灵感 · 短平快的图片 / 视频 / 资源 / 观点',
    description: '有审美的图片、视频、资源与观点，短平快地分享。',
    url: '/feed',
    type: 'website',
  },
}

export default function FeedPage() {
  const items = getAllFeedItems()
  const typesPresent = getFeedTypesPresent()

  return (
    <PageContainer className="py-10">
      <header className="mb-8 border-b border-[var(--site-line)] pb-5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--site-panel)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
          Inspiration · 灵感流
        </div>
        <h1 className="font-serif text-[32px] leading-tight tracking-wide text-[var(--site-ink)] md:text-[38px]">
          灵感
        </h1>
        <p className="mt-3 max-w-[680px] text-[14px] leading-7 text-[var(--site-muted)]">
          短平快地分享有审美的图片、视频、值得一看的资源，以及一句话观点。
          不求深，求一眼能打动你 —— 看到喜欢的，欢迎转发出去。
        </p>
      </header>

      <FeedClient items={items} typesPresent={typesPresent} />

      <p className="mt-12 border-t border-[var(--site-line)] pt-6 text-center text-[11px] text-[var(--site-muted)]">
        持续更新 · 内容由 TUARAN 精选整理，版权归原作者所有，仅作分享与学习
      </p>
    </PageContainer>
  )
}
