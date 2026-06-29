import Link from 'next/link'

import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import RssBlogroll from './RssBlogroll'
import { RSS_FEEDS_SEED } from '../../../../lib/rssFeedsSeed'

export const dynamic = 'force-static'

export const metadata = {
  title: '我的 RSS 订阅｜关注的博客与周刊',
  description:
    '涂阿燃（tuaran）的 RSS 订阅墙：阮一峰的网络日志等长期关注的博客与周刊，可一键复制 feed 到你的阅读器。',
  keywords: ['RSS 订阅', 'RSS 推荐', '博客订阅', '阮一峰的网络日志', '涂阿燃', 'tuaran', 'blogroll'],
  alternates: {
    canonical: '/resources/rss',
  },
}

export default function RssResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug="rss-blogroll" />
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link
            href="/articles?tab=resources"
            className="underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            资源库
          </Link>
          <span aria-hidden="true">·</span>
          <span>RSS 订阅</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          我的 RSS 订阅
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#666] dark:text-gray-300">
          我长期关注的博客与周刊。点「最新文章」可直接在本页读到该源的近期更新（标题 + 摘要，点进去到原站读全文）；
          也可以点「复制 RSS 链接」丢进你的阅读器（Reeder / Feedly / Folo 等）订阅。
        </p>
        <p className="mt-2 text-xs text-[#999] dark:text-gray-500">
          想订阅本站更新？这里 →{' '}
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-4 hover:text-[#555] dark:hover:text-gray-300"
          >
            2aran.com/rss.xml
          </a>
        </p>
      </header>

      <RssBlogroll fallback={RSS_FEEDS_SEED} />
    </PageContainer>
  )
}
