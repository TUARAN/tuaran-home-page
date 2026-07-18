import Script from 'next/script'

import GuoqiGuodanClient from './GuoqiGuodanClient'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/guoqi-guodan'
const TITLE = '国企过单是什么意思？走单、空转贸易、融资性贸易全流程与风险详解'
const DESCRIPTION = '深度拆解国企与民企“过单”的定义、三类交易场景、双方动机、四流核验、融资性贸易与空转走单风险，以及合规供应链业务的判断边界。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    '过单是什么意思',
    '国企过单',
    '走单',
    '空转贸易',
    '融资性贸易',
    '国企贸易风险',
    '供应链贸易合规',
    '四流一致',
  ],
  alternates: { canonical: '/guoqi-guodan' },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    publishedTime: '2026-07-18T00:00:00.000+08:00',
    modifiedTime: '2026-07-18T00:00:00.000+08:00',
    authors: ['涂阿燃 / Tuaran'],
    locale: 'zh_CN',
    images: [{
      url: '/images/guoqi-guodan/og.png',
      width: 1731,
      height: 909,
      alt: '国企“过单”是什么意思：走单、空转贸易、融资性贸易',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: '一页看懂“货、权、钱、票、险”：什么是正常供应链，什么可能是融资性贸易或空转走单。',
    images: ['/images/guoqi-guodan/og.png'],
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: 'zh-CN',
  datePublished: '2026-07-18',
  dateModified: '2026-07-18',
  author: { '@type': 'Person', name: '涂阿燃 / Tuaran', url: 'https://2aran.com/about' },
  publisher: { '@type': 'Person', name: '涂阿燃 / Tuaran' },
  mainEntityOfPage: PAGE_URL,
  about: ['国企贸易合规', '融资性贸易', '空转贸易', '供应链业务'],
}

export default function GuoqiGuodanPage() {
  return (
    <>
      <Script id="guoqi-guodan-structured-data" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <GuoqiGuodanClient />
    </>
  )
}
