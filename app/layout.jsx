import Script from 'next/script'

import './globals.css'
import AnalyticsScripts from './components/AnalyticsScripts'
import LayoutChrome from './components/LayoutChrome'
import { ThemeProvider } from './components/ThemeProvider'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '2aran.com｜涂阿燃（tuaran）的网络日志'
const SITE_DESCRIPTION =
  '2aran.com 是涂阿燃（安东尼）的个人主页与网络日志：前端与 AI 工程化、技术情报、知识库、调研与创作者增长。'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '涂阿燃',
  alternateName: ['2aran.com', 'tuaran', '掘金安东尼', '安东尼404'],
  url: SITE_URL,
  headline: SITE_TITLE,
  description: SITE_DESCRIPTION,
  sameAs: [
    'https://juejin.cn/user/1521379823340792',
    'https://github.com/TUARAN',
    'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e',
  ],
}

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s - ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    '涂阿燃',
    '2aran.com',
    'tuaran',
    'TUARAN',
    '掘金安东尼',
    '安东尼404',
    'SEO',
    '前端博客',
    '前端周刊',
    '前端工程化',
    'AI 智能体',
  ],
  authors: [{ name: '涂阿燃', url: SITE_URL }],
  creator: '涂阿燃',
  publisher: '涂阿燃',
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/tuaranme.png`,
        width: 512,
        height: 512,
        alt: '涂阿燃（掘金安东尼）头像',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: '@Anthony404',
    images: [`${SITE_URL}/tuaranme.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'baidu-site-verification': 'codeva-RnbvKColnM',
    },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body suppressHydrationWarning>
        <Script id="tuaran-structured-data" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(structuredData)}
        </Script>
        <AnalyticsScripts />
        <ThemeProvider>
          <LayoutChrome>{children}</LayoutChrome>
        </ThemeProvider>
      </body>
    </html>
  )
}
