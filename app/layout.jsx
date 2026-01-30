import Script from 'next/script'
import Link from 'next/link'

import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'

const SITE_URL = 'https://tuaran.me'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const SITE_DESCRIPTION = '涂阿燃（tuaran｜掘金安东尼｜安东尼404）的个人网络日志，聚焦前端工程化、SEO、AI 智能体与创作者成长。'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '涂阿燃',
  alternateName: ['tuaran', '掘金安东尼', '安东尼404'],
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
    google: 'google-site-verification-code-if-needed',
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
        <Script
          src="https://analytics.umami.is/script.js"
          data-website-id="8bb48b09-3e10-4ec1-9bbe-c55c87418fa9"
          strategy="afterInteractive"
        />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="8bb48b09-3e10-4ec1-9bbe-c55c87418fa9"
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning>
        <Script id="tuaran-structured-data" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(structuredData)}
        </Script>
        <ThemeProvider>
          <header className="border-b border-[#eee] dark:border-gray-800">
            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="no-underline hover:no-underline opacity-90 hover:opacity-100"
                aria-label="返回首页"
              >
                <div className="text-[#111] dark:text-gray-100 leading-tight inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-xl sm:text-2xl font-semibold">涂阿燃</span>
                  <span className="text-base sm:text-lg text-[#777] dark:text-gray-400 font-normal tracking-wide uppercase">tuaran</span>
                  <span className="text-[#999] dark:text-gray-500" aria-hidden="true">·</span>
                  <span className="text-xl sm:text-2xl text-[#555] dark:text-gray-300 font-semibold tracking-wide">网络日志</span>
                </div>
              </Link>

              <nav aria-label="主导航" className="text-sm text-[#666] dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-2">
                <Link href="/" className="opacity-80 hover:opacity-100 underline underline-offset-4">首页</Link>
                <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">文章</Link>
                <Link href="/reading" className="opacity-80 hover:opacity-100 underline underline-offset-4">读书</Link>
                <Link href="/traffic" className="opacity-80 hover:opacity-100 underline underline-offset-4">访问统计</Link>
                <a
                  href="https://github.com/TUARAN"
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>

          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
